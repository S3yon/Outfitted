"use client";

import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const ShaderReveal = dynamic(() => import("@/components/shader-reveal"), {
  ssr: false,
});

export function Hero1() {
  return (
    <section className="relative w-full h-svh flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden pt-16">
      <div className="relative z-10 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        <div className="flex flex-col gap-6 sm:gap-8 text-center lg:text-left items-center lg:items-start">
          {/* Eyebrow */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="flex items-center gap-2 px-3 py-1 rounded-full border border-neutral-200/60 dark:border-neutral-700/60 bg-white/50 dark:bg-neutral-900/50"
          >
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
            </span>
            <span className="text-xs font-medium text-neutral-500 dark:text-neutral-400 tracking-tight">
              Free to use &mdash; no credit card required
            </span>
          </motion.div>

          {/* Headline with staggered word animation */}
          <div className="overflow-hidden">
            <motion.h1
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium leading-[1.08]"
            >
              <motion.span
                className="block text-neutral-800 dark:text-white"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
              >
                Your wardrobe,
              </motion.span>
              <motion.span
                className="block bg-gradient-to-r from-rose-400 via-violet-400 to-amber-400 dark:from-rose-300 dark:via-violet-300 dark:to-amber-300 bg-clip-text text-transparent"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.35, ease: [0.22, 1, 0.36, 1] }}
              >
                digitized.
              </motion.span>
            </motion.h1>
          </div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="text-base sm:text-lg md:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-md tracking-tight"
          >
            Photograph your clothes, build a virtual closet, and let AI style
            outfits from what you already own.
          </motion.p>

          {/* CTAs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="flex flex-col sm:flex-row items-center gap-3"
          >
            <a
              href="/api/auth/login"
              className="group px-6 py-3 rounded-lg bg-neutral-800 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm sm:text-base hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-all duration-200 flex items-center gap-2"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
            <a
              href="#how-it-works"
              className="group px-4 py-3 rounded-lg text-sm sm:text-base text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-white hover:bg-neutral-100/50 dark:hover:bg-neutral-800/50 transition-all duration-200 flex items-center gap-1.5"
            >
              See how it works
              <ArrowRight className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-0.5" />
            </a>
          </motion.div>

          {/* Social proof hint */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.75 }}
            className="text-xs text-neutral-400/70 dark:text-neutral-500 tracking-tight"
          >
            Hover the image to reveal the styled look
          </motion.p>
        </div>

        {/* Right - ShaderReveal Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative w-full"
        >
          <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[580px] rounded-2xl overflow-hidden shadow-2xl shadow-neutral-300/40 dark:shadow-none ring-1 ring-neutral-200/30 dark:ring-neutral-700/30">
            <ShaderReveal
              frontImage="/hero-casual.png"
              backImage="/hero-outfit.png"
              mouseForce={50}
              cursorSize={250}
              resolution={0.5}
              autoDemo
              autoSpeed={0.55}
              autoIntensity={2.2}
              revealStrength={0.75}
              revealSoftness={1}
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
