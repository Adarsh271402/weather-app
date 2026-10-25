import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/lib/fetch-retry";

const cache = new Map<string, { data: unknown; expires: number }>();
const TTL = 24 * 60 * 60 * 1000; // 24 hours — city lists rarely change

interface NominatimAddress {
  city?: string;
  town?: string;
  village?: string;
  county?: string;
  state?: string;
  country?: string;
  country_code?: string;
}

// GET /api/geocode?q=london        → forward search (Open-Meteo geocoding)
// GET /api/geocode?lat=..&lon=..   → reverse search (Nominatim / OSM)
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.trim();
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");

  // ── Reverse geocoding for "use my location" ──
  if (Number.isFinite(lat) && Number.isFinite(lon)) {
    const rKey = `rg:${lat.toFixed(2)}:${lon.toFixed(2)}`;
    const rHit = cache.get(rKey);
    if (rHit && rHit.expires > Date.now()) return NextResponse.json(rHit.data);

    try {
      const res = await fetchWithRetry(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`,
        { headers: { "User-Agent": "SkyCastWeatherApp/1.0 (portfolio demo)" } },
        { retries: 2, timeoutMs: 8000 }
      );
      if (!res.ok) throw new Error("reverse failed");
      const data = (await res.json()) as { name?: string; address?: NominatimAddress };
      const a = data.address ?? {};
      const payload = {
        result: {
          id: "geo",
          name: a.city ?? a.town ?? a.village ?? a.county ?? data.name ?? "My Location",
          admin1: a.state ?? null,
          country: a.country ?? null,
          countryCode: (a.country_code ?? "").toUpperCase() || null,
          latitude: lat,
          longitude: lon,
        },
      };
      cache.set(rKey, { data: payload, expires: Date.now() + TTL });
      return NextResponse.json(payload);
    } catch {
      // Graceful fallback — coordinates still work for the forecast
      return NextResponse.json({
        result: {
          id: "geo",
          name: "My Location",
          admin1: null,
          country: null,
          countryCode: null,
          latitude: lat,
          longitude: lon,
        },
      });
    }
  }

  // ── Forward geocoding for the search box ──
  if (!q || q.length < 2) {
    return NextResponse.json({ results: [] });
  }

  const key = `g2:${q.toLowerCase()}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return NextResponse.json(hit.data);

  try {
    const url = new URL("https://geocoding-api.open-meteo.com/v1/search");
    url.searchParams.set("name", q);
    url.searchParams.set("count", "6");
    url.searchParams.set("language", "en");
    url.searchParams.set("format", "json");

    const res = await fetchWithRetry(url.toString(), {}, { retries: 3, timeoutMs: 8000 });
    if (!res.ok) {
      console.error("[geocode] upstream not ok:", res.status);
      return NextResponse.json({ results: [] });
    }

    const data = await res.json();
    const results = (data.results ?? []).map(
      (r: {
        id: number;
        name: string;
        latitude: number;
        longitude: number;
        country?: string;
        country_code?: string;
        admin1?: string;
      }) => ({
        id: r.id,
        name: r.name,
        admin1: r.admin1 ?? null,
        country: r.country ?? null,
        countryCode: r.country_code ?? null,
        latitude: r.latitude,
        longitude: r.longitude,
      })
    );
    const payload = { results };
    // Only cache successful, non-empty lookups (avoid poisoning the cache
    // with a transient upstream failure); empty results live 30s at most.
    if (results.length > 0) {
      cache.set(key, { data: payload, expires: Date.now() + TTL });
    } else {
      cache.set(key, { data: payload, expires: Date.now() + 30_000 });
    }
    return NextResponse.json(payload);
  } catch (err) {
    console.error("[geocode] fetch failed after retries:", err);
    return NextResponse.json({ results: [] });
  }
}
