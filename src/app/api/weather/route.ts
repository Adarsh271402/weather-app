import { NextRequest, NextResponse } from "next/server";
import { fetchWithRetry } from "@/lib/fetch-retry";

// Simple in-memory cache to avoid hammering the upstream API
const cache = new Map<string, { data: unknown; expires: number }>();
const TTL = 10 * 60 * 1000; // 10 minutes

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "");
  const lon = parseFloat(searchParams.get("lon") ?? "");
  const units = searchParams.get("units") === "f" ? "f" : "c";

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || lat < -90 || lat > 90 || lon < -180 || lon > 180) {
    return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
  }

  const key = `w:${lat.toFixed(2)}:${lon.toFixed(2)}:${units}`;
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) {
    return NextResponse.json(hit.data);
  }

  const url = new URL("https://api.open-meteo.com/v1/forecast");
  url.searchParams.set("latitude", String(lat));
  url.searchParams.set("longitude", String(lon));
  url.searchParams.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m,surface_pressure"
  );
  url.searchParams.set("hourly", "temperature_2m,weather_code,precipitation_probability,is_day,visibility");
  url.searchParams.set(
    "daily",
    "weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,uv_index_max,precipitation_probability_max,wind_speed_10m_max"
  );
  url.searchParams.set("temperature_unit", units === "f" ? "fahrenheit" : "celsius");
  url.searchParams.set("wind_speed_unit", units === "f" ? "mph" : "kmh");
  url.searchParams.set("timezone", "auto");
  url.searchParams.set("forecast_days", "7");

  try {
    // Fetch forecast + air quality in parallel; AQ failure is non-fatal
    const aqiUrl = new URL("https://air-quality-api.open-meteo.com/v1/air-quality");
    aqiUrl.searchParams.set("latitude", String(lat));
    aqiUrl.searchParams.set("longitude", String(lon));
    aqiUrl.searchParams.set("current", "european_aqi,pm2_5,pm10");
    aqiUrl.searchParams.set("timezone", "auto");

    const [weatherRes, aqiRes] = await Promise.allSettled([
      fetchWithRetry(url.toString(), {}, { retries: 3, timeoutMs: 12000 }),
      fetchWithRetry(aqiUrl.toString(), {}, { retries: 2, timeoutMs: 8000 }),
    ]);

    if (weatherRes.status === "rejected" || !weatherRes.value.ok) {
      return NextResponse.json({ error: "Weather service unavailable" }, { status: 502 });
    }
    const data = await weatherRes.value.json();

    if (aqiRes.status === "fulfilled" && aqiRes.value.ok) {
      try {
        const aq = await aqiRes.value.json();
        const cur = aq?.current;
        if (cur && typeof cur.european_aqi === "number") {
          data.air_quality = {
            european_aqi: Math.round(cur.european_aqi),
            pm2_5: Math.round(cur.pm2_5 ?? 0),
            pm10: Math.round(cur.pm10 ?? 0),
          };
        }
      } catch {
        /* air quality optional — ignore parse errors */
      }
    }

    cache.set(key, { data, expires: Date.now() + TTL });
    return NextResponse.json(data);
  } catch (err) {
    console.error("[weather] fetch failed after retries:", err);
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 502 });
  }
}
