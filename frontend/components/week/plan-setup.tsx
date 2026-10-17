"use client";

import { useState } from "react";
import { Loader2, MapPin } from "lucide-react";
import { CHIPS, type Chip, type Chips } from "@/lib/planner/events";
import { weekdayShort } from "@/lib/planner/week";
import { cn } from "@/lib/utils";
import type { Place } from "./use-planner";

type Google = { available: boolean; connected: boolean };

// Where the week happens, what each day is for, and the optional calendar link.
export function PlanSetup({
  dates,
  place,
  onPlace,
  chips,
  onChips,
  google,
}: {
  dates: string[];
  place: Place | null;
  onPlace: (place: Place | null) => void;
  chips: Chips;
  onChips: (chips: Chips) => void;
  google: Google;
}) {
  function toggle(date: string, chip: Chip) {
    const next = { ...chips };
    if (next[date] === chip) delete next[date];
    else next[date] = chip;
    onChips(next);
  }

  return (
    <div className="border-b border-border">
      <Row label="Where">
        <PlacePicker place={place} onPlace={onPlace} />
      </Row>

      <Row label="Calendar">
        {google.connected ? (
          <p className="text-sm text-foreground">Google Calendar connected for this hour</p>
        ) : google.available ? (
          <div>
            <a
              href="/api/planner/google/start"
              className="label-caps text-foreground underline-offset-4 hover:underline"
            >
              Connect Google Calendar
            </a>
            <p className="mt-1 text-xs text-muted-foreground">
              Read-only, for one hour. The planner sends event titles and times, the forecast and
              your closet notes to a free model, which may keep them.
            </p>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Set each day below</p>
        )}
      </Row>

      <Row label="Days">
        <div className="flex flex-col gap-2">
          {dates.map((date) => (
            <div key={date} className="flex items-baseline gap-3">
              <p className="label-caps w-8 shrink-0 text-muted-foreground">{weekdayShort(date)}</p>
              <div className="flex flex-wrap gap-x-2.5 gap-y-1 sm:gap-x-3">
                {CHIPS.map((chip) => (
                  <button
                    key={chip}
                    onClick={() => toggle(date, chip)}
                    aria-pressed={chips[date] === chip}
                    className={cn(
                      "label-caps border-b pb-0.5 transition-colors",
                      chips[date] === chip
                        ? "border-foreground text-foreground"
                        : "border-transparent text-muted-foreground hover:text-foreground",
                    )}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Row>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3 border-t border-border py-4 first:border-t-0 sm:flex-row sm:items-start sm:gap-6">
      <p className="label-caps shrink-0 pt-0.5 text-muted-foreground sm:w-32">{label}</p>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

type GeoResult = { name: string; admin1?: string; country?: string; latitude: number; longitude: number };

// Browser location first; a city search through Open-Meteo geocoding when that is refused.
function PlacePicker({ place, onPlace }: { place: Place | null; onPlace: (place: Place | null) => void }) {
  const [locating, setLocating] = useState(false);
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  function locate() {
    if (!navigator.geolocation) return setMessage("Location is not available here. Search a city.");
    setLocating(true);
    setMessage(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const lat = Math.round(pos.coords.latitude * 100) / 100;
        const lon = Math.round(pos.coords.longitude * 100) / 100;
        onPlace({ lat, lon, label: "Your location" });
      },
      () => {
        setLocating(false);
        setMessage("Location was blocked. Search a city instead.");
      },
      { timeout: 10_000, maximumAge: 3_600_000 },
    );
  }

  async function search(e: React.FormEvent) {
    e.preventDefault();
    const name = query.trim();
    if (!name || searching) return;
    setSearching(true);
    setMessage(null);
    try {
      const params = new URLSearchParams({ name, count: "1", language: "en", format: "json" });
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`);
      const hit = ((await res.json()) as { results?: GeoResult[] }).results?.[0];
      if (!hit) {
        setMessage(`No place called ${name}`);
      } else {
        onPlace({
          lat: hit.latitude,
          lon: hit.longitude,
          label: [hit.name, hit.admin1, hit.country].filter(Boolean).join(", "),
        });
        setQuery("");
      }
    } catch {
      setMessage("City search failed. Try again.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <div>
      {place ? (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-1">
          <p className="flex items-center gap-1.5 text-sm text-foreground">
            <MapPin className="size-3.5" /> {place.label}
          </p>
          <button
            onClick={() => onPlace(null)}
            className="label-caps text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
          >
            Change
          </button>
        </div>
      ) : (
        <div className="flex flex-wrap items-baseline gap-x-5 gap-y-3">
          <button
            onClick={locate}
            disabled={locating}
            className="label-caps flex items-center gap-1.5 text-foreground underline-offset-4 hover:underline disabled:opacity-40"
          >
            {locating ? <Loader2 className="size-3 animate-spin" /> : <MapPin className="size-3" />}
            Use my location
          </button>
          <form onSubmit={search} className="flex items-baseline gap-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="or search a city"
              aria-label="City"
              className="w-40 border-b border-border bg-transparent pb-0.5 text-sm placeholder:text-muted-foreground focus:border-foreground focus:outline-none"
            />
            {query.trim() && (
              <button type="submit" disabled={searching} className="label-caps text-foreground underline-offset-4 hover:underline disabled:opacity-40">
                {searching ? "Searching" : "Find"}
              </button>
            )}
          </form>
        </div>
      )}
      {message && <p className="mt-2 text-xs text-muted-foreground">{message}</p>}
    </div>
  );
}
