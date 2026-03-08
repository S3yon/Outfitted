"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";
import Grainient from "@/components/grainient";

export function Hero1() {
  return (
    <section className="relative w-full min-h-svh flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden">
      {/* Grainient Background */}
      <div className="absolute inset-0 z-0">
        <Grainient
          color1="#ffffff"
          color2="#a0a0a0"
          color3="#000000"
          timeSpeed={0.15}
          warpStrength={0.8}
          warpFrequency={3}
          warpSpeed={1}
          warpAmplitude={60}
          rotationAmount={300}
          noiseScale={1.5}
          grainAmount={0.12}
          grainScale={2}
          contrast={1.4}
          gamma={1}
          saturation={0}
          zoom={0.8}
        />
      </div>

      {/* Content */}
      <div className="relative z-10 max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left - Text */}
        <div className="flex flex-col gap-6 sm:gap-8 text-center lg:text-left items-center lg:items-start">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium text-neutral-900 dark:text-white leading-[1.1]"
          >
            Your wardrobe,
            <br />
            digitized.
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.35 }}
            className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-lg tracking-tight"
          >
            Photograph your clothes, build a virtual closet, and let AI put
            together outfits that match your style.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="flex flex-col sm:flex-row items-center gap-4"
          >
            <a
              href="/api/auth/login"
              className="px-8 py-3 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-sm sm:text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 flex items-center gap-2"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </a>
            <a
              href="#how-it-works"
              className="text-sm sm:text-base text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200"
            >
              See how it works
            </a>
          </motion.div>
        </div>

        {/* Right - Image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="relative w-full"
        >
          <div className="relative w-full min-h-[300px] sm:min-h-[450px] lg:min-h-[500px] rounded-2xl overflow-hidden">
            <img
              src="https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=1740&auto=format&fit=crop"
              alt="Curated wardrobe"
              className="absolute inset-0 w-full h-full object-cover"
            />
          </div>
        </motion.div>
      </div>
    </section>
  );
}
