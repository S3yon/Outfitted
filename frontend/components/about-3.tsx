"use client";

import { motion } from "motion/react";

interface Metric {
  value: string;
  description: string;
}

interface FacilityData {
  title: string;
  location: string;
  image: string;
  metrics: Metric[];
}

const FACILITY: FacilityData = {
  title: "HQ_Tokyo",
  location: "Shibuya",
  image:
    "https://images.unsplash.com/photo-1497366216548-37526070297c?w=800&q=80",
  metrics: [
    {
      value: "250+",
      description: "TEAM MEMBERS",
    },
    {
      value: "45K sqft",
      description: "WORKSPACE AREA",
    },
  ],
};

export default function About3() {
  return (
    <section className="w-full min-h-screen flex items-center py-12 px-4 sm:px-6 lg:px-8 bg-neutral-50 dark:bg-neutral-950">
      <div className="max-w-[1400px] mx-auto w-full">
        <div className="relative rounded-[4rem] overflow-hidden bg-linear-to-br from-neutral-100 to-neutral-200 dark:from-neutral-900/50 dark:to-neutral-800/50 border border-neutral-200 dark:border-neutral-800 shadow-2xl">
          {/* Background Image */}
          <div className="absolute inset-0 opacity-70 dark:opacity-60">
            <img
              src="https://images.unsplash.com/photo-1497366216548-37526070297c?w=1600&q=80"
              alt="Background"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-br from-neutral-100/60 to-neutral-200/60 dark:from-neutral-900/60 dark:to-neutral-800/60"></div>
          </div>

          {/* Content */}
          <div className="relative p-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-end">
              {/* Left: Title */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="flex items-end justify-center md:justify-start pt-12 md:pt-0"
              >
                <h2 className="text-4xl sm:text-5xl lg:text-6xl xl:text-7xl font-light tracking-tighter text-neutral-900 dark:text-white md:ml-16 md:mb-16">
                  {FACILITY.title}
                </h2>
              </motion.div>

              {/* Right: Overlaid Cards */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                className="relative w-full md:max-w-xs md:ml-auto"
              >
                <div className="space-y-2">
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
                    className="relative aspect-square rounded-[3.6rem] overflow-hidden backdrop-blur-xl bg-white/10 dark:bg-white/5 border border-white/20 dark:border-white/10 shadow-xl"
                  >
                    <img
                      src={FACILITY.image}
                      alt={FACILITY.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-8 left-8">
                      <div className="w-fit px-3 py-1.5 rounded-full backdrop-blur-md bg-black/30 border border-white/20">
                        <p className="text-xs sm:text-sm text-white font-light tracking-tight">
                          {FACILITY.location}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                    className="aspect-square rounded-[3.6rem] backdrop-blur-2xl bg-white/5 dark:bg-white/5 border border-white/30 dark:border-white/20 shadow-2xl p-8 flex flex-col justify-between"
                  >
                    <div className="flex items-start justify-between">
                      <p className="text-xs sm:text-sm text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">
                        ALL STATS
                      </p>
                    </div>
                    <div className="space-y-6 sm:space-y-8 mt-auto">
                      {FACILITY.metrics.map((metric, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{
                            duration: 0.5,
                            delay: 0.4 + index * 0.1,
                          }}
                        >
                          <div className="text-3xl sm:text-4xl font-light tracking-tight text-white mb-1 sm:mb-2">
                            {metric.value}
                          </div>
                          <div className="text-xs text-neutral-400 dark:text-neutral-500 uppercase tracking-tight">
                            {metric.description}
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
