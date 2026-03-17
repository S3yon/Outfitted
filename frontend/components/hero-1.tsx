"use client";

import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import { LineShadowText } from "@/components/ui/line-shadow-text";
import { Highlighter } from "@/components/ui/highlighter";

const ShaderReveal = dynamic(() => import("@/components/shader-reveal"), {
  ssr: false,
});

export function Hero1() {
  return (
    <section className="relative w-full min-h-svh flex items-center justify-center px-5 sm:px-6 lg:px-8 overflow-hidden py-16 lg:py-0">
      <div className="relative z-10 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-16 items-center">
        {/* Left - Copy */}
        <div className="flex flex-col gap-6 text-center lg:text-left items-center lg:items-start">
          {/* Headline - big, bold, confident */}
          <div className="space-y-0">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-[2rem] xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-neutral-900 dark:text-white leading-[1]"
            >
              <span className="relative inline-flex after:absolute after:top-[0.04em] after:left-[0.04em] after:content-[attr(data-text)] after:-z-10 after:text-black/15 dark:after:text-white/15" data-text="Your">Your</span>
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-[2rem] xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-neutral-900 dark:text-white leading-[1]"
            >
              <span className="relative inline-flex after:absolute after:top-[0.04em] after:left-[0.04em] after:content-[attr(data-text)] after:-z-10 after:text-black/15 dark:after:text-white/15" data-text="wardrobe,">wardrobe,</span>
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-[2rem] xs:text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-neutral-900 dark:text-white leading-[1]"
            >
              <Highlighter action="underline" color="#f97316" strokeWidth={3} iterations={3} padding={6}><LineShadowText shadowColor="black">digitized.</LineShadowText></Highlighter>
            </motion.h1>
          </div>

          {/* Subline - short, direct */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-base sm:text-lg text-neutral-800 dark:text-neutral-300 leading-relaxed max-w-sm w-full"
          >
            Upload your clothes. Take a style quiz.
            <br />
            Get <Highlighter action="highlight" color="#ffd1dc">AI-curated outfits</Highlighter> daily.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex items-center gap-4"
          >
            <a
              href="/login"
              className="group px-6 py-3 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm hover:bg-neutral-800 dark:hover:bg-neutral-100 transition-colors flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors"
            >
              Learn more
            </a>
          </motion.div>

        </div>

        {/* Right - Image: shader on desktop, static crossfade on mobile */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative flex justify-center"
        >
          {/* Desktop: interactive shader */}
          <div className="hidden md:block relative overflow-hidden" style={{ width: 424, height: 632, mask: "linear-gradient(to bottom, transparent 0%, transparent 12%, black 22%, black 85%, transparent 100%)", WebkitMask: "linear-gradient(to bottom, transparent 0%, transparent 12%, black 22%, black 85%, transparent 100%)" }}>
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
              className="w-full h-full"
            />
          </div>

          {/* Mobile: same shader with autoDemo */}
          <div className="md:hidden relative overflow-hidden" style={{ width: 240, height: 358, mask: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)", WebkitMask: "linear-gradient(to bottom, transparent 0%, black 10%, black 90%, transparent 100%)" }}>
            <ShaderReveal
              frontImage="/hero-casual.png"
              backImage="/hero-outfit.png"
              mouseForce={0}
              cursorSize={250}
              resolution={0.5}
              autoDemo
              autoSpeed={0.55}
              autoIntensity={2.2}
              revealStrength={1}
              revealSoftness={1}
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
