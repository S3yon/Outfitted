"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { PullToRefresh } from "@/components/pull-to-refresh";
import { DayRow } from "@/components/week/day-row";
import { PlanSetup } from "@/components/week/plan-setup";
import { PlanSteps } from "@/components/week/plan-steps";
import { usePlanner, type Place } from "@/components/week/use-planner";
import { useAppStore } from "@/stores/use-app-store";
import { localDay } from "@/lib/wear/review";
import type { WearLog } from "@/lib/wear/stats";
import type { Chips } from "@/lib/planner/events";
import type { WeekPlan } from "@/lib/planner/plan";
import { addDays, mondayOf, weekDates } from "@/lib/planner/week";
import { cn } from "@/lib/utils";

const PLACE_KEY = "outfitted.week.place";

const GOOGLE_MESSAGES: Record<string, () => void> = {
  connected: () => toast.success("Google Calendar connected for one hour"),
  error: () => toast.error("Could not connect Google Calendar. Try again."),
  unavailable: () => toast.error("Google Calendar is not set up on this server"),
};

function readPlace(): Place | null {
  try {
    const saved = JSON.parse(localStorage.getItem(PLACE_KEY) ?? "null") as Place | null;
    return saved && typeof saved.lat === "number" && typeof saved.lon === "number" ? saved : null;
  } catch {
    return null;
  }
}

function savePlace(place: Place | null) {
  try {
    if (place) localStorage.setItem(PLACE_KEY, JSON.stringify(place));
    else localStorage.removeItem(PLACE_KEY);
  } catch {
    // Private windows can refuse storage; the place just isn't remembered.
  }
}

