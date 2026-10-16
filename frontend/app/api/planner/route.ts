import { NextResponse, type NextRequest } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth0 } from "@/lib/auth0";
import { db } from "@/lib/db";
import { clothingItems, wearLogs, weekPlans } from "@/db/schema";
import { getOrCreateUser } from "@/lib/get-or-create-user";
import { closetForModel } from "@/lib/planner/closet";
import { buildWeek, calendarUrl, parseChips } from "@/lib/planner/events";
import { googleConfigured, TOKEN_COOKIE } from "@/lib/planner/google";
import { planWeek } from "@/lib/planner/loop";
import { complete, PlannerLimitError } from "@/lib/planner/model";
import type { WeekPlan } from "@/lib/planner/plan";
import { encodeEvent, type PlannerEvent } from "@/lib/planner/stream";
import { forecastUrl, parseForecast } from "@/lib/planner/weather";
import { isWeekStart, weekDates } from "@/lib/planner/week";

function coordinate(value: unknown, limit: number): number | null {
  return typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit ? value : null;
}

// GET /api/planner?week=YYYY-MM-DD: the saved plan for that week (or null) and whether
// Google Calendar can be and is connected.
export async function GET(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const week = req.nextUrl.searchParams.get("week");
  if (!isWeekStart(week)) {
    return NextResponse.json({ error: "week must be a Monday, YYYY-MM-DD" }, { status: 400 });
  }

  const user = await getOrCreateUser(session.user);
  const [row] = await db
    .select({ plan: weekPlans.plan })
    .from(weekPlans)
    .where(and(eq(weekPlans.userId, user.id), eq(weekPlans.weekStart, week)));

  return NextResponse.json({
    plan: row ? (JSON.parse(row.plan) as WeekPlan) : null,
    google: { available: googleConfigured(), connected: req.cookies.has(TOKEN_COOKIE) },
  });
}

// POST /api/planner { weekStart, lat?, lon?, chips? }: plan the week, streamed as NDJSON events.
export async function POST(req: NextRequest) {
  const session = await auth0.getSession();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const weekStart = body?.weekStart;
  if (!isWeekStart(weekStart)) {
    return NextResponse.json({ error: "weekStart must be a Monday, YYYY-MM-DD" }, { status: 400 });
  }
  const dates = weekDates(weekStart);
  const chips = parseChips(body?.chips, dates);
  const lat = coordinate(body?.lat, 90);
  const lon = coordinate(body?.lon, 180);
  const token = req.cookies.get(TOKEN_COOKIE)?.value;
  const user = await getOrCreateUser(session.user);

  // The model never sees keys or URLs: these run here when it calls a tool.
  const load = {
    weather: async () => {
      if (lat === null || lon === null) return [];
      const res = await fetch(forecastUrl(lat, lon));
      return res.ok ? parseForecast(await res.json()) : [];
    },
    week: async () => {
      if (!token) return buildWeek(dates, null, chips);
      const res = await fetch(calendarUrl(weekStart), { headers: { Authorization: `Bearer ${token}` } });
      return buildWeek(dates, res.ok ? await res.json() : null, chips);
    },
    closet: async () => {
      const [items, logs] = await Promise.all([
        db
          .select({
            id: clothingItems.id,
            category: clothingItems.category,
            status: clothingItems.status,
            notes: clothingItems.notes,
            price: clothingItems.price,
            createdAt: clothingItems.createdAt,
          })
          .from(clothingItems)
          .where(and(eq(clothingItems.userId, user.id), eq(clothingItems.status, "owned"))),
        db
          .select({ itemId: wearLogs.clothingItemId, wornOn: wearLogs.wornOn })
          .from(wearLogs)
          .where(eq(wearLogs.userId, user.id)),
      ]);
      return closetForModel(items, logs, new Date().toISOString().slice(0, 10));
    },
  };

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const encoder = new TextEncoder();
      const emit = (event: PlannerEvent) => controller.enqueue(encoder.encode(encodeEvent(event)));
      try {
        const plan = await planWeek({ weekStart, complete, load, emit });
        await db
          .insert(weekPlans)
          .values({ userId: user.id, weekStart, plan: JSON.stringify(plan) })
          .onConflictDoUpdate({
            target: [weekPlans.userId, weekPlans.weekStart],
            set: { plan: JSON.stringify(plan), createdAt: new Date().toISOString() },
          });
        emit({ type: "done", plan });
      } catch (err) {
        console.error("Planner error:", err);
        const message = err instanceof PlannerLimitError ? err.message : "Planning failed, try again";
        emit({ type: "error", message });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}
