"use client";

import { useState } from "react";
import { Camera, Sparkles, Shirt, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";

const VIBES = ["Streetwear", "Minimalist", "Preppy", "Bohemian", "Corporate", "Eclectic"] as const;
const FITS = ["Oversized", "Slim/Fitted", "Relaxed", "Tailored"] as const;
const OCCASIONS = ["Casual", "Work", "Nightlife", "Gym", "Formal"] as const;
const COLORS = [
  { name: "Black", value: "#000000" },
  { name: "White", value: "#FFFFFF" },
  { name: "Navy", value: "#1B2A4A" },
  { name: "Grey", value: "#6B7280" },
  { name: "Brown", value: "#8B5E3C" },
  { name: "Green", value: "#2D6A4F" },
  { name: "Red", value: "#DC2626" },
  { name: "Beige", value: "#D4C5A9" },
  { name: "Blue", value: "#3B82F6" },
  { name: "Pink", value: "#EC4899" },
] as const;

const TOTAL_STEPS = 8;
const DEFAULT_STYLE = "Vibe: Classic. Fit preference: Relaxed. Occasions: Casual.";

type Answers = {
  vibe: string | null;
  fit: string | null;
  occasions: string[];
  colors: string[];
  influences: string;
};

function buildStyleString(answers: Answers): string {
  return [
    `Vibe: ${answers.vibe ?? "Classic"}`,
    `Fit preference: ${answers.fit ?? "Relaxed"}`,
    `Occasions: ${answers.occasions.length > 0 ? answers.occasions.join(", ") : "Casual"}`,
    `Preferred colors: ${answers.colors.length > 0 ? answers.colors.join(", ") : "neutral tones"}`,
    `Influences: ${answers.influences || "None specified"}`,
  ].join(". ") + ".";
}

export function OnboardingFlow() {
  const { showOnboarding, setShowOnboarding, setUser, user } = useAppStore();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState<Answers>({
    vibe: null,
    fit: null,
    occasions: [],
    colors: [],
    influences: "",
  });

  if (!showOnboarding) return null;

  async function saveProfile(styleString: string) {
    setSaving(true);
    const res = await fetch("/api/user", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        styleProfile: styleString,
        onboardingCompleted: true,
      }),
    });
    const updated = await res.json();
    setUser(updated);
    setSaving(false);
    setShowOnboarding(false);
  }

  function handleSkip() {
    saveProfile(DEFAULT_STYLE);
  }

  function handleNext() {
    if (step < TOTAL_STEPS - 1) {
      setStep(step + 1);
    } else {
      saveProfile(buildStyleString(answers));
    }
  }

  function handleBack() {
    if (step > 0) setStep(step - 1);
  }

  function toggleOccasion(occ: string) {
    setAnswers((prev) => ({
      ...prev,
      occasions: prev.occasions.includes(occ)
        ? prev.occasions.filter((o) => o !== occ)
        : [...prev.occasions, occ],
    }));
  }

  function toggleColor(color: string) {
    setAnswers((prev) => {
      if (prev.colors.includes(color)) {
        return { ...prev, colors: prev.colors.filter((c) => c !== color) };
      }
      if (prev.colors.length >= 3) return prev;
      return { ...prev, colors: [...prev.colors, color] };
    });
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="relative mx-4 flex w-full max-w-lg flex-col rounded-2xl bg-background p-8 ring-1 ring-border">
        {/* Progress bar */}
        <div className="mb-6 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-1 flex-1 rounded-full transition-colors",
                i <= step ? "bg-gold" : "bg-border",
              )}
            />
          ))}
        </div>

        {/* Skip button */}
        <button
          onClick={handleSkip}
          disabled={saving}
          className="absolute right-4 top-4 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        {/* Step content */}
        <div className="min-h-[240px]">
          {step === 0 && (
            <GuideStep
              icon={<Shirt className="size-8 text-gold" />}
              title="Welcome to Outfitted"
              description="Let's build your virtual closet and find your style DNA. This takes about a minute."
            />
          )}
          {step === 1 && (
            <GuideStep
              icon={<Camera className="size-8 text-gold" />}
              title="How to photograph your clothes"
              description="Lay items flat on a solid, contrasting surface. Use natural light near a window. Make sure the full item is in frame."
            />
          )}
          {step === 2 && (
            <GuideStep
              icon={<Sparkles className="size-8 text-gold" />}
              title="How AI styling works"
              description="Our AI stylist reads your wardrobe and style profile to build curated outfit combinations from only the clothes you own."
            />
          )}
          {step === 3 && (
            <QuestionStep title="What's your overall vibe?">
              <div className="grid grid-cols-2 gap-2">
                {VIBES.map((v) => (
                  <PillButton
                    key={v}
                    label={v}
                    active={answers.vibe === v}
                    onClick={() => setAnswers((prev) => ({ ...prev, vibe: v }))}
                  />
                ))}
              </div>
            </QuestionStep>
          )}
          {step === 4 && (
            <QuestionStep title="How do you like your fits?">
              <div className="grid grid-cols-2 gap-2">
                {FITS.map((f) => (
                  <PillButton
                    key={f}
                    label={f}
                    active={answers.fit === f}
                    onClick={() => setAnswers((prev) => ({ ...prev, fit: f }))}
                  />
                ))}
              </div>
            </QuestionStep>
          )}
          {step === 5 && (
            <QuestionStep title="What occasions do you dress for most?">
              <div className="grid grid-cols-2 gap-2">
                {OCCASIONS.map((o) => (
                  <PillButton
                    key={o}
                    label={o}
                    active={answers.occasions.includes(o)}
                    onClick={() => toggleOccasion(o)}
                  />
                ))}
              </div>
            </QuestionStep>
          )}
          {step === 6 && (
            <QuestionStep title="Pick 2-3 colors you wear most">
              <div className="grid grid-cols-5 gap-3">
                {COLORS.map((c) => (
                  <button
                    key={c.name}
                    onClick={() => toggleColor(c.name)}
                    className={cn(
                      "flex flex-col items-center gap-1.5",
                    )}
                  >
                    <div
                      className={cn(
                        "size-10 rounded-full border-2 transition-all",
                        answers.colors.includes(c.name)
                          ? "border-gold scale-110"
                          : "border-border",
                      )}
                      style={{ backgroundColor: c.value }}
                    />
                    <span className="text-[10px] text-muted-foreground">{c.name}</span>
                  </button>
                ))}
              </div>
            </QuestionStep>
          )}
          {step === 7 && (
            <QuestionStep title="Any style icons or brands you love?">
              <Input
                placeholder="e.g. Acne Studios, Rick Owens..."
                value={answers.influences}
                onChange={(e) =>
                  setAnswers((prev) => ({ ...prev, influences: e.target.value }))
                }
                className="bg-secondary"
              />
              <p className="mt-2 text-xs text-muted-foreground">Optional. This helps the AI understand your taste.</p>
            </QuestionStep>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-6 flex items-center justify-between">
          <Button
            variant="ghost"
            size="lg"
            onClick={handleBack}
            disabled={step === 0 || saving}
          >
            Back
          </Button>
          <Button
            size="lg"
            onClick={handleNext}
            disabled={saving}
          >
            {saving ? "Saving..." : step === TOTAL_STEPS - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function GuideStep({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center text-center">
      <div className="mb-4">{icon}</div>
      <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed max-w-sm">{description}</p>
    </div>
  );
}

function QuestionStep({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h2 className="mb-4 text-lg font-semibold tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function PillButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "rounded-lg border px-4 py-2.5 text-sm transition-all",
        active
          ? "border-gold bg-gold/10 text-foreground"
          : "border-border bg-secondary text-muted-foreground hover:bg-secondary/80",
      )}
    >
      {label}
    </button>
  );
}
