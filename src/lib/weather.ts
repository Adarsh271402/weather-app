// ─── Shared weather types & helpers ───────────────────────────────────────────

export interface GeoLocation {
  id: number | string;
  name: string;
  admin1?: string | null;
  country?: string | null;
  countryCode?: string | null;
  latitude: number;
  longitude: number;
}

export interface AirQuality {
  european_aqi: number;
  pm2_5: number;
  pm10: number;
}

export interface WeatherResponse {
  current: {
    time: string;
    temperature_2m: number;
    relative_humidity_2m: number;
    apparent_temperature: number;
    is_day: number;
    precipitation: number;
    weather_code: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    surface_pressure: number;
  };
  air_quality?: AirQuality;
  hourly: {
    time: string[];
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
    is_day: number[];
    visibility: number[];
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
    precipitation_probability_max: number[];
    wind_speed_10m_max: number[];
  };
  timezone: string;
  utc_offset_seconds: number;
}

// WMO weather interpretation codes → label + icon key
const WMO: Record<number, { label: string; icon: string }> = {
  0: { label: "Clear sky", icon: "clear" },
  1: { label: "Mainly clear", icon: "mostly-clear" },
  2: { label: "Partly cloudy", icon: "partly" },
  3: { label: "Overcast", icon: "cloudy" },
  45: { label: "Foggy", icon: "fog" },
  48: { label: "Freezing fog", icon: "fog" },
  51: { label: "Light drizzle", icon: "drizzle" },
  53: { label: "Drizzle", icon: "drizzle" },
  55: { label: "Heavy drizzle", icon: "drizzle" },
  56: { label: "Freezing drizzle", icon: "drizzle" },
  57: { label: "Heavy freezing drizzle", icon: "drizzle" },
  61: { label: "Light rain", icon: "rain" },
  63: { label: "Rain", icon: "rain" },
  65: { label: "Heavy rain", icon: "heavy-rain" },
  66: { label: "Freezing rain", icon: "rain" },
  67: { label: "Heavy freezing rain", icon: "heavy-rain" },
  71: { label: "Light snow", icon: "snow" },
  73: { label: "Snow", icon: "snow" },
  75: { label: "Heavy snow", icon: "heavy-snow" },
  77: { label: "Snow grains", icon: "snow" },
  80: { label: "Light showers", icon: "showers" },
  81: { label: "Showers", icon: "rain" },
  82: { label: "Violent showers", icon: "heavy-rain" },
  85: { label: "Snow showers", icon: "snow" },
  86: { label: "Heavy snow showers", icon: "heavy-snow" },
  95: { label: "Thunderstorm", icon: "thunder" },
  96: { label: "Storm with hail", icon: "thunder" },
  99: { label: "Severe thunderstorm", icon: "thunder" },
};

export function wmoInfo(code: number): { label: string; icon: string } {
  return WMO[code] ?? { label: "Unknown", icon: "partly" };
}

// Dynamic sky theme per condition — used for the page background gradient
export function getSkyTheme(code: number, isDay: boolean): string {
  if (!isDay) {
    if (code >= 95) return "from-slate-950 via-slate-900 to-slate-950";
    if (code >= 51) return "from-slate-950 via-sky-950 to-slate-900";
    return "from-slate-950 via-blue-950 to-slate-900";
  }
  if (code >= 95) return "from-slate-600 via-slate-700 to-slate-900";
  if (code >= 71 && code <= 86) return "from-sky-300 via-slate-400 to-slate-500";
  if (code >= 51) return "from-slate-500 via-sky-700 to-slate-800";
  if (code === 3 || code === 45 || code === 48) return "from-slate-400 via-slate-500 to-slate-600";
  if (code === 2) return "from-sky-400 via-sky-500 to-blue-600";
  return "from-sky-400 via-sky-500 to-blue-600";
}

export function compassDir(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  return dirs[Math.round(deg / 22.5) % 16];
}

export function uvLabel(uv: number): string {
  if (uv < 3) return "Low";
  if (uv < 6) return "Moderate";
  if (uv < 8) return "High";
  if (uv < 11) return "Very high";
  return "Extreme";
}

// European AQI bands → label + tailwind text/bg color pair
export function aqiInfo(aqi: number): { label: string; color: string } {
  if (aqi <= 20) return { label: "Good", color: "text-emerald-300" };
  if (aqi <= 40) return { label: "Fair", color: "text-lime-300" };
  if (aqi <= 60) return { label: "Moderate", color: "text-amber-300" };
  if (aqi <= 80) return { label: "Poor", color: "text-orange-400" };
  if (aqi <= 100) return { label: "Very poor", color: "text-rose-400" };
  return { label: "Extremely poor", color: "text-rose-500" };
}

export function humidityComfort(rh: number): string {
  if (rh < 30) return "Air feels dry";
  if (rh < 60) return "Comfortable";
  if (rh < 80) return "Feels humid";
  return "Very humid";
}

// Astronomical moon phase (synodic month approximation, epoch 2000-01-06 18:14 UTC)
export function moonPhase(date: Date): { name: string; illumination: number; emojiPhase: number } {
  const synodic = 29.53058867;
  const knownNewMoon = Date.UTC(2000, 0, 6, 18, 14);
  const days = (date.getTime() - knownNewMoon) / 86_400_000;
  const phase = (((days % synodic) + synodic) % synodic) / synodic; // 0..1
  const illumination = Math.round(((1 - Math.cos(2 * Math.PI * phase)) / 2) * 100);
  const names = [
    "New Moon",
    "Waxing Crescent",
    "First Quarter",
    "Waxing Gibbous",
    "Full Moon",
    "Waning Gibbous",
    "Last Quarter",
    "Waning Crescent",
  ];
  const idx = Math.round(phase * 8) % 8;
  return { name: names[idx], illumination, emojiPhase: idx };
}

// "2026-10-25T14:00" → "14:00" (times are already in the location's local tz)
export function formatHour(iso: string): string {
  return iso.slice(11, 16);
}

export function formatDayLabel(iso: string, index: number): string {
  if (index === 0) return "Today";
  const d = new Date(iso + "T12:00:00");
  return d.toLocaleDateString("en-US", { weekday: "short" });
}

export function formatLongDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
}

// Pick the hourly slice starting from the current hour ("Now" tile)
export function hourlySlice(w: WeatherResponse, count = 24) {
  const cur = new Date(w.current.time).getTime();
  let idx = 0;
  for (let i = 0; i < w.hourly.time.length; i++) {
    if (new Date(w.hourly.time[i]).getTime() <= cur) idx = i;
    else break;
  }
  const times: string[] = [];
  const temps: number[] = [];
  const codes: number[] = [];
  const probs: number[] = [];
  const days: number[] = [];
  for (let i = idx; i < Math.min(idx + count, w.hourly.time.length); i++) {
    times.push(w.hourly.time[i]);
    temps.push(Math.round(w.hourly.temperature_2m[i]));
    codes.push(w.hourly.weather_code[i]);
    probs.push(w.hourly.precipitation_probability?.[i] ?? 0);
    days.push(w.hourly.is_day?.[i] ?? 1);
  }
  return { times, temps, codes, probs, days };
}

export function unitSymbols(units: "c" | "f") {
  return {
    temp: units === "c" ? "°C" : "°F",
    wind: units === "c" ? "km/h" : "mph",
  };
}
