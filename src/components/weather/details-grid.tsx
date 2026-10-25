"use client";

import {
  Thermometer,
  Droplets,
  Wind,
  Sun,
  Gauge,
  Eye,
  Sunrise,
  Umbrella,
  type LucideIcon,
} from "lucide-react";
import type { WeatherResponse } from "@/lib/weather";
import { compassDir, uvLabel, formatHour, unitSymbols, humidityComfort } from "@/lib/weather";

interface DetailsGridProps {
  weather: WeatherResponse;
  units: "c" | "f";
}

interface Tile {
  label: string;
  value: string;
  sub?: string;
  icon: LucideIcon;
}

export function DetailsGrid({ weather, units }: DetailsGridProps) {
  const { current, daily, hourly } = weather;
  const u = unitSymbols(units);

  // visibility at the current hour (meters → km / miles)
  const cur = new Date(current.time).getTime();
  let vIdx = 0;
  for (let i = 0; i < hourly.time.length; i++) {
    if (new Date(hourly.time[i]).getTime() <= cur) vIdx = i;
    else break;
  }
  const visM = hourly.visibility?.[vIdx];
  const visibility =
    visM == null
      ? "—"
      : units === "c"
        ? `${(visM / 1000).toFixed(1)} km`
        : `${(visM / 1609.34).toFixed(1)} mi`;

  const uv = daily.uv_index_max?.[0];

  const tiles: Tile[] = [
    {
      label: "Feels like",
      value: `${Math.round(current.apparent_temperature)}${u.temp}`,
      sub: uvLabelSafe(uv),
      icon: Thermometer,
    },
    {
      label: "Humidity",
      value: `${current.relative_humidity_2m}%`,
      sub: humidityComfort(current.relative_humidity_2m),
      icon: Droplets,
    },
    {
      label: "Wind",
      value: `${Math.round(current.wind_speed_10m)} ${u.wind}`,
      sub: `From ${compassDir(current.wind_direction_10m)}`,
      icon: Wind,
    },
    {
      label: "UV index",
      value: uv != null ? `${Math.round(uv)}` : "—",
      sub: uv != null ? uvLabel(uv) : undefined,
      icon: Sun,
    },
    {
      label: "Pressure",
      value: `${Math.round(current.surface_pressure)} hPa`,
      sub: "Surface pressure",
      icon: Gauge,
    },
    {
      label: "Visibility",
      value: visibility,
      sub: "At current hour",
      icon: Eye,
    },
    {
      label: "Precipitation",
      value: `${current.precipitation} mm`,
      sub: `${daily.precipitation_probability_max?.[0] ?? 0}% chance today`,
      icon: Umbrella,
    },
    {
      label: "Sunrise",
      value: formatHour(daily.sunrise[0]),
      sub: `Sunset ${formatHour(daily.sunset[0])}`,
      icon: Sunrise,
    },
  ];

  return (
    <section aria-label="Weather details" className="rounded-3xl border border-white/25 bg-white/15 p-5 shadow-xl backdrop-blur-xl">
      <h2 className="mb-4 text-xs font-semibold tracking-wider text-white/70 uppercase">Conditions</h2>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {tiles.map((t) => (
          <div
            key={t.label}
            className="rounded-2xl border border-white/20 bg-white/10 p-3.5 transition-colors hover:bg-white/20"
          >
            <div className="mb-2 flex items-center gap-1.5 text-white/70">
              <t.icon className="h-4 w-4" aria-hidden="true" />
              <span className="text-[11px] font-medium tracking-wide">{t.label}</span>
            </div>
            <p className="text-lg font-semibold text-white">{t.value}</p>
            {t.sub && <p className="mt-0.5 truncate text-[11px] text-white/60">{t.sub}</p>}
          </div>
        ))}
      </div>
    </section>
  );
}

function uvLabelSafe(uv: number | undefined): string | undefined {
  return uv != null && uv >= 8 ? "Feels hotter" : undefined;
}
