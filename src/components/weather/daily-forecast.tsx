"use client";

import { Droplets } from "lucide-react";
import type { WeatherResponse } from "@/lib/weather";
import { formatDayLabel } from "@/lib/weather";
import { WeatherIcon } from "./weather-icon";

interface DailyForecastProps {
  weather: WeatherResponse;
}

export function DailyForecast({ weather }: DailyForecastProps) {
  const { daily } = weather;
  const weekMin = Math.min(...daily.temperature_2m_min);
  const weekMax = Math.max(...daily.temperature_2m_max);
  const span = Math.max(weekMax - weekMin, 1);

  return (
    <section
      aria-label="7 day forecast"
      className="rounded-3xl border border-white/25 bg-white/15 p-5 shadow-xl backdrop-blur-xl"
    >
      <h2 className="mb-2 text-xs font-semibold tracking-wider text-white/70 uppercase">7-day forecast</h2>
      <ul className="divide-y divide-white/10">
        {daily.time.map((t, i) => {
          const min = Math.round(daily.temperature_2m_min[i]);
          const max = Math.round(daily.temperature_2m_max[i]);
          const left = ((daily.temperature_2m_min[i] - weekMin) / span) * 100;
          const width = ((daily.temperature_2m_max[i] - daily.temperature_2m_min[i]) / span) * 100;
          const prob = daily.precipitation_probability_max?.[i] ?? 0;
          return (
            <li key={t} className="flex items-center gap-3 py-2.5">
              <span className="w-12 shrink-0 text-sm font-medium text-white">
                {formatDayLabel(t, i)}
              </span>
              <WeatherIcon
                code={daily.weather_code[i]}
                className="h-6 w-6 shrink-0 text-white"
                aria-hidden="true"
              />
              <span
                className={`flex w-11 shrink-0 items-center text-xs text-sky-100/90 ${prob >= 20 ? "opacity-100" : "opacity-0"}`}
              >
                <Droplets className="mr-0.5 h-3 w-3" />
                {prob}%
              </span>
              <span className="w-9 shrink-0 text-right text-sm text-white/70">{min}°</span>
              <span className="relative h-1.5 flex-1 overflow-hidden rounded-full bg-white/20">
                <span
                  className="absolute h-full rounded-full bg-gradient-to-r from-sky-200 via-amber-200 to-amber-400"
                  style={{ left: `${left}%`, width: `${Math.max(width, 6)}%` }}
                />
              </span>
              <span className="w-9 shrink-0 text-sm font-semibold text-white">{max}°</span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
