import Image from "next/image";
import { ArrowRight } from "lucide-react";

const looks = [
  { src: "/hero-casual.png", label: "01", caption: "Tee, grey joggers" },
  { src: "/hero-outfit.png", label: "02", caption: "Tee, pinstripe trousers" },
];

export function Hero1() {
  return (
    <section className="w-full border-b border-border">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 lg:grid-cols-[1.1fr_1fr]">
        <div className="flex flex-col justify-between gap-12 px-5 py-14 sm:px-8 lg:border-r lg:border-border lg:py-20">
          <p className="label-caps text-muted-foreground">AI wardrobe and stylist</p>

          <div className="space-y-8">
            <h1 className="font-serif text-6xl leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-[7.5rem]">
              Your wardrobe, <em className="italic">digitized.</em>
            </h1>
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Photograph your clothes and the background is removed for you. Take a short
              style quiz. Get outfits built only from what you own, every day.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <a
              href="/login"
              className="label-caps group inline-flex items-center gap-3 bg-foreground px-6 py-4 text-background transition-opacity hover:opacity-85"
            >
              Get started
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="label-caps text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
            >
              How it works
            </a>
          </div>
        </div>

        <div className="grid grid-cols-2 border-t border-border lg:border-t-0">
          {looks.map((look, i) => (
            <figure
              key={look.src}
              className={`flex flex-col bg-card ${i === 0 ? "border-r border-border" : ""}`}
            >
              <div className="relative aspect-[3/4] w-full lg:aspect-auto lg:flex-1">
                <Image
                  src={look.src}
                  alt={look.caption}
                  fill
                  priority
                  sizes="(min-width: 1024px) 280px, 50vw"
                  className="object-contain p-6"
                />
              </div>
              <figcaption className="flex items-baseline gap-3 border-t border-border px-4 py-3">
                <span className="font-serif text-lg">{look.label}</span>
                <span className="label-caps text-muted-foreground">{look.caption}</span>
              </figcaption>
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
