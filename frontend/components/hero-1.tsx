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
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium text-neutral-800 dark:text-white leading-[1.1]"
          >
            Your wardrobe,
            <br />
            digitized.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base sm:text-lg md:text-xl text-neutral-500 dark:text-neutral-400 leading-relaxed max-w-lg tracking-tight"
          >
            Photograph your clothes, build a virtual closet, and let AI put
            together outfits that match your style.
          </motion.p>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-xs sm:text-sm text-neutral-400/60 dark:text-white/30 tracking-tight"
          >
            Hover the image to reveal the styled look
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <a
              href="/api/auth/login"
              className="px-8 py-3 rounded-lg bg-neutral-800 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm sm:text-base hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors duration-200 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="text-sm sm:text-base text-neutral-400 hover:text-neutral-700 dark:hover:text-white transition-colors duration-200"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative w-full"
        >
          <div className="relative w-full h-[400px] sm:h-[500px] lg:h-[580px] rounded-2xl overflow-hidden shadow-2xl shadow-neutral-300/40 dark:shadow-none">
            <ShaderReveal
              frontImage="/hero-casual.png"
              backImage="/hero-outfit.png"
              mouseForce={20}
              cursorSize={1.5}
              resolution={0.5}
              autoDemo
              autoSpeed={0.3}
              autoIntensity={0.4}
              revealStrength={1.2}
              revealSoftness={0.3}
              className="w-full h-full"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
