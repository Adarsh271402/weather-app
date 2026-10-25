"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, RefreshCw, CloudSun, AlertTriangle } from "lucide-react";
import { SkyBackground } from "@/components/weather/sky-background";
import { SearchBar } from "@/components/weather/search-bar";
import { HourlyForecast } from "@/components/weather/hourly-forecast";
import { DailyForecast } from "@/components/weather/daily-forecast";
import { DetailsGrid } from "@/components/weather/details-grid";
import { SunMoonCard } from "@/components/weather/sun-moon-card";
import { AirQualityCard } from "@/components/weather/air-quality-card";
import { WeatherIcon } from "@/components/weather/weather-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { GeoLocation, WeatherResponse } from "@/lib/weather";
import { wmoInfo, getSkyTheme, formatLongDate, unitSymbols } from "@/lib/weather";

const DEFAULT_LOCATION: GeoLocation = {
  id: 2643743,
  name: "London",
  admin1: "England",
  country: "United Kingdom",
  countryCode: "GB",
  latitude: 51.50853,
  longitude: -0.12574,
};

const LS = {
  loc: "skycast:last-location",
  recents: "skycast:recents",
  units: "skycast:units",
};

function cloudDensity(code: number): "light" | "medium" | "heavy" {
  if (code <= 1) return "light";
  if (code === 2 || code === 45 || code === 48) return "medium";
  return "heavy";
}

