"use client";

import {
  Sun,
  Moon,
  CloudSun,
  CloudMoon,
  Cloud,
  CloudFog,
  CloudDrizzle,
  CloudRain,
  CloudRainWind,
  CloudSnow,
  CloudLightning,
  CloudHail,
  Snowflake,
  type LucideIcon,
} from "lucide-react";
import { wmoInfo } from "@/lib/weather";

const DAY_ICONS: Record<string, LucideIcon> = {
  clear: Sun,
  "mostly-clear": Sun,
  partly: CloudSun,
  cloudy: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  "heavy-rain": CloudRainWind,
  showers: CloudDrizzle,
  snow: CloudSnow,
  "heavy-snow": Snowflake,
  thunder: CloudLightning,
  hail: CloudHail,
};

const NIGHT_ICONS: Record<string, LucideIcon> = {
  ...DAY_ICONS,
  clear: Moon,
  "mostly-clear": Moon,
  partly: CloudMoon,
  showers: CloudRain,
};

interface WeatherIconProps {
  code: number;
  isDay?: boolean;
  className?: string;
  strokeWidth?: number;
}

export function WeatherIcon({ code, isDay = true, className, strokeWidth = 1.75 }: WeatherIconProps) {
  const { icon } = wmoInfo(code);
  const map = isDay ? DAY_ICONS : NIGHT_ICONS;
  const Icon = map[icon] ?? Cloud;
  return <Icon className={className} strokeWidth={strokeWidth} aria-hidden="true" />;
}
