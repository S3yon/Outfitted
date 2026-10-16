import { weekdayShort } from "./week.ts";

export type Warmth = "cold" | "cool" | "mild" | "warm" | "hot";

export type DayWeather = {
  date: string; // YYYY-MM-DD, local to the forecast's place
  high: number; // °C
  low: number;
  rainChance: number; // %
  wind: number; // km/h
  words: string;
  warmth: Warmth;
};

// A day with at least this rain chance counts as rainy in the summary.
const RAINY = 50;

const DAILY = [
  "temperature_2m_max",
  "temperature_2m_min",
  "precipitation_probability_max",
  "weather_code",
  "wind_speed_10m_max",
];

// Open-Meteo forecast: no key, 7 days, dates in the place's own time zone.
export function forecastUrl(lat: number, lon: number): string {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    daily: DAILY.join(","),
    forecast_days: "7",
    timezone: "auto",
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

// WMO weather interpretation codes, grouped into a few words.
export function weatherWords(code: number): string {
  if (code === 0) return "Clear";
  if (code === 1 || code === 2) return "Partly cloudy";
  if (code === 3) return "Cloudy";
  if (code === 45 || code === 48) return "Fog";
  if (code >= 51 && code <= 57) return "Drizzle";
  if (code >= 61 && code <= 67) return "Rain";
  if ((code >= 71 && code <= 77) || code === 85 || code === 86) return "Snow";
  if (code >= 80 && code <= 82) return "Showers";
  if (code >= 95 && code <= 99) return "Thunderstorm";
  return "Unknown";
}

export function warmthBand(high: number): Warmth {
  if (high < 5) return "cold";
  if (high < 14) return "cool";
  if (high < 21) return "mild";
  if (high < 28) return "warm";
  return "hot";
}

function num(list: unknown, i: number): number {
  const value = Array.isArray(list) ? list[i] : null;
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

export function parseForecast(body: unknown): DayWeather[] {
  const daily = (body as { daily?: Record<string, unknown> } | null)?.daily;
  const time = daily?.time;
  if (!Array.isArray(time)) return [];

  return time.map((date: string, i) => {
    const high = Math.round(num(daily!.temperature_2m_max, i));
    return {
      date,
      high,
      low: Math.round(num(daily!.temperature_2m_min, i)),
      rainChance: Math.round(num(daily!.precipitation_probability_max, i)),
      wind: Math.round(num(daily!.wind_speed_10m_max, i)),
      words: weatherWords(num(daily!.weather_code, i)),
      warmth: warmthBand(high),
    };
  });
}

// One line for the steps list: "7 days, 4°-14°, rain Thu, Sun".
export function weatherSummary(days: DayWeather[]): string {
  if (days.length === 0) return "No forecast";
  const low = Math.min(...days.map((d) => d.low));
  const high = Math.max(...days.map((d) => d.high));
  const rainy = days.filter((d) => d.rainChance >= RAINY).map((d) => weekdayShort(d.date));
  const rain = rainy.length ? `rain ${rainy.join(", ")}` : "no rain";
  return `${days.length} days, ${low}°-${high}°, ${rain}`;
}
