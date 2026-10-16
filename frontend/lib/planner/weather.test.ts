import { test } from "node:test";
import assert from "node:assert/strict";
import { forecastUrl, parseForecast, warmthBand, weatherSummary, weatherWords } from "./weather.ts";

const forecast = {
  daily: {
    time: ["2026-10-19", "2026-10-20", "2026-10-21", "2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"],
    temperature_2m_max: [14.2, 12.6, 9.4, 8.1, 11, 13.5, 10],
    temperature_2m_min: [6.1, 5, 4.4, 3.9, 4, 7.2, 5],
    precipitation_probability_max: [10, 20, 30, 80, 0, null, 55],
    weather_code: [0, 3, 2, 63, 1, 45, 61],
    wind_speed_10m_max: [12, 18.4, 9, 30, 5, 7, 11],
  },
};

test("forecastUrl asks Open-Meteo for 7 daily rows in local time", () => {
  const url = new URL(forecastUrl(43.65, -79.38));
  assert.equal(url.origin + url.pathname, "https://api.open-meteo.com/v1/forecast");
  assert.equal(url.searchParams.get("latitude"), "43.65");
  assert.equal(url.searchParams.get("longitude"), "-79.38");
  assert.equal(url.searchParams.get("forecast_days"), "7");
  assert.equal(url.searchParams.get("timezone"), "auto");
  assert.match(url.searchParams.get("daily")!, /precipitation_probability_max/);
});

test("parseForecast turns the daily arrays into rounded day rows", () => {
  const days = parseForecast(forecast);
  assert.equal(days.length, 7);
  assert.deepEqual(days[0], {
    date: "2026-10-19",
    high: 14,
    low: 6,
    rainChance: 10,
    wind: 12,
    words: "Clear",
    warmth: "mild",
  });
  assert.equal(days[3].words, "Rain");
  assert.equal(days[5].rainChance, 0);
});

test("parseForecast gives no rows for a broken body", () => {
  assert.deepEqual(parseForecast(null), []);
  assert.deepEqual(parseForecast({ daily: {} }), []);
});

test("weatherWords covers the WMO code groups", () => {
  assert.equal(weatherWords(0), "Clear");
  assert.equal(weatherWords(2), "Partly cloudy");
  assert.equal(weatherWords(3), "Cloudy");
  assert.equal(weatherWords(48), "Fog");
  assert.equal(weatherWords(53), "Drizzle");
  assert.equal(weatherWords(81), "Showers");
  assert.equal(weatherWords(73), "Snow");
  assert.equal(weatherWords(95), "Thunderstorm");
  assert.equal(weatherWords(999), "Unknown");
});

test("warmthBand bands the day's high", () => {
  assert.equal(warmthBand(-3), "cold");
  assert.equal(warmthBand(4), "cold");
  assert.equal(warmthBand(5), "cool");
  assert.equal(warmthBand(14), "mild");
  assert.equal(warmthBand(21), "warm");
  assert.equal(warmthBand(28), "hot");
});

test("weatherSummary names the range and the rainy days", () => {
  assert.equal(weatherSummary(parseForecast(forecast)), "7 days, 4°-14°, rain Thu, Sun");
  assert.equal(weatherSummary(parseForecast(forecast).slice(0, 2)), "2 days, 5°-14°, no rain");
  assert.equal(weatherSummary([]), "No forecast");
});
