"use client";

import { useEffect, useRef } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { useAppStore } from "@/stores/use-app-store";
import { OnboardingFlow } from "@/components/onboarding/onboarding-flow";

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user: auth0User } = useUser();
  const { setUser, setShowOnboarding } = useAppStore();
  const fetched = useRef(false);

  useEffect(() => {
    if (!auth0User || fetched.current) return;
    fetched.current = true;

    async function syncUser() {
      const res = await fetch("/api/user");
      if (!res.ok) return;
      const dbUser = await res.json();
      setUser(dbUser);
      if (!dbUser.onboardingCompleted) {
        setShowOnboarding(true);
      }
    }

    syncUser();
  }, [auth0User, setUser, setShowOnboarding]);

  return (
    <>
      <OnboardingFlow />
      {children}
    </>
  );
}
