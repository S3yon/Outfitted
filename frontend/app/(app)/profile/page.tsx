"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, LogOut, RefreshCw, Pencil, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { toast } from "sonner";
import { PullToRefresh } from "@/components/pull-to-refresh";

const BADGE_RULES: Array<{ match: string; label: string; color: string }> = [
  { match: "Minimalist", label: "Minimalist", color: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
  { match: "Streetwear", label: "Streetwear", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
  { match: "Preppy", label: "Preppy", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { match: "Bohemian", label: "Bohemian", color: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
  { match: "Corporate", label: "Corporate", color: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" },
  { match: "Eclectic", label: "Eclectic", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { match: "Slim/Fitted", label: "Slim Fit", color: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20" },
  { match: "Oversized", label: "Oversized", color: "bg-teal-500/10 text-teal-400 border-teal-500/20" },
  { match: "Relaxed", label: "Relaxed Fit", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { match: "Tailored", label: "Tailored", color: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
  { match: "Work", label: "Office-Ready", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { match: "Formal", label: "Formal", color: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20" },
  { match: "Nightlife", label: "Night Out", color: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  { match: "Gym", label: "Athleisure", color: "bg-lime-500/10 text-lime-400 border-lime-500/20" },
  { match: "Spring/Summer", label: "Spring/Summer", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  { match: "Fall/Winter", label: "Fall/Winter", color: "bg-orange-800/10 text-orange-300 border-orange-800/20" },
  { match: "Tropical", label: "Tropical", color: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
];

function generateBadges(styleProfile: string | null): Array<{ label: string; color: string }> {
  if (!styleProfile) return [];
  return BADGE_RULES.filter((r) => styleProfile.includes(r.match)).map((r) => ({ label: r.label, color: r.color }));
}

export default function ProfilePage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { user, setUser, setShowOnboarding, wardrobeItems, outfits } = useAppStore();
  const [loading, setLoading] = useState(true);

  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  const [editingStyle, setEditingStyle] = useState(false);
  const [styleValue, setStyleValue] = useState("");
  const [savingStyle, setSavingStyle] = useState(false);

  async function fetchUser() {
    const res = await fetch("/api/user");
    if (res.ok) setUser(await res.json());
    setLoading(false);
  }

  useEffect(() => {
    if (!auth0User) return;
    fetchUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [auth0User]);

  async function saveName() {
    if (!nameValue.trim()) return;
    setSavingName(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: nameValue.trim() }),
    });
    if (res.ok) {
      setUser(await res.json());
      setEditingName(false);
      toast.success("Name updated");
    } else {
      toast.error("Failed to save name");
    }
    setSavingName(false);
  }

  async function saveStyle() {
    if (!styleValue.trim()) return;
    setSavingStyle(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ styleProfile: styleValue.trim() }),
    });
    if (res.ok) {
      setUser(await res.json());
      setEditingStyle(false);
      toast.success("Style profile updated");
    } else {
      toast.error("Failed to save style profile");
    }
    setSavingStyle(false);
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const badges = generateBadges(user?.styleProfile ?? null);
  const displayName = user?.displayName ?? auth0User?.name ?? "";
  const initials = displayName
    .split(" ")
    .map((w: string) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const ownedCount = wardrobeItems.filter((i) => i.status === "owned").length;
  const wishlistCount = wardrobeItems.filter((i) => i.status === "wishlisted").length;
  const outfitCount = outfits.length;

  return (
    <PullToRefresh onRefresh={fetchUser}>
      <div className="mx-auto max-w-lg px-5 py-8 sm:px-8 space-y-6">

        {/* Hero card */}
        <div className="glass rounded-2xl p-6 flex flex-col items-center text-center">
          <div className="relative mb-4">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/40 to-transparent blur-md" />
            <Avatar className="relative size-20 border-2 border-white/10">
              <AvatarImage src={auth0User?.picture ?? undefined} alt={displayName} />
              <AvatarFallback className="bg-white/10 text-2xl font-semibold">{initials}</AvatarFallback>
            </Avatar>
          </div>

          {/* Editable name */}
          {editingName ? (
            <div className="flex items-center gap-2 w-full max-w-xs">
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="flex-1 min-w-0 rounded-lg border border-border bg-secondary px-2.5 py-1 text-base font-semibold text-center tracking-tight focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button onClick={saveName} disabled={savingName} className="text-muted-foreground hover:text-foreground">
                {savingName ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              </button>
              <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground">
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <h1 className="text-xl font-semibold tracking-tight">{displayName || "—"}</h1>
              <button
                onClick={() => { setNameValue(displayName); setEditingName(true); }}
                className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all"
              >
                <Pencil className="size-3" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-0.5">{user?.email ?? auth0User?.email}</p>

          {/* Stats row */}
          <div className="mt-5 grid w-full grid-cols-3 divide-x divide-border rounded-xl border border-border bg-background/40">
            {[
              { label: "Owned", value: ownedCount },
              { label: "Wishlisted", value: wishlistCount },
              { label: "Outfits", value: outfitCount },
            ].map(({ label, value }) => (
              <div key={label} className="flex flex-col items-center py-3 px-2">
                <span className="text-lg font-semibold">{value}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground">{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Style DNA */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Style DNA
            </h2>
            {!editingStyle && user?.styleProfile && (
              <button
                onClick={() => { setStyleValue(user.styleProfile ?? ""); setEditingStyle(true); }}
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <Pencil className="size-3" />
                Edit
              </button>
            )}
          </div>

          {editingStyle ? (
            <div className="space-y-2">
              <textarea
                autoFocus
                value={styleValue}
                onChange={(e) => setStyleValue(e.target.value)}
                rows={4}
                className="w-full rounded-xl border border-border bg-secondary px-3 py-2.5 text-sm leading-relaxed focus:outline-none focus:ring-1 focus:ring-ring resize-none"
              />
              <div className="flex gap-2">
                <Button size="sm" onClick={saveStyle} disabled={savingStyle}>
                  {savingStyle ? <Loader2 className="size-3 animate-spin" /> : "Save"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingStyle(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          ) : user?.styleProfile ? (
            <blockquote className="glass rounded-xl p-4 text-sm leading-relaxed italic text-foreground/80">
              {user.styleProfile}
            </blockquote>
          ) : (
            <div className="glass rounded-xl p-5 text-center">
              <p className="text-sm text-muted-foreground mb-3">No style profile yet.</p>
              <Button size="sm" onClick={() => setShowOnboarding(true)}>
                Take the Style Quiz
              </Button>
            </div>
          )}
        </section>

        {/* Style Badges */}
        {badges.length > 0 && (
          <section>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Style Badges
            </h2>
            <div className="flex flex-wrap gap-2">
              {badges.map(({ label, color }) => (
                <Badge
                  key={label}
                  variant="outline"
                  className={color}
                >
                  {label}
                </Badge>
              ))}
            </div>
          </section>
        )}

        {/* Actions */}
        <section className="flex flex-col gap-3">
          <Button
            variant="outline"
            size="lg"
            className="w-full justify-start"
            onClick={() => setShowOnboarding(true)}
          >
            <RefreshCw className="size-4" data-icon="inline-start" />
            {user?.styleProfile ? "Retake Style Quiz" : "Take Style Quiz"}
          </Button>

          <Button
            variant="ghost"
            size="lg"
            className="w-full justify-start text-destructive hover:text-destructive"
            asChild
          >
            <a href="/api/auth/logout">
              <LogOut className="size-4" data-icon="inline-start" />
              Log Out
            </a>
          </Button>
        </section>
      </div>
    </PullToRefresh>
  );
}
