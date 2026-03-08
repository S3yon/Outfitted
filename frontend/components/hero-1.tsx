"use client";

import dynamic from "next/dynamic";
import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

const Grainient = dynamic(() => import("@/components/grainient"), {
  ssr: false,
});

export function Hero1() {
  return (
    <section className="relative w-full h-svh flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-neutral-950">
      {/* Grainient Background */}
      <div className="absolute inset-0 z-0 w-full h-full">
        <Grainient
          color1="#ffffff"
          color2="#666666"
          color3="#000000"
          timeSpeed={0.2}
          warpStrength={1}
          warpFrequency={4}
          warpSpeed={1.5}
          warpAmplitude={40}
          rotationAmount={400}
          noiseScale={2}
          grainAmount={0.1}
          grainScale={2}
          contrast={1.5}
          gamma={1}
          saturation={0}
          zoom={0.9}
          className="w-full h-full"
        />
      </div>
      {/* Darken overlay so white text reads over bright grain areas */}
      <div className="absolute inset-0 z-[1] bg-black/50" />

      {/* Content */}
      <div className="relative z-[2] max-w-[1100px] mx-auto w-full grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
        {/* Left - Text */}
        <div className="flex flex-col gap-6 sm:gap-8 text-center lg:text-left items-center lg:items-start">
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
