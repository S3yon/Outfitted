"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, Pencil, Check, X } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { toast } from "sonner";
import { PullToRefresh } from "@/components/pull-to-refresh";

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
  { match: "Spring/Summer", label: "Spring/Summer" },
  { match: "Fall/Winter", label: "Fall/Winter" },
  { match: "Tropical", label: "Tropical" },
];

function generateBadges(styleProfile: string | null): string[] {
  if (!styleProfile) return [];
  return BADGE_RULES.filter((r) => styleProfile.includes(r.match)).map((r) => r.label);
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
      <div className="mx-auto max-w-7xl px-5 py-6 sm:px-8">
        {/* Header */}
        <div className="flex items-end justify-between gap-6 border-b border-border pb-5">
          <div className="min-w-0">
            <p className="label-caps truncate text-muted-foreground">
              {user?.email ?? auth0User?.email}
            </p>

            {/* Editable name */}
            {editingName ? (
              <div className="mt-2 flex max-w-md items-center gap-3">
                <input
                  autoFocus
                  value={nameValue}
                  onChange={(e) => setNameValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") saveName();
                    if (e.key === "Escape") setEditingName(false);
                  }}
                  className="min-w-0 flex-1 border-b border-foreground bg-transparent font-serif text-5xl leading-none tracking-tight focus:outline-none md:text-6xl"
                />
                <button onClick={saveName} disabled={savingName} className="text-muted-foreground hover:text-foreground">
                  {savingName ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4 stroke-[1.5]" />}
                </button>
                <button onClick={() => setEditingName(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="size-4 stroke-[1.5]" />
                </button>
              </div>
            ) : (
              <div className="group mt-2 flex items-center gap-3">
                <h1 className="truncate font-serif text-5xl leading-none tracking-tight md:text-6xl">
                  {displayName || "—"}
                </h1>
                <button
                  onClick={() => { setNameValue(displayName); setEditingName(true); }}
                  aria-label="Edit name"
                  className="text-muted-foreground opacity-0 transition-opacity hover:text-foreground group-hover:opacity-100"
                >
                  <Pencil className="size-3.5 stroke-[1.5]" />
                </button>
              </div>
            )}
          </div>
          <Avatar className="size-14 shrink-0 after:hidden">
            <AvatarImage src={auth0User?.picture ?? undefined} alt={displayName} />
            <AvatarFallback className="bg-white font-serif text-xl text-foreground">{initials}</AvatarFallback>
          </Avatar>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 border-b border-border">
          {[
            { label: "Owned", value: ownedCount },
            { label: "Wishlisted", value: wishlistCount },
            { label: "Outfits", value: outfitCount },
          ].map(({ label, value }) => (
            <div key={label} className="py-5">
              <p className="font-serif text-4xl leading-none">{value}</p>
              <p className="label-caps mt-2 text-muted-foreground">{label}</p>
            </div>
          ))}
        </div>

        <div className="max-w-2xl">
          {/* Style DNA */}
          <section className="border-b border-border py-6">
            <div className="flex items-baseline justify-between">
              <h2 className="label-caps text-muted-foreground">Style DNA</h2>
              {!editingStyle && user?.styleProfile && (
                <button
                  onClick={() => { setStyleValue(user.styleProfile ?? ""); setEditingStyle(true); }}
                  className="label-caps text-muted-foreground transition-colors hover:text-foreground"
                >
                  Edit
                </button>
              )}
            </div>

            {editingStyle ? (
              <div className="mt-4 space-y-4">
                <textarea
                  autoFocus
                  value={styleValue}
                  onChange={(e) => setStyleValue(e.target.value)}
                  rows={4}
                  style={{ fontSize: 16 }}
                  className="w-full resize-none border-b border-border bg-transparent py-2 leading-relaxed transition-colors focus:border-foreground focus:outline-none"
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
              <blockquote className="mt-4 font-serif text-2xl leading-snug md:text-3xl">
                {user.styleProfile}
              </blockquote>
            ) : (
              <div className="mt-4">
                <p className="font-serif text-2xl text-muted-foreground">No style profile yet.</p>
                <Button size="sm" className="mt-4" onClick={() => setShowOnboarding(true)}>
                  Take the style quiz
                </Button>
              </div>
            )}

            {/* Style badges */}
            {badges.length > 0 && !editingStyle && (
              <p className="label-caps mt-5 text-muted-foreground">{badges.join(" · ")}</p>
            )}
          </section>

          {/* Actions */}
          <section className="flex flex-col">
            <button
              onClick={() => setShowOnboarding(true)}
              className="label-caps border-b border-border py-4 text-left transition-colors hover:text-muted-foreground"
            >
              {user?.styleProfile ? "Retake style quiz" : "Take style quiz"}
            </button>
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- auth route handler; must be a full navigation, and <Link> prefetch would hit it */}
            <a
              href="/api/auth/logout"
              className="label-caps border-b border-border py-4 text-red-700 transition-colors hover:text-foreground"
            >
              Log out
            </a>
          </section>
        </div>
      </div>
    </PullToRefresh>
  );
}
