"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAppStore } from "@/stores/use-app-store";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const BRAND_CATALOG: { name: string; domain: string }[] = [
  { name: "Acne Studios", domain: "acnestudios.com" },
  { name: "Balenciaga", domain: "balenciaga.com" },
  { name: "Bottega Veneta", domain: "bottegaveneta.com" },
  { name: "Burberry", domain: "burberry.com" },
  { name: "Calvin Klein", domain: "calvinklein.com" },
  { name: "Canada Goose", domain: "canadagoose.com" },
  { name: "Carhartt", domain: "carhartt.com" },
  { name: "Chrome Hearts", domain: "chromehearts.com" },
  { name: "Comme des Garçons", domain: "comme-des-garcons.com" },
  { name: "Dior", domain: "dior.com" },
  { name: "Fear of God", domain: "fearofgod.com" },
  { name: "Givenchy", domain: "givenchy.com" },
  { name: "Gucci", domain: "gucci.com" },
  { name: "H&M", domain: "hm.com" },
  { name: "Heron Preston", domain: "heronpreston.com" },
  { name: "Helmut Lang", domain: "helmutlang.com" },
  { name: "Jacquemus", domain: "jacquemus.com" },
  { name: "Kith", domain: "kith.com" },
  { name: "Loewe", domain: "loewe.com" },
  { name: "Louis Vuitton", domain: "louisvuitton.com" },
  { name: "Maison Margiela", domain: "maisonmargiela.com" },
  { name: "Moncler", domain: "moncler.com" },
  { name: "New Balance", domain: "newbalance.com" },
  { name: "Nike", domain: "nike.com" },
  { name: "Norse Projects", domain: "norseprojects.com" },
  { name: "Off-White", domain: "off---white.com" },
  { name: "Our Legacy", domain: "ourlegacy.se" },
  { name: "Palace", domain: "palaceskateboards.com" },
  { name: "Patagonia", domain: "patagonia.com" },
  { name: "Polo Ralph Lauren", domain: "ralphlauren.com" },
  { name: "Prada", domain: "prada.com" },
  { name: "Represent", domain: "representclo.com" },
  { name: "Rick Owens", domain: "rickowens.eu" },
  { name: "Raf Simons", domain: "rafsimons.com" },
  { name: "Saint Laurent", domain: "ysl.com" },
  { name: "Stone Island", domain: "stoneisland.com" },
  { name: "Stüssy", domain: "stussy.com" },
  { name: "Supreme", domain: "supremenewyork.com" },
  { name: "The North Face", domain: "thenorthface.com" },
  { name: "Thom Browne", domain: "thombrowne.com" },
  { name: "Tom Ford", domain: "tomford.com" },
  { name: "Uniqlo", domain: "uniqlo.com" },
  { name: "Valentino", domain: "valentino.com" },
  { name: "Versace", domain: "versace.com" },
  { name: "Visvim", domain: "visvim.tv" },
  { name: "Yeezy", domain: "adidas.com" },
  { name: "Zara", domain: "zara.com" },
  { name: "Arc'teryx", domain: "arcteryx.com" },
  { name: "A.P.C.", domain: "apc.fr" },
  { name: "Ami Paris", domain: "amiparis.com" },
  { name: "Amiri", domain: "amiri.com" },
  { name: "Adidas", domain: "adidas.com" },
  { name: "Aesop", domain: "aesop.com" },
  { name: "Lemaire", domain: "lemaire.fr" },
  { name: "Marni", domain: "marni.com" },
  { name: "Nanushka", domain: "nanushka.com" },
  { name: "Entireworld", domain: "theentireworld.com" },
  { name: "Sporty & Rich", domain: "sportyandrich.com" },
  { name: "COS", domain: "cosstores.com" },
  { name: "Club Monaco", domain: "clubmonaco.com" },
  { name: "Everlane", domain: "everlane.com" },
  { name: "Todd Snyder", domain: "toddsnyder.com" },
  { name: "Levi's", domain: "levi.com" },
  { name: "Tommy Hilfiger", domain: "tommy.com" },
  { name: "Gap", domain: "gap.com" },
  { name: "J.Crew", domain: "jcrew.com" },
  { name: "Banana Republic", domain: "bananarepublic.com" },
  { name: "Abercrombie & Fitch", domain: "abercrombie.com" },
  { name: "Hollister", domain: "hollisterco.com" },
  { name: "American Eagle", domain: "ae.com" },
  { name: "Free People", domain: "freepeople.com" },
  { name: "Urban Outfitters", domain: "urbanoutfitters.com" },
  { name: "ASOS", domain: "asos.com" },
  { name: "PrettyLittleThing", domain: "prettylittlething.com" },
  { name: "Shein", domain: "shein.com" },
  { name: "Reformation", domain: "thereformation.com" },
  { name: "Madewell", domain: "madewell.com" },
  { name: "Anthropologie", domain: "anthropologie.com" },
  { name: "Lululemon", domain: "lululemon.com" },
  { name: "Gymshark", domain: "gymshark.com" },
  { name: "Vuori", domain: "vuoriclothing.com" },
  { name: "Alo Yoga", domain: "aloyoga.com" },
  { name: "Puma", domain: "puma.com" },
  { name: "Converse", domain: "converse.com" },
  { name: "Vans", domain: "vans.com" },
  { name: "Dr. Martens", domain: "drmartens.com" },
  { name: "UGG", domain: "ugg.com" },
  { name: "Timberland", domain: "timberland.com" },
  { name: "Columbia", domain: "columbia.com" },
  { name: "Dickies", domain: "dickies.com" },
  { name: "Wrangler", domain: "wrangler.com" },
  { name: "Lee", domain: "lee.com" },
];

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

