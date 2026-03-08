"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { motion } from "motion/react";
import { ArrowRight, ArrowLeft, Wand2 } from "lucide-react";
import Grainient from "@/components/grainient";

const FEATURES = [
  "Upload your entire wardrobe in seconds",
  "AI generates outfits you'll actually wear",
  "Try on looks before you step out",
];

export default function LoginPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/wardrobe");
    }
  }, [user, isLoading, router]);

  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grainient
          color1="#F9D1D1"
          color2="#FDE8C8"
          color3="#DDD6FE"
          grainAmount={0.12}
          timeSpeed={0.3}
          warpStrength={0.8}
          warpFrequency={2.0}
          warpSpeed={1.5}
          warpAmplitude={30.0}
          blendSoftness={0.3}
          contrast={1.1}
          saturation={0.9}
          rotationAmount={200.0}
          noiseScale={1.5}
          className="h-full w-full"
        />
      </div>

      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between px-6 py-5">
        <a
          href="/"
          className="flex items-center gap-1.5 text-sm text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back
        </a>
        <a
          href="/"
          className="text-base font-semibold tracking-tight text-neutral-800 dark:text-white"
        >
          Outfitted
        </a>
        <div className="w-16" />
      </div>

      {/* Centered content */}
      <div className="relative z-10 min-h-svh flex items-center justify-center px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-full max-w-sm"
        >
          {/* Heading */}
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-neutral-900 dark:text-white">
              Get started
            </h1>
            <p className="mt-1.5 text-sm text-neutral-500 dark:text-neutral-400">
              Your personal AI stylist is ready.
            </p>
          </div>

          {/* Auth card */}
          <div className="rounded-2xl border border-neutral-200/60 dark:border-neutral-800/60 bg-white/75 dark:bg-neutral-900/75 backdrop-blur-xl shadow-xl p-6 space-y-4">
            <a
              href="/api/auth/login?returnTo=/wardrobe"
              className="flex items-center justify-center gap-2.5 w-full px-5 py-3.5 rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-sm font-medium hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors"
            >
              Continue
              <ArrowRight className="size-4" />
            </a>

            <p className="text-center text-xs text-neutral-400 dark:text-neutral-500 leading-relaxed">
              By continuing you agree to our Terms &amp; Privacy Policy.
            </p>
          </div>

          {/* Feature list */}
          <ul className="mt-8 space-y-3.5">
            {FEATURES.map((feature) => (
              <li
                key={feature}
                className="flex items-center gap-3 text-sm text-neutral-600 dark:text-neutral-400"
              >
                <span className="size-1.5 rounded-full bg-gold flex-shrink-0" />
                {feature}
              </li>
            ))}
          </ul>

          {/* Hackathon note */}
          <div className="mt-8 flex items-center gap-2 rounded-xl border border-neutral-200/50 dark:border-neutral-800/50 bg-white/50 dark:bg-neutral-900/50 backdrop-blur-sm px-4 py-3">
            <Wand2 className="size-3.5 text-neutral-400 flex-shrink-0" />
            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              Built for Hack Canada 2025 — fashion meets AI.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
