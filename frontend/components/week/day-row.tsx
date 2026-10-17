"use client";

import { Check } from "lucide-react";
import type { PlanDay } from "@/lib/planner/plan";
import type { ClothingItem } from "@/db/schema";

function name(item: ClothingItem) {
  return item.notes || item.category;
}

function dayLabel(date: string, today: string) {
  if (date === today) return "Today";
  return new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
}

// One planned day: when, the weather and what is on, then the outfit and why.
export function DayRow({
  day,
  today,
  items,
  worn,
  onWore,
}: {
  day: PlanDay;
  today: string;
  items: Map<string, ClothingItem>;
  worn: boolean;
  onWore: () => void;
}) {
  const outfit = day.itemIds.map((id) => items.get(id)).filter((i): i is ClothingItem => Boolean(i));
  const w = day.weather;

  return (
    <div className="flex flex-col gap-4 border-b border-border py-5 sm:flex-row sm:gap-6">
      <div className="sm:w-40 sm:shrink-0">
        <p className="label-caps text-foreground">{dayLabel(day.date, today)}</p>
        {w && (
          <p className="mt-1.5 text-sm text-muted-foreground">
            {w.words}, {w.low}°-{w.high}°{w.rainChance >= 30 ? `, rain ${w.rainChance}%` : ""}
          </p>
        )}
        {(day.chip || day.events.length > 0) && (
          <ul className="mt-1.5 text-sm text-muted-foreground">
            {day.chip && <li>{day.chip}</li>}
            {day.events.slice(0, 3).map((e, i) => (
              <li key={i} className="truncate">
                {e.time === "all day" ? "" : `${e.time} `}
                {e.title}
              </li>
            ))}
            {day.events.length > 3 && <li>+{day.events.length - 3} more</li>}
          </ul>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-2">
          {outfit.map((item) => (
            <div key={item.id} className="aspect-[3/4] w-16 bg-white sm:w-20" title={name(item)}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={item.cloudinaryUrl} alt={name(item)} className="h-full w-full object-contain p-1.5" />
            </div>
          ))}
          {outfit.length === 0 && <p className="text-sm text-muted-foreground">No items picked</p>}
        </div>
        {day.note && (
          <p className={day.filled ? "mt-3 text-sm text-muted-foreground" : "mt-3 text-sm text-foreground"}>{day.note}</p>
        )}
        {day.date <= today && outfit.length > 0 && (
          <div className="mt-3">
            {worn ? (
              <p className="label-caps flex items-center gap-1 text-foreground">
                <Check className="size-3" /> Logged
              </p>
            ) : (
              <button
                onClick={onWore}
                className="label-caps text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Wore it
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