const SEASONS_FOCUS = ["All Seasons", "Spring/Summer", "Fall/Winter", "Tropical"] as const;
const TOTAL_STEPS = 9;
const DEFAULT_STYLE = "Vibe: Classic. Fit preference: Relaxed. Occasions: Casual. Season focus: All seasons.";

type Answers = {
  vibe: string | null;
  fit: string | null;
  occasions: string[];
  colors: string[];
  seasonFocus: string | null;
  influences: string[];
};

function buildStyleString(answers: Answers): string {
  return [
    `Vibe: ${answers.vibe ?? "Classic"}`,
    `Fit preference: ${answers.fit ?? "Relaxed"}`,
    `Occasions: ${answers.occasions.length > 0 ? answers.occasions.join(", ") : "Casual"}`,
    `Preferred colors: ${answers.colors.length > 0 ? answers.colors.join(", ") : "neutral tones"}`,
    `Season focus: ${answers.seasonFocus ?? "All seasons"}`,
    `Influences: ${answers.influences.length > 0 ? answers.influences.join(", ") : "None specified"}`,
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
    seasonFocus: null,
    influences: [],
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
      <div className="relative mx-4 flex w-full max-w-lg flex-col border border-border bg-background p-8">
        {/* Step count + skip */}
        <div className="flex items-baseline justify-between">
          <p className="label-caps text-muted-foreground">
            Step {String(step + 1).padStart(2, "0")} / {String(TOTAL_STEPS).padStart(2, "0")}
          </p>
          <button
            onClick={handleSkip}
            disabled={saving}
            className="label-caps text-muted-foreground transition-colors hover:text-foreground"
          >
            Skip
          </button>
        </div>

        {/* Progress hairline */}
        <div className="mt-3 mb-8 flex gap-1">
          {Array.from({ length: TOTAL_STEPS }, (_, i) => (
            <div
              key={i}
              className={cn(
                "h-px flex-1 transition-colors",
                i <= step ? "bg-foreground" : "bg-border",
              )}
            />
          ))}
        </div>

        {/* Step content */}
        <div className="min-h-[240px]">
          {step === 0 && (
            <GuideStep
              eyebrow="Welcome"
              title="Welcome to Outfitted"
              description="Let's build your virtual closet and find your style DNA. This takes about a minute."
            />
          )}
          {step === 1 && (
            <GuideStep
              eyebrow="Photos"
              title="How to photograph your clothes"
              description="Lay items flat on a solid, contrasting surface. Use natural light near a window. Make sure the full item is in frame."
            />
          )}
          {step === 2 && (
            <GuideStep
              eyebrow="AI styling"
              title="How AI styling works"
              description="Our AI stylist reads your wardrobe and style profile to build curated outfit combinations from only the clothes you own."
            />
          )}
          {step === 3 && (
            <QuestionStep eyebrow="Vibe" title="What's your overall vibe?">
              <OptionGrid>
                {VIBES.map((v) => (
                  <OptionButton
                    key={v}
                    label={v}
                    active={answers.vibe === v}
                    onClick={() => setAnswers((prev) => ({ ...prev, vibe: v }))}
                  />
                ))}
              </OptionGrid>
            </QuestionStep>
          )}
          {step === 4 && (
            <QuestionStep eyebrow="Fit" title="How do you like your fits?">
              <OptionGrid>
                {FITS.map((f) => (
                  <OptionButton
                    key={f}
                    label={f}
                    active={answers.fit === f}
                    onClick={() => setAnswers((prev) => ({ ...prev, fit: f }))}
                  />
                ))}
              </OptionGrid>
            </QuestionStep>
          )}
          {step === 5 && (
            <QuestionStep eyebrow="Occasions" title="What occasions do you dress for most?">
              <OptionGrid>
                {OCCASIONS.map((o) => (
                  <OptionButton
                    key={o}
                    label={o}
                    active={answers.occasions.includes(o)}
                    onClick={() => toggleOccasion(o)}
                  />
                ))}
              </OptionGrid>
            </QuestionStep>
          )}
          {step === 6 && (
            <QuestionStep eyebrow="Colours" title="Pick 2-3 colors you wear most">
              <div className="grid grid-cols-5 gap-x-3 gap-y-4">
                {COLORS.map((c) => {
                  const active = answers.colors.includes(c.name);
                  return (
                    <button
                      key={c.name}
                      onClick={() => toggleColor(c.name)}
                      className="flex flex-col items-start gap-2"
                    >
                      <div
                        className={cn(
                          "aspect-square w-full border transition-shadow",
                          active
                            ? "border-foreground ring-1 ring-foreground ring-offset-2 ring-offset-background"
                            : "border-border",
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                      <span
                        className={cn(
                          "label-caps",
                          active ? "text-foreground" : "text-muted-foreground",
                        )}
                      >
                        {c.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </QuestionStep>
          )}
          {step === 7 && (
            <QuestionStep eyebrow="Seasons" title="Which seasons do you dress for most?">
              <OptionGrid>
                {SEASONS_FOCUS.map((s) => (
                  <OptionButton
                    key={s}
                    label={s}
                    active={answers.seasonFocus === s}
                    onClick={() => setAnswers((prev) => ({ ...prev, seasonFocus: s }))}
                  />
                ))}
              </OptionGrid>
              <p className="mt-4 text-xs text-muted-foreground">This helps the AI suggest appropriate fabrics and layering.</p>
            </QuestionStep>
          )}
          {step === 8 && (
            <QuestionStep eyebrow="Influences" title="Any brands or style icons you love?">
              <BrandPicker
                selected={answers.influences}
                onChange={(brands) => setAnswers((prev) => ({ ...prev, influences: brands }))}
              />
            </QuestionStep>
          )}
        </div>

        {/* Navigation */}
        <div className="mt-8 flex items-center justify-between border-t border-border pt-5">
          <button
            onClick={handleBack}
            disabled={step === 0 || saving}
            className="label-caps text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40 disabled:hover:text-muted-foreground"
          >
            Back
          </button>
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
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <p className="label-caps text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-3 font-serif text-4xl leading-[1.05] tracking-tight">{title}</h2>
      <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">{description}</p>
    </div>
  );
}

function QuestionStep({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="label-caps text-muted-foreground">{eyebrow}</p>
      <h2 className="mt-3 mb-6 font-serif text-3xl leading-[1.1] tracking-tight">{title}</h2>
      {children}
    </div>
  );
}

function OptionGrid({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 border-t border-l border-border">{children}</div>;
}

function OptionButton({
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
        "label-caps border-r border-b border-border px-4 py-3.5 text-left transition-colors",
        active
          ? "bg-foreground text-background"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {label}
    </button>
  );
}

const BLOCKED_TERMS = [
  // Slurs & hate speech
  "nigger","nigga","faggot","fag","retard","chink","spic","kike","tranny",
  "dyke","wetback","gook","raghead","towelhead","cracker","honky","beaner",
  "coon","jap","nazi","spook","zipperhead","mongoloid","trannies",
  // Sexual / genitalia
  "penis","vagina","vulva","cock","dick","pussy","cunt","ass","anus","rectum",
  "testicle","scrotum","clitoris","boob","tit","nipple","butthole","asshole",
  "phallus","cum","jizz","boner","erection","orgasm","masturbat","pornograph",
];

function isDerogatory(text: string): boolean {
  // Brand catalog entries are always allowed
  if (BRAND_CATALOG.some((b) => b.name.toLowerCase() === text.toLowerCase())) return false;
  const lower = text.toLowerCase().replace(/[^a-z]/g, "");
  return BLOCKED_TERMS.some((term) => lower.includes(term));
}

function BrandLogo({ domain, name }: { domain: string; name: string }) {
  const [err, setErr] = useState(false);
  if (err) {
    return (
      <div className="flex size-6 shrink-0 items-center justify-center border border-border bg-white text-[9px] uppercase text-muted-foreground">
        {name.slice(0, 2)}
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`https://logo.clearbit.com/${domain}?size=48`}
      alt={name}
      className="size-6 shrink-0 object-contain bg-white"
      onError={() => setErr(true)}
    />
  );
}

function BrandPicker({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (brands: string[]) => void;
}) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const suggestions = query.trim().length === 0
    ? []
    : BRAND_CATALOG.filter(
        (b) =>
          b.name.toLowerCase().includes(query.toLowerCase()) &&
          !selected.includes(b.name),
      ).slice(0, 7);

  // Close dropdown on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  function addBrand(name: string) {
    if (isDerogatory(name)) {
      toast.error("That entry isn't allowed.");
      setQuery("");
      return;
    }
    if (!selected.includes(name)) onChange([...selected, name]);
    setQuery("");
    setOpen(false);
    inputRef.current?.focus();
  }

  function removeBrand(name: string) {
    onChange(selected.filter((b) => b !== name));
  }

  const domainFor = (name: string) =>
    BRAND_CATALOG.find((b) => b.name === name)?.domain ?? "";

  return (
    <div className="flex flex-col gap-3">
      {/* Selected brand chips */}
      {selected.length > 0 && (
        <div className="border-t border-border">
          {selected.map((brand) => (
            <div
              key={brand}
              className="flex items-center gap-3 border-b border-border py-2"
            >
              <BrandLogo domain={domainFor(brand)} name={brand} />
              <span className="flex-1 text-sm text-foreground">{brand}</span>
              <button
                onClick={() => removeBrand(brand)}
                aria-label={`Remove ${brand}`}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="size-3.5 stroke-[1.5]" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Search input */}
      <div ref={containerRef} className="relative">
        <div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                const trimmed = query.trim();
                if (trimmed && !selected.includes(trimmed)) {
                  addBrand(trimmed);
                }
              }
            }}
            placeholder="Search brands or type a style icon..."
            style={{ fontSize: 16 }}
            className="w-full border-b border-border bg-transparent py-2.5 text-foreground placeholder:text-muted-foreground transition-colors focus:border-foreground focus:outline-none"
          />
        </div>

        {/* Suggestions dropdown */}
        {open && query.trim().length > 0 && (
          <div className="absolute left-0 right-0 top-full z-50 overflow-hidden border border-t-0 border-border bg-background">
            {suggestions.map((brand) => (
              <button
                key={brand.name}
                onMouseDown={(e) => { e.preventDefault(); addBrand(brand.name); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary transition-colors"
              >
                <BrandLogo domain={brand.domain} name={brand.name} />
                <span className="text-foreground">{brand.name}</span>
              </button>
            ))}
            {/* Always show "Add custom" option if query isn't already selected */}
            {!selected.includes(query.trim()) && (
              <button
                onMouseDown={(e) => { e.preventDefault(); addBrand(query.trim()); }}
                className="flex w-full items-center gap-3 px-3 py-2.5 text-left text-sm hover:bg-secondary transition-colors border-t border-border"
              >
                <div className="flex size-6 shrink-0 items-center justify-center border border-border text-muted-foreground">
                  <span className="text-xs">+</span>
                </div>
                <span className="text-muted-foreground">Add &ldquo;<span className="text-foreground font-medium">{query.trim()}</span>&rdquo;</span>
              </button>
            )}
          </div>
        )}
      </div>

      <p className="text-xs text-muted-foreground">Optional — helps the AI match your aesthetic.</p>
    </div>
  );
}
