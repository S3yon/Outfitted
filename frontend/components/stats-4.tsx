import { ArrowRight } from "lucide-react";

// Facts about how the app works, not usage claims
const stats = [
  { value: "3", label: "Outfits per generation" },
  { value: "1", label: "Outfit picked for you each day" },
  { value: "5", label: "Clothing categories" },
  { value: "0", label: "Items you don't own in an outfit" },
];

export default function Stats4() {
  return (
    <section className="w-full border-b border-border">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 lg:grid-cols-[1fr_1.4fr]">
        <div className="flex flex-col justify-between gap-10 border-b border-border px-5 py-10 sm:px-8 lg:border-b-0 lg:border-r lg:py-14">
          <h2 className="font-serif text-5xl leading-none sm:text-6xl">By the numbers</h2>
          <div className="space-y-6">
            <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
              Every outfit comes from your own closet. Add three items you own and the
              stylist can start.
            </p>
            <a
              href="/login"
              className="label-caps group inline-flex items-center gap-3 bg-foreground px-6 py-4 text-background transition-opacity hover:opacity-85"
            >
              Start styling
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2">
          {stats.map((stat, i) => (
            <div
              key={stat.label}
              className={`flex min-h-[200px] flex-col justify-between gap-6 border-border px-5 py-6 sm:px-8 ${
                i % 2 === 0 ? "border-r" : ""
              } ${i < 2 ? "border-b" : ""}`}
            >
              <span className="label-caps text-muted-foreground">{stat.label}</span>
              <span className="font-serif text-8xl leading-none">{stat.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
