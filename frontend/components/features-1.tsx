"use client";

import { useCallback, useEffect, useState } from "react";
import { motion } from "motion/react";
import useEmblaCarousel from "embla-carousel-react";
import {
  Camera,
  Wand2,
  Grid2x2,
  Shirt,
  Palette,
  Sparkles,
  Filter,
  UserCheck,
} from "lucide-react";

export function Features1() {
  const features = [
    {
      icon: Camera,
      title: "Photo Upload",
      description: "Upload from your phone or desktop camera roll.",
    },
    {
      icon: Wand2,
      title: "Background Removal",
      description: "Cloudinary AI strips backgrounds automatically.",
    },
    {
      icon: Grid2x2,
      title: "Digital Closet",
      description: "All your items in a clean, browsable grid.",
    },
    {
      icon: Shirt,
      title: "Outfit Generation",
      description: "AI combines your items into complete outfits.",
    },
    {
      icon: Palette,
      title: "Color Matching",
      description: "Outfits that respect your preferred palette.",
    },
    {
      icon: Sparkles,
      title: "Style Profiling",
      description: "A quick quiz teaches our AI your personal vibe.",
    },
    {
      icon: Filter,
      title: "Category Filters",
      description: "Browse by tops, bottoms, shoes, accessories.",
    },
    {
      icon: UserCheck,
      title: "Personalized Fits",
      description: "Every outfit matches your style and occasions.",
    },
  ];

  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false, align: "start" });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  return (
    <section className="w-full py-16 px-5 md:px-8 lg:px-8">
      <div className="max-w-[1100px] mx-auto">
        {/* Header */}
        <div className="mb-10 md:mb-16 lg:mb-20">
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4 }}
            className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400 mb-4"
          >
            Features
          </motion.p>

          <motion.h2
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.1 }}
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-normal text-neutral-900 dark:text-white mb-6"
          >
            Everything your closet needs
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-base sm:text-lg text-neutral-600 dark:text-neutral-400 max-w-xl"
          >
            Upload your real clothes, get AI-processed cutouts, and let
            our stylist build outfits from what you already own.
          </motion.p>
        </div>

        {/* Mobile: swipe carousel */}
        <div className="md:hidden">
          <div className="overflow-hidden -mx-5" ref={emblaRef}>
            <div className="flex">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div
                    key={index}
                    className="flex-[0_0_80%] min-w-0 pl-5 pr-2 first:pl-5"
                  >
                    <div className="flex flex-col gap-3 p-5 rounded-2xl border border-neutral-200/60 dark:border-neutral-800 bg-white/60 dark:bg-neutral-950/60 h-full">
                      <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
                        <Icon className="w-5 h-5 text-neutral-900 dark:text-white" />
                      </div>
                      <h3 className="text-base font-medium tracking-tight text-neutral-900 dark:text-white">
                        {feature.title}
                      </h3>
                      <p className="text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
                        {feature.description}
                      </p>
                    </div>
                  </div>
                );
              })}
              {/* trailing padding slide */}
              <div className="flex-[0_0_5%] min-w-0" />
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-5">
            {features.map((_, index) => (
              <button
                key={index}
                onClick={() => emblaApi?.scrollTo(index)}
                className={`rounded-full transition-all duration-300 ${
                  index === selectedIndex
                    ? "w-4 h-1.5 bg-neutral-900 dark:bg-white"
                    : "w-1.5 h-1.5 bg-neutral-300 dark:bg-neutral-700"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Desktop: original grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-8 md:gap-x-8 md:gap-y-12">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: index * 0.05 }}
                className="flex flex-col"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="inline-flex items-center justify-center w-10 h-10 sm:w-12 sm:h-12 rounded-xl border border-neutral-200/60 dark:border-neutral-800 bg-white dark:bg-neutral-950 shadow-sm">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-neutral-900 dark:text-white" />
                  </div>
                  <h3 className="text-base tracking-tight font-light text-neutral-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-xs tracking-tight font-light max-w-[20ch] sm:text-base text-neutral-600 dark:text-neutral-400 leading-relaxed line-clamp-2">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
