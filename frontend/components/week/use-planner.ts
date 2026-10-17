"use client";

import { useRef, useState } from "react";
import type { Chips } from "@/lib/planner/events";
import type { PlanDay, WeekPlan } from "@/lib/planner/plan";
import { decodeLines, type PlannerEvent } from "@/lib/planner/stream";
import { weekdayShort } from "@/lib/planner/week";

export type Step = { id: number; label: string; summary: string | null };
export type Place = { lat: number; lon: number; label: string };

// What the steps list says while a tool runs.
function stepLabel(name: string, args: unknown): string {
  if (name === "get_weather") return "Checking the weather";
  if (name === "get_week") return "Reading your week";
  if (name === "get_closet") return "Looking through your closet";
  if (name === "propose_day") {
    const date = (args as { date?: unknown } | null)?.date;
    return typeof date === "string" ? `Dressing ${weekdayShort(date)}` : "Dressing a day";
  }
  return name;
}

// POST /api/planner and fold its NDJSON events into steps, days as they land, and the final plan.
export function usePlanner(onDone: (plan: WeekPlan) => void) {
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<Step[]>([]);
  const [days, setDays] = useState<PlanDay[]>([]);
  const [error, setError] = useState<string | null>(null);
  const nextId = useRef(0);

  function apply(event: PlannerEvent) {
    if (event.type === "tool") {
      const step = { id: nextId.current++, label: stepLabel(event.name, event.args), summary: null };
      setSteps((prev) => [...prev, step]);
    } else if (event.type === "result") {
      setSteps((prev) => {
        const i = prev.findLastIndex((s) => s.summary === null);
        if (i < 0) return prev;
        const next = [...prev];
        next[i] = { ...next[i], summary: event.summary };
        return next;
      });
    } else if (event.type === "day") {
      setDays((prev) => [...prev.filter((d) => d.date !== event.day.date), event.day]);
    } else if (event.type === "done") {
      onDone(event.plan);
    } else if (event.type === "error") {
      setError(event.message);
    }
  }

  async function run(weekStart: string, place: Place | null, chips: Chips) {
    setRunning(true);
    setSteps([]);
    setDays([]);
    setError(null);
    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ weekStart, lat: place?.lat, lon: place?.lon, chips }),
      });
      if (!res.ok || !res.body) throw new Error(`planner ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const { events, rest } = decodeLines(done ? buffer + "\n" : buffer);
        buffer = rest;
        events.forEach(apply);
        if (done) break;
      }
    } catch {
      setError("Planning failed, try again");
    } finally {
      setRunning(false);
    }
  }

  return { running, steps, days, error, run };
}
