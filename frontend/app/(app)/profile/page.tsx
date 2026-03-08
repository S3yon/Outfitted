"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, LogOut, RefreshCw, Pencil, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { toast } from "sonner";

const BADGE_RULES: Array<{ match: string; label: string }> = [
  { match: "Minimalist", label: "Minimalist" },
  { match: "Streetwear", label: "Streetwear" },
  { match: "Preppy", label: "Preppy" },
  { match: "Bohemian", label: "Bohemian" },
  { match: "Corporate", label: "Corporate" },
  { match: "Eclectic", label: "Eclectic" },
  { match: "Slim/Fitted", label: "Slim Fit" },
  { match: "Oversized", label: "Oversized" },
  { match: "Relaxed", label: "Relaxed Fit" },
  { match: "Tailored", label: "Tailored" },
  { match: "Work", label: "Office-Ready" },
  { match: "Formal", label: "Formal" },
  { match: "Nightlife", label: "Night Out" },
  { match: "Gym", label: "Athleisure" },
];

function generateBadges(styleProfile: string | null): string[] {
  if (!styleProfile) return [];
  return BADGE_RULES.filter((r) => styleProfile.includes(r.match)).map((r) => r.label);
}

export default function ProfilePage() {
  const { user: auth0User, isLoading: authLoading } = useUser();
  const { user, setUser, setShowOnboarding } = useAppStore();
  const [loading, setLoading] = useState(true);

  // Name editing
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const [savingName, setSavingName] = useState(false);

  // Style profile editing
  const [editingStyle, setEditingStyle] = useState(false);
  const [styleValue, setStyleValue] = useState("");
  const [savingStyle, setSavingStyle] = useState(false);

  useEffect(() => {
    if (!auth0User) return;
    async function fetchUser() {
      const res = await fetch("/api/user");
      if (res.ok) {
        const data = await res.json();
        setUser(data);
      }
      setLoading(false);
    }
    fetchUser();
  }, [auth0User, setUser]);

  async function saveName() {
    if (!nameValue.trim()) return;
    setSavingName(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: nameValue.trim() }),
    });
    if (res.ok) {
      const updated = await res.json();
      setUser(updated);
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
      const updated = await res.json();
      setUser(updated);
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

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      {/* Avatar + name + email */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border-2 border-white/10 flex-shrink-0">
          <AvatarImage src={auth0User?.picture ?? undefined} alt={displayName} />
          <AvatarFallback className="bg-white/10 text-lg">{initials}</AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameValue}
                onChange={(e) => setNameValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") saveName();
                  if (e.key === "Escape") setEditingName(false);
                }}
                className="flex-1 min-w-0 rounded-lg border border-border bg-secondary px-2.5 py-1 text-sm font-semibold tracking-tight focus:outline-none focus:ring-1 focus:ring-ring"
              />
              <button
                onClick={saveName}
                disabled={savingName}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {savingName ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
              </button>
              <button
                onClick={() => setEditingName(false)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 group">
              <h1 className="text-lg font-semibold tracking-tight truncate">
                {displayName || "—"}
              </h1>
              <button
                onClick={() => { setNameValue(displayName); setEditingName(true); }}
                className="p-1 text-muted-foreground transition-all hover:text-foreground md:opacity-0 md:group-hover:opacity-100"
              >
                <Pencil className="size-3" />
              </button>
            </div>
          )}
          <p className="text-xs text-muted-foreground truncate">{user?.email ?? auth0User?.email}</p>
        </div>
      </div>

      {/* Style DNA */}
      <section className="mt-8">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
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
          <p className="text-sm text-muted-foreground">
            No style profile yet. Take the quiz below.
          </p>
        )}
      </section>

      {/* Style Badges */}
      {badges.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Style Badges
          </h2>
          <div className="flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge}
                variant="outline"
                className="border-border bg-secondary"
              >
                {badge}
              </Badge>
            ))}
          </div>
        </section>
      )}

      {/* Actions */}
      <section className="mt-8 flex flex-col gap-3">
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
  );
}
