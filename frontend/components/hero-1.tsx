"use client";

import { ArrowRight } from "lucide-react";
import { motion } from "motion/react";

export function Hero1() {
  return (
    <section className="w-full flex items-start lg:items-center py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1100px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col space-y-6 sm:space-y-8">
            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl tracking-tight font-medium text-neutral-900 dark:text-white leading-[1.15]"
            >
              Your wardrobe, digitized.
            </motion.h1>

            {/* Sub-headline */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-lg tracking-tight"
            >
              Photograph your clothes, build a virtual closet, and let AI put
              together outfits that match your style.
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="flex items-start gap-3"
            >
              <a
                href="/api/auth/login"
                className="px-6 py-2.5 rounded-md bg-black dark:bg-white text-white dark:text-black font-medium text-sm sm:text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 flex items-center gap-2"
              >
                Get Started
                <ArrowRight className="w-4 h-4" />
              </a>
            </motion.div>
          </div>

          {/* Right Column - Visual Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="relative w-full h-auto"
          >
            <div className="relative w-full h-full min-h-[250px] sm:min-h-[500px] rounded-4xl bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 transition-colors overflow-hidden">
              <img
                src="https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=1740&auto=format&fit=crop"
                alt="Curated wardrobe"
                className="absolute inset-0 w-full h-full object-cover"
              />

              {/* Decorative Circle */}
              <div className="absolute bottom-0 right-0 flex flex-col items-end">
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 200 200"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z"
                    className="fill-white dark:fill-neutral-950"
                  />
                </svg>

                <div className="relative">
                  <div className="w-24 h-24 bg-white dark:bg-neutral-950 rounded-tl-4xl pl-4 pt-4">
                    <button className="w-full h-full cursor-pointer border-none flex items-center justify-center bg-black dark:bg-white border rounded-[1.2em] hover:opacity-90 transition-opacity">
                      <ArrowRight className="w-6 h-6 dark:text-neutral-950 text-white -rotate-45" />
                    </button>
                  </div>

                  {/* Bottom Left SVG */}
                  <svg
                    width="40"
                    height="40"
                    viewBox="0 0 200 200"
                    xmlns="http://www.w3.org/2000/svg"
                    className="absolute bottom-0 -left-[40px]"
                  >
                    <path
                      d="M0 200C155.996 199.961 200.029 156.308 200 0V200H0Z"
                      className="fill-white dark:fill-neutral-950"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
