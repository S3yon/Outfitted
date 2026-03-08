"use client";

import { useEffect, useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Loader2, LogOut, RefreshCw } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";

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

  if (authLoading || loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const badges = generateBadges(user?.styleProfile ?? null);
  const initials = (user?.displayName ?? auth0User?.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="mx-auto max-w-lg px-4 py-8 sm:px-6">
      {/* Account info */}
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border-2 border-white/10">
          <AvatarImage src={auth0User?.picture ?? undefined} alt={user?.displayName ?? ""} />
          <AvatarFallback className="bg-white/10 text-lg">{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <h1 className="text-lg font-semibold tracking-tight">
            {user?.displayName ?? auth0User?.name}
          </h1>
          <p className="text-xs text-muted-foreground">{user?.email ?? auth0User?.email}</p>
        </div>
      </div>

      {/* Style DNA */}
      <section className="mt-8">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Style DNA
        </h2>
        {user?.styleProfile ? (
          <blockquote className="glass mt-3 rounded-xl p-4 text-sm leading-relaxed italic text-foreground/80">
            {user.styleProfile}
          </blockquote>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            No style profile yet. Complete the onboarding questionnaire.
          </p>
        )}
      </section>

      {/* Style Badges */}
      {badges.length > 0 && (
        <section className="mt-6">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Style Badges
          </h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {badges.map((badge) => (
              <Badge
                key={badge}
                variant="outline"
                className="border-gold/30 bg-gold/10 text-gold"
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
          <a href="/auth/logout">
            <LogOut className="size-4" data-icon="inline-start" />
            Log Out
          </a>
        </Button>
      </section>
    </div>
  );
}
