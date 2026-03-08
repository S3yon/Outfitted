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
      <div className="relative z-10 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
        {/* Left - Copy */}
        <div className="flex flex-col gap-8 text-center lg:text-left items-center lg:items-start">
          {/* Headline - big, bold, confident */}
          <div className="space-y-0">
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-neutral-900 dark:text-white leading-[0.95]"
            >
              Your
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-neutral-900 dark:text-white leading-[0.95]"
            >
              wardrobe,
            </motion.h1>
            <motion.h1
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tighter text-neutral-400 dark:text-neutral-500 leading-[0.95]"
            >
              digitized.
            </motion.h1>
          </div>

          {/* Subline - short, direct */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.45 }}
            className="text-base sm:text-lg text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-sm"
          >
            Upload your clothes. Take a style quiz.
            <br />
            Get AI-curated outfits daily.
          </motion.p>

          {/* CTA row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.55 }}
            className="flex items-center gap-4"
          >
            <a
              href="/api/auth/login"
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

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.7 }}
            className="text-xs text-neutral-400 dark:text-neutral-600"
          >
            Hover the image to reveal the styled look
          </motion.p>
        </div>

        {/* Right - Image */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="relative w-full"
        >
          <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[580px] rounded-2xl overflow-hidden ring-1 ring-neutral-200/40 dark:ring-neutral-800/40">
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
