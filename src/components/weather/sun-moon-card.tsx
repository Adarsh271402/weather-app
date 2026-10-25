"use client";

import { Sunrise, Moon } from "lucide-react";
import type { WeatherResponse } from "@/lib/weather";
import { formatHour, moonPhase } from "@/lib/weather";

interface SunMoonCardProps {
  weather: WeatherResponse;
  isDay: boolean;
}

export function SunMoonCard({ weather, isDay }: SunMoonCardProps) {
  const { daily, current } = weather;
  const sunrise = daily.sunrise[0];
  const sunset = daily.sunset[0];

  const rise = new Date(sunrise).getTime();
  const set = new Date(sunset).getTime();
  const now = new Date(current.time).getTime();
  const span = Math.max(set - rise, 1);
  const fraction = Math.min(Math.max((now - rise) / span, 0), 1);
  const dayMinutes = Math.round(span / 60000);
  const dayLen = `${Math.floor(dayMinutes / 60)}h ${dayMinutes % 60}m`;

  // point along an elliptical arc: rx=130, ry=75, center (150,100)
  const angle = Math.PI * fraction;
  const x = 150 - 130 * Math.cos(angle);
  const y = 100 - 75 * Math.sin(angle);

  const moon = moonPhase(new Date(current.time));
  // draw the moon as a CSS-shaded circle matching the phase (0..1)
  const phaseDeg = moon.illumination >= 99 ? 180 : Math.round(moon.illumination * 1.8);

  return (
    <section
      aria-label="Sun and moon"
      className="rounded-3xl border border-white/25 bg-white/15 p-5 shadow-xl backdrop-blur-xl"
    >
      <h2 className="mb-4 text-xs font-semibold tracking-wider text-white/70 uppercase">Sun &amp; Moon</h2>

      <div className="relative">
        <svg viewBox="0 0 300 115" className="w-full" role="img" aria-label="Sun path across the sky">
          {/* horizon */}
          <line x1="8" y1="100" x2="292" y2="100" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
          {/* track */}
          <path
            d="M 20 100 A 130 75 0 0 1 280 100"
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="2"
            strokeDasharray="4 6"
          />
          {/* progress arc */}
          {fraction > 0 && fraction < 1 && (
            <path
              d="M 20 100 A 130 75 0 0 1 280 100"
              fill="none"
              stroke="rgba(253,224,71,0.9)"
              strokeWidth="2.5"
              pathLength={100}
              strokeDasharray={`${fraction * 100} 100`}
            />
          )}
          {/* sun / moon marker */}
          {isDay ? (
            <g>
              <circle cx={x} cy={y} r="14" fill="rgba(253,224,71,0.35)" />
              <circle cx={x} cy={y} r="8" fill="#fde047" />
            </g>
          ) : (
            <g>
              <circle cx={fraction >= 1 ? 280 : 20} cy="100" r="7" fill="rgba(226,232,240,0.9)" />
            </g>
          )}
        </svg>
        <div className="mt-1 flex items-center justify-between text-xs text-white/75">
          <span className="flex items-center gap-1">
            <Sunrise className="h-3.5 w-3.5" aria-hidden="true" />
            {formatHour(sunrise)}
          </span>
          <span className="text-white/60">Daylight {dayLen}</span>
          <span className="flex items-center gap-1">
            {formatHour(sunset)}
            <Sunrise className="h-3.5 w-3.5 -scale-x-100" aria-hidden="true" />
          </span>
        </div>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-2xl border border-white/20 bg-white/10 p-3">
        {/* CSS moon with phase shading */}
        <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 shadow-inner">
          <span
            className="absolute inset-0 rounded-full bg-slate-900"
            style={{ clipPath: `inset(0 ${phaseDeg}% 0 0)` }}
            aria-hidden="true"
          />
          <Moon className="relative h-4 w-4 text-slate-500" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-white">{moon.name}</p>
          <p className="text-xs text-white/65">{moon.illumination}% illuminated tonight</p>
        </div>
      </div>
    </section>
  );
}