export default function WeekPage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { wardrobeItems, setWardrobeItems } = useAppStore();
  const today = localDay(new Date());
  const thisWeek = mondayOf(today);
  const [weekStart, setWeekStart] = useState(thisWeek);
  const [plan, setPlan] = useState<WeekPlan | null>(null);
  const [google, setGoogle] = useState({ available: false, connected: false });
  const [logs, setLogs] = useState<WearLog[]>([]);
  const [place, setPlace] = useState<Place | null>(null);
  const [chips, setChips] = useState<Chips>({});
  const [loading, setLoading] = useState(true);
  const planner = usePlanner(setPlan);

  async function fetchPlan(week: string) {
    const res = await fetch(`/api/planner?week=${week}`);
    if (!res.ok) return;
    const body = (await res.json()) as { plan: WeekPlan | null; google: typeof google };
    setPlan(body.plan);
    setGoogle(body.google);
    setChips(Object.fromEntries((body.plan?.days ?? []).filter((d) => d.chip).map((d) => [d.date, d.chip!])));
  }

  async function fetchAll() {
    const [items, wear] = await Promise.all([fetch("/api/wardrobe"), fetch("/api/wear"), fetchPlan(weekStart)]);
    if (items.ok) setWardrobeItems(await items.json());
    if (wear.ok) setLogs(((await wear.json()) as { logs: WearLog[] }).logs);
    setLoading(false);
  }

  useEffect(() => {
    if (!auth0User) return;
    fetchAll();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0User]);

  useEffect(() => {
    setPlace(readPlace());
    const params = new URLSearchParams(window.location.search);
    const result = params.get("google");
    if (result) {
      GOOGLE_MESSAGES[result]?.();
      window.history.replaceState(null, "", "/week");
    }
  }, []);

  function changeWeek(week: string) {
    if (week === weekStart || planner.running) return;
    setWeekStart(week);
    setPlan(null);
    setChips({});
    fetchPlan(week);
  }

  function changePlace(next: Place | null) {
    setPlace(next);
    savePlace(next);
  }

  async function woreDay(date: string, itemIds: string[]) {
    try {
      const res = await fetch("/api/wear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: itemIds.map((itemId) => ({ itemId, wornOn: date, source: "manual" })) }),
      });
      if (!res.ok) throw new Error(`wear ${res.status}`);
      setLogs((prev) => [...prev, ...itemIds.map((itemId) => ({ itemId, wornOn: date }))]);
    } catch {
      toast.error("Could not log the wear. Try again.");
    }
  }

  useEffect(() => {
    if (planner.error) toast.error(planner.error);
  }, [planner.error]);

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const dates = weekDates(weekStart);
  const owned = wardrobeItems.filter((i) => i.status === "owned");
  const byId = new Map(wardrobeItems.map((i) => [i.id, i]));
  const days = (planner.running ? planner.days : (plan?.days ?? [])).slice().sort((a, b) => a.date.localeCompare(b.date));
  const worn = new Set(logs.map((l) => `${l.itemId}|${l.wornOn}`));
  const range = `${new Date(`${dates[0]}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(`${dates[6]}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;

  return (
    <PullToRefresh onRefresh={fetchAll}>
      <div className="mx-auto max-w-4xl px-5 py-6 sm:px-8">
        <Link href="/?home=1" className="mb-6 block font-serif text-2xl leading-none md:hidden">
          Outfitted
        </Link>
        <div className="flex items-end justify-between gap-4 border-b border-border pb-5">
          <div>
            <p className="label-caps text-muted-foreground">{range}</p>
            <h1 className="mt-2 font-serif text-5xl leading-none tracking-tight md:text-6xl">Week</h1>
          </div>
          <Button
            size="lg"
            disabled={planner.running || owned.length === 0}
            onClick={() => planner.run(weekStart, place, chips)}
          >
            {planner.running ? (
              <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
            ) : (
              <Sparkles className="size-4" data-icon="inline-start" />
            )}
            {planner.running ? "Planning" : plan ? "Plan again" : "Plan my week"}
          </Button>
        </div>

        <div className="flex gap-6 border-b border-border py-3">
          {[
            { week: thisWeek, label: "This week" },
            { week: addDays(thisWeek, 7), label: "Next week" },
          ].map(({ week, label }) => (
            <button
              key={week}
              onClick={() => changeWeek(week)}
              aria-pressed={weekStart === week}
              className={cn(
                "label-caps border-b pb-0.5 transition-colors",
                weekStart === week ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {owned.length === 0 ? (
          <p className="py-24 text-center font-serif text-2xl text-muted-foreground">
            Add clothes on the Wardrobe tab, then plan your week here.
          </p>
        ) : (
          <>
            <PlanSetup
              dates={dates}
              place={place}
              onPlace={changePlace}
              chips={chips}
              onChips={setChips}
              google={google}
            />

            <PlanSteps steps={planner.steps} running={planner.running} />

            <section className="mt-12">
              <div className="flex items-baseline justify-between gap-4 border-b border-border pb-3">
                <h2 className="font-serif text-3xl leading-none">The plan</h2>
                {days.length > 0 && (
                  <p className="label-caps hidden text-right text-muted-foreground sm:block">
                    {days.length} of 7 days
                  </p>
                )}
              </div>
              {days.length === 0 ? (
                <p className="py-8 text-sm text-muted-foreground">
                  {planner.running
                    ? "Days appear here as they are dressed."
                    : "No plan for this week yet. Set where you are and what each day is for, then Plan my week."}
                </p>
              ) : (
                days.map((day) => (
                  <DayRow
                    key={day.date}
                    day={day}
                    today={today}
                    items={byId}
                    worn={day.itemIds.length > 0 && day.itemIds.every((id) => worn.has(`${id}|${day.date}`))}
                    onWore={() => woreDay(day.date, day.itemIds)}
                  />
                ))
              )}
            </section>

            <p className="mt-10 text-xs text-muted-foreground">
              <a href="https://open-meteo.com/" target="_blank" rel="noreferrer" className="underline-offset-4 hover:underline">
                Weather data by Open-Meteo
              </a>
            </p>
          </>
        )}
      </div>
    </PullToRefresh>
  );
}
