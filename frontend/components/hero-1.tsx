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
          color1="#1a1a2e"
          color2="#16213e"
          color3="#0f0f0f"
          timeSpeed={0.15}
          warpStrength={0.8}
          warpFrequency={3}
          warpSpeed={1}
          warpAmplitude={60}
          rotationAmount={300}
          noiseScale={1.5}
          grainAmount={0.08}
          grainScale={2}
          contrast={1.3}
          gamma={1}
          saturation={0.8}
          zoom={0.8}
        />
      </div>

      {/* Dark overlay for readability */}
      <div className="absolute inset-0 z-[1] bg-black/40" />

      {/* Content */}
      <div className="relative z-10 max-w-[1100px] mx-auto w-full text-center flex flex-col items-center gap-6 sm:gap-8">
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl tracking-tight font-medium text-white leading-[1.1]"
        >
          Your wardrobe,
          <br />
          digitized.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.35 }}
          className="text-base sm:text-lg md:text-xl text-neutral-300 leading-relaxed max-w-lg tracking-tight"
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
            className="px-8 py-3 rounded-md bg-white text-neutral-900 font-medium text-sm sm:text-base hover:bg-neutral-200 transition-colors duration-200 flex items-center gap-2"
          >
            Get Started
            <ArrowRight className="w-4 h-4" />
          </a>
          <a
            href="#how-it-works"
            className="text-sm sm:text-base text-neutral-400 hover:text-white transition-colors duration-200"
          >
            See how it works
          </a>
        </motion.div>
      </div>
    </section>
  );
}
