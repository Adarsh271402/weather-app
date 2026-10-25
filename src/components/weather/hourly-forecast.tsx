"use client";

import { Droplets } from "lucide-react";
import type { WeatherResponse } from "@/lib/weather";
import { hourlySlice, formatHour } from "@/lib/weather";
import { WeatherIcon } from "./weather-icon";

interface HourlyForecastProps {
  weather: WeatherResponse;
}

export function HourlyForecast({ weather }: HourlyForecastProps) {
  const { times, temps, codes, probs, days } = hourlySlice(weather, 24);

  return (
    <section
      aria-label="Hourly forecast"
      className="rounded-3xl border border-white/25 bg-white/15 p-5 shadow-xl backdrop-blur-xl"
    >
      <h2 className="mb-4 text-xs font-semibold tracking-wider text-white/70 uppercase">Hourly forecast</h2>
      <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-2">
        {times.map((t, i) => (
          <div
            key={t}
            className="flex w-[74px] shrink-0 flex-col items-center gap-1.5 rounded-2xl border border-white/20 bg-white/10 py-3.5 transition-colors hover:bg-white/20"
          >
            <span className="text-xs font-medium text-white/80">
              {i === 0 ? "Now" : formatHour(t)}
            </span>
            <WeatherIcon code={codes[i]} isDay={days[i] === 1} className="h-7 w-7 text-white" />
            <span className="text-sm font-semibold text-white">{temps[i]}°</span>
            <span
              className={`flex h-4 items-center text-[10px] text-sky-100/90 ${probs[i] >= 20 ? "opacity-100" : "opacity-0"}`}
              aria-label={`${probs[i]}% chance of precipitation`}
            >
              <Droplets className="mr-0.5 h-3 w-3" />
              {probs[i]}%
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
