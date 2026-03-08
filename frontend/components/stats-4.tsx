"use client";

import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const stats = [
  {
    label: "Items uploaded",
    value: "50K+",
    highlight: false,
  },
  {
    label: "Outfits generated",
    value: "120K+",
    highlight: false,
  },
  {
    label: "Backgrounds removed",
    value: "48K+",
    highlight: false,
  },
  {
    label: "Avg generation time",
    value: "<3s",
    highlight: true,
  },
];

export default function Stats4() {
  return (
    <section className="w-full py-12 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950">
      <div className="max-w-[1100px] mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 xl:gap-16 items-center">
          {/* Left Column - Content */}
          <div className="flex flex-col lg:justify-between lg:min-h-[400px]">
            {/* Title */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="text-4xl sm:text-5xl md:text-6xl font-medium tracking-tight text-neutral-900 dark:text-white leading-normal sm:leading-[0.6]"
            >
              Your closet in numbers
            </motion.h2>

            {/* Description and Button */}
            <div className="space-y-6 sm:space-y-8 mt-8 lg:mt-0">
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 leading-relaxed max-w-md"
              >
                Outfitted users are building smarter wardrobes and discovering
                new outfits from clothes they already own.
              </motion.p>

              <motion.a
                href="/api/auth/login"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="cursor-pointer inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-3.5 rounded-full bg-black dark:bg-white text-white dark:text-black font-medium text-sm sm:text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200 w-fit"
              >
                Start styling
                <ArrowRight className="w-5 h-5" />
              </motion.a>
            </div>
          </div>

          {/* Right Column - Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: 0.1 + index * 0.1 }}
                className="relative rounded-3xl border border-neutral-200 dark:border-neutral-800 shadow-md overflow-hidden p-6 min-h-[180px] sm:min-h-[200px] flex flex-col justify-between bg-white dark:bg-neutral-900"
              >
                {/* Dotted Background */}
                <div
                  className="absolute inset-0 z-0"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(0, 0, 0, 0.1) 1px, transparent 0)",
                    backgroundSize: "14px 14px",
                  }}
                />
                {/* Dark mode dotted background */}
                <div
                  className="absolute inset-0 z-0 opacity-0 dark:opacity-100 transition-opacity"
                  style={{
                    backgroundImage:
                      "radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0)",
                    backgroundSize: "14px 14px",
                  }}
                />

                {/* Content */}
                <div className="relative z-10 flex flex-col justify-between h-full">
                  <div className="flex items-center gap-2">
                    <p
                      className={`text-sm sm:text-base ${
                        stat.highlight
                          ? "text-green-600 dark:text-green-500"
                          : "text-neutral-600 dark:text-neutral-400"
                      }`}
                    >
                      {stat.label}
                    </p>
                    {stat.highlight && (
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-500 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-green-600 dark:bg-green-500"></span>
                      </span>
                    )}
                  </div>
                  <p
                    className={`text-4xl sm:text-5xl md:text-6xl font-medium tracking-tighter ${
                      stat.highlight
                        ? "text-green-600 dark:text-green-500"
                        : "text-neutral-900 dark:text-white"
                    }`}
                  >
                    {stat.value}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
