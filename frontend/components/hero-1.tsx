"use client";

import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";

const ShaderReveal = dynamic(() => import("@/components/shader-reveal"), {
  ssr: false,
});

const fade =
  "linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%)";

export function Hero1() {
  return (
    <section className="w-full">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-5 py-14 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:py-20">
        <div className="flex flex-col gap-8">
          <p className="label-caps text-muted-foreground">AI wardrobe and stylist</p>
          <h1 className="font-serif text-6xl leading-[0.95] tracking-tight text-foreground sm:text-7xl lg:text-[7.5rem]">
            Your wardrobe, <em className="italic">digitized.</em>
          </h1>
          <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
            Photograph your clothes and the background is removed for you. Take a short
            style quiz. Get outfits built only from what you own, every day.
          </p>
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

        {/* Move the cursor over the figure to swap the outfit */}
        <div className="flex justify-center">
          <div
            className="relative h-[358px] w-[240px] overflow-hidden md:h-[632px] md:w-[424px]"
            style={{ mask: fade, WebkitMask: fade }}
          >
            <ShaderReveal
              frontImage="/hero-casual.png"
              backImage="/hero-outfit.png"
              mouseForce={50}
              cursorSize={250}
              resolution={0.5}
              autoDemo
              autoSpeed={0.55}
              autoIntensity={2.2}
              revealStrength={1}
              revealSoftness={1}
              className="h-full w-full"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
