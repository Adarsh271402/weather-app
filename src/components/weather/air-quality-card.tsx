"use client";

import { Wind } from "lucide-react";
import type { AirQuality } from "@/lib/weather";
import { aqiInfo } from "@/lib/weather";

interface AirQualityCardProps {
  air: AirQuality;
}

// European AQI scale 0–100+ mapped to the marker position (cap at 120 for display)
const SCALE_MAX = 120;

export function AirQualityCard({ air }: AirQualityCardProps) {
  const { label, color } = aqiInfo(air.european_aqi);
  const markerLeft = Math.min((air.european_aqi / SCALE_MAX) * 100, 100);

  return (
    <section
      aria-label="Air quality"
      className="rounded-3xl border border-white/25 bg-white/15 p-5 shadow-xl backdrop-blur-xl"
    >
      <h2 className="mb-4 text-xs font-semibold tracking-wider text-white/70 uppercase">
        Air quality
      </h2>

      <div className="flex items-end gap-3">
        <span className="text-4xl font-semibold leading-none text-white">
          {air.european_aqi}
        </span>
        <span className={`pb-0.5 text-sm font-semibold ${color}`}>{label}</span>
        <Wind className="ml-auto h-4 w-4 text-white/50" aria-hidden="true" />
      </div>

      {/* scale */}
      <div className="relative mt-4 h-2 rounded-full bg-gradient-to-r from-emerald-400 via-amber-300 to-rose-500">
        <span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-white/30 shadow-lg backdrop-blur"
          style={{ left: `${markerLeft}%` }}
          aria-hidden="true"
        />
      </div>
      <div className="mt-1 flex justify-between text-[10px] font-medium text-white/55">
        <span>Good</span>
        <span>Moderate</span>
        <span>Poor</span>
      </div>

      {/* particulate matter breakdown */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
          <p className="text-[11px] font-medium text-white/60">PM2.5</p>
          <p className="mt-0.5 text-lg font-semibold text-white">
            {air.pm2_5} <span className="text-xs font-normal text-white/60">µg/m³</span>
          </p>
        </div>
        <div className="rounded-2xl border border-white/20 bg-white/10 p-3">
          <p className="text-[11px] font-medium text-white/60">PM10</p>
          <p className="mt-0.5 text-lg font-semibold text-white">
            {air.pm10} <span className="text-xs font-normal text-white/60">µg/m³</span>
          </p>
        </div>
      </div>
    </section>
  );
}