export default function Home() {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [weather, setWeather] = useState<WeatherResponse | null>(null);
  const [units, setUnits] = useState<"c" | "f">("c");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [recents, setRecents] = useState<GeoLocation[]>([]);
  const [locating, setLocating] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const { toast } = useToast();
  const bootedRef = useRef(false);

  const fetchWeather = useCallback(async (loc: GeoLocation, u: "c" | "f", showSpinner = false) => {
    if (showSpinner) setRefreshing(true);
    setStatus("loading");
    try {
      const res = await fetch(`/api/weather?lat=${loc.latitude}&lon=${loc.longitude}&units=${u}`);
      if (!res.ok) throw new Error("bad response");
      const data: WeatherResponse = await res.json();
      setWeather(data);
      setStatus("ready");
    } catch {
      setStatus("error");
    } finally {
      setRefreshing(false);
    }
  }, []);

  // ── Boot: restore saved prefs, pick the initial location ──
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    let fallbackNeeded = true;
    try {
      const u = localStorage.getItem(LS.units);
      if (u === "f") setUnits("f");
      const r = localStorage.getItem(LS.recents);
      if (r) setRecents(JSON.parse(r));
      const l = localStorage.getItem(LS.loc);
      if (l) {
        setLocation(JSON.parse(l));
        fallbackNeeded = false;
      }
    } catch {
      /* corrupted storage — ignore */
    }
    if (!fallbackNeeded) return;

    const startGeolocation = () => {
      if (!navigator.geolocation) {
        setLocation(DEFAULT_LOCATION);
        return;
      }
      setLocating(true);
      navigator.geolocation.getCurrentPosition(
        async (pos) => {
          try {
            const res = await fetch(
              `/api/geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
            );
            const data = await res.json();
            if (data.result) {
              setLocation(data.result);
            } else {
              throw new Error("no result");
            }
          } catch {
            setLocation({
              id: "geo",
              name: "My Location",
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            });
          } finally {
            setLocating(false);
          }
        },
        () => {
          // Permission denied or unavailable — silently fall back
          setLocating(false);
          setLocation(DEFAULT_LOCATION);
        },
        { timeout: 6000, maximumAge: 300000 }
      );
    };
    startGeolocation();
  }, []);

  // ── Refetch whenever location or units change ──
  useEffect(() => {
    if (location) fetchWeather(location, units);
  }, [location, units, fetchWeather]);

  const selectLocation = useCallback((loc: GeoLocation) => {
    setLocation(loc);
    try {
      localStorage.setItem(LS.loc, JSON.stringify(loc));
      setRecents((prev) => {
        const next = [
          loc,
          ...prev.filter((p) => !(p.latitude === loc.latitude && p.longitude === loc.longitude)),
        ].slice(0, 5);
        localStorage.setItem(LS.recents, JSON.stringify(next));
        return next;
      });
    } catch {
      /* storage unavailable */
    }
  }, []);

  const changeUnits = useCallback((u: "c" | "f") => {
    setUnits(u);
    try {
      localStorage.setItem(LS.units, u);
    } catch {
      /* storage unavailable */
    }
  }, []);

  const useMyLocation = useCallback(() => {
    if (!navigator.geolocation) {
      toast({
        title: "Geolocation unavailable",
        description: "Your browser does not support location services. Try searching for a city.",
        variant: "destructive",
      });
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `/api/geocode?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}`
          );
          const data = await res.json();
          if (data.result) {
            selectLocation(data.result);
          } else {
            throw new Error("no result");
          }
        } catch {
          selectLocation({
            id: "geo",
            name: "My Location",
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        toast({
          title: "Location access denied",
          description: "Enable location permission in your browser, or search for a city instead.",
          variant: "destructive",
        });
      },
      { timeout: 8000, maximumAge: 300000 }
    );
  }, [selectLocation, toast]);

  const isDay = weather ? weather.current.is_day === 1 : true;
  const code = weather?.current.weather_code ?? 0;
  const theme = getSkyTheme(code, isDay);
  const fade = {
    initial: { opacity: 0, y: 18 },
    animate: { opacity: 1, y: 0 },
  };

  return (
    <div
      className={`relative flex min-h-screen flex-col bg-gradient-to-br ${theme} text-white transition-colors duration-700`}
    >
      <SkyBackground density={cloudDensity(code)} isDay={isDay} />

      {/* ── Header ── */}
      <header className="mx-auto flex w-full max-w-5xl flex-col gap-4 px-4 pt-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/30 bg-white/15 shadow-lg backdrop-blur-xl">
              <CloudSun className="h-5 w-5 text-white" aria-hidden="true" />
            </span>
            <span className="text-lg font-bold tracking-tight">
              Sky<span className="font-light">Cast</span>
            </span>
          </div>
          <UnitsToggle units={units} onChange={changeUnits} className="md:hidden" />
        </div>
        <div className="flex items-center justify-center gap-3 md:flex-1 md:justify-end">
          <SearchBar
            onSelect={selectLocation}
            recents={recents}
            onUseMyLocation={useMyLocation}
            locating={locating}
          />
          <UnitsToggle units={units} onChange={changeUnits} className="hidden md:flex" />
        </div>
      </header>

      {/* ── Main ── */}
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-6 px-4 py-8">
        {status === "error" && (
          <section
            aria-live="polite"
            className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-white/25 bg-white/15 p-8 text-center shadow-xl backdrop-blur-xl"
          >
            <AlertTriangle className="h-10 w-10 text-amber-200" aria-hidden="true" />
            <div>
              <h1 className="text-lg font-semibold">Couldn&apos;t load the weather</h1>
              <p className="mt-1 text-sm text-white/70">
                Something went wrong while fetching live data. Check your connection and try again.
              </p>
            </div>
            <button
              onClick={() => location && fetchWeather(location, units, true)}
              className="flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-sky-600 shadow-lg transition-transform hover:scale-105 active:scale-95"
            >
              <RefreshCw className="h-4 w-4" /> Try again
            </button>
          </section>
        )}

        {status !== "error" && !weather && (
          <div aria-busy="true" aria-label="Loading weather" className="space-y-6">
            <div className="rounded-[2rem] border border-white/25 bg-white/15 p-6 shadow-xl backdrop-blur-xl sm:p-8">
              <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="space-y-3">
                  <Skeleton className="h-7 w-48 bg-white/25" />
                  <Skeleton className="h-4 w-32 bg-white/20" />
                  <Skeleton className="h-24 w-52 bg-white/20 sm:h-28" />
                  <Skeleton className="h-5 w-40 bg-white/20" />
                </div>
                <Skeleton className="h-28 w-28 rounded-full bg-white/20 sm:h-36 sm:w-36" />
              </div>
            </div>
            <Skeleton className="h-44 w-full rounded-3xl bg-white/15" />
            <div className="grid gap-6 lg:grid-cols-2">
              <Skeleton className="h-80 w-full rounded-3xl bg-white/15" />
              <Skeleton className="h-80 w-full rounded-3xl bg-white/15" />
            </div>
          </div>
        )}

        {weather && status === "ready" && (
          <div key={`${location?.id ?? "loc"}-${weather.current.time.slice(0, 13)}`}>
            {/* Hero current-conditions card */}
            <motion.section
              {...fade}
              transition={{ duration: 0.45, ease: "easeOut" }}
              aria-label="Current weather"
              className="relative rounded-[2rem] border border-white/25 bg-white/15 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
            >
              <button
                onClick={() => location && fetchWeather(location, units, true)}
                aria-label="Refresh weather"
                title="Refresh"
                className="absolute right-4 top-4 rounded-full border border-white/25 bg-white/10 p-2 text-white/80 transition-colors hover:bg-white/25 hover:text-white"
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              </button>

              <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 shrink-0 text-white/80" aria-hidden="true" />
                    <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                      {location?.name ?? "—"}
                    </h1>
                  </div>
                  <p className="mt-1 text-sm text-white/70">
                    {[location?.admin1, location?.country].filter(Boolean).join(", ") ||
                      weather.timezone}
                  </p>
                  <p className="text-sm text-white/60">{formatLongDate(weather.current.time)}</p>

                  <div className="mt-6 flex items-start">
                    <span className="text-8xl leading-none font-extralight tracking-tighter sm:text-9xl">
                      {Math.round(weather.current.temperature_2m)}
                    </span>
                    <span className="mt-2 text-3xl font-light text-white/85">
                      {unitSymbols(units).temp}
                    </span>
                  </div>

                  <p className="mt-3 text-lg font-medium">{wmoInfo(code).label}</p>
                  <p className="mt-1 text-sm text-white/70">
                    Feels like {Math.round(weather.current.apparent_temperature)}° · H{" "}
                    {Math.round(weather.daily.temperature_2m_max[0])}° · L{" "}
                    {Math.round(weather.daily.temperature_2m_min[0])}°
                  </p>
                </div>
                <WeatherIcon
                  code={code}
                  isDay={isDay}
                  className="h-28 w-28 shrink-0 drop-shadow-[0_8px_24px_rgba(255,255,255,0.35)] sm:h-36 sm:w-36"
                  strokeWidth={1.2}
                />
              </div>
            </motion.section>

            {/* Hourly strip */}
            <motion.div {...fade} transition={{ duration: 0.45, delay: 0.08, ease: "easeOut" }}>
              <HourlyForecast weather={weather} />
            </motion.div>

            {/* 7-day + details */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div {...fade} transition={{ duration: 0.45, delay: 0.16, ease: "easeOut" }}>
                <DailyForecast weather={weather} />
              </motion.div>
              <motion.div {...fade} transition={{ duration: 0.45, delay: 0.24, ease: "easeOut" }}>
                <DetailsGrid weather={weather} units={units} />
              </motion.div>
            </div>

            {/* Sun path + air quality */}
            <div className="grid gap-6 lg:grid-cols-2">
              <motion.div {...fade} transition={{ duration: 0.45, delay: 0.3, ease: "easeOut" }}>
                <SunMoonCard weather={weather} isDay={isDay} />
              </motion.div>
              <motion.div {...fade} transition={{ duration: 0.45, delay: 0.36, ease: "easeOut" }}>
                {weather.air_quality ? (
                  <AirQualityCard air={weather.air_quality} />
                ) : (
                  <div className="flex h-full min-h-40 items-center justify-center rounded-3xl border border-white/20 bg-white/10 p-5 text-sm text-white/60 backdrop-blur-xl">
                    Air quality data unavailable for this location
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </main>

      {/* ── Footer (sticky bottom) ── */}
      <footer className="mt-auto pb-[calc(1rem+env(safe-area-inset-bottom))] pt-2">
        <div className="mx-auto flex w-full max-w-5xl flex-col items-center justify-between gap-1 px-4 text-center text-xs text-white/60 sm:flex-row sm:text-left">
          <p>SkyCast — real-time weather with beautiful UI and location search</p>
          <p>Data by Open-Meteo · Built with Next.js, React &amp; Tailwind CSS</p>
        </div>
      </footer>
    </div>
  );
}

function UnitsToggle({
  units,
  onChange,
  className = "",
}: {
  units: "c" | "f";
  onChange: (u: "c" | "f") => void;
  className?: string;
}) {
  return (
    <div
      role="group"
      aria-label="Temperature units"
      className={`shrink-0 overflow-hidden rounded-full border border-white/30 bg-white/15 shadow-lg backdrop-blur-xl ${className}`}
    >
      {(["c", "f"] as const).map((u) => (
        <button
          key={u}
          onClick={() => onChange(u)}
          aria-pressed={units === u}
          className={`px-3.5 py-2 text-sm font-semibold transition-colors ${
            units === u ? "bg-white text-sky-600" : "text-white hover:bg-white/20"
          }`}
        >
          °{u.toUpperCase()}
        </button>
      ))}
    </div>
  );
}
