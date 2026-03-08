"use client";

import { useState } from "react";
import { motion } from "motion/react";
import { ArrowRight } from "lucide-react";

const cards = [
  {
    number: 1,
    title: "Upload Your Clothes",
    link: "Start uploading",
    items: ["Snap a photo from your phone", "AI removes the background", "Clean cutout saved to your closet"],
    image:
      "https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?q=80&w=800&auto=format&fit=crop",
  },
  {
    number: 2,
    title: "Set Your Style Profile",
    link: "Take the quiz",
    items: ["Pick your vibe and fit preference", "Choose your go-to colors", "Tell us your occasions", "Add style influences"],
    image:
      "https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=800&auto=format&fit=crop",
  },
  {
    number: 3,
    title: "Get Curated Outfits",
    link: "See example outfits",
    items: ["AI combines your real items", "Styled to your personal vibe"],
    image:
      "https://images.unsplash.com/photo-1558171813-4c088753af8f?q=80&w=800&auto=format&fit=crop",
  },
];

export function HowItWorks2() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <section
      className="w-full py-12 px-4 sm:px-6 lg:px-8"
      aria-label="How it works"
    >
      <div className="max-w-[1100px] mx-auto w-full">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight text-neutral-900 dark:text-white mb-10 sm:mb-12 lg:mb-16"
        >
          How It Works
        </motion.h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6 mb-10 sm:mb-12 lg:mb-16">
          {cards.map((card, idx) => (
            <motion.article
              key={card.number}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: idx * 0.1 }}
              className="relative overflow-hidden rounded-2xl bg-white dark:bg-neutral-900 min-h-[400px] sm:min-h-[450px] lg:min-h-[500px] flex flex-col cursor-pointer border border-neutral-200/60 dark:border-neutral-800"
              onMouseEnter={() => setHoveredCard(card.number)}
              onMouseLeave={() => setHoveredCard(null)}
              aria-label={`Step ${card.number}: ${card.title}`}
            >
              <motion.div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${card.image})` }}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{
                  opacity: hoveredCard === card.number ? 1 : 0,
                  scale: hoveredCard === card.number ? 1 : 1.1,
                }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
              <motion.div
                className="absolute inset-0 bg-black/60"
                initial={{ opacity: 0 }}
                animate={{ opacity: hoveredCard === card.number ? 1 : 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
              />

              <div className="relative z-10 flex flex-col h-full pt-6 sm:pt-8 px-6 sm:px-8">
                <div className="flex-1">
                  <div
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold mb-4 transition-colors duration-300 ${hoveredCard === card.number
                      ? "bg-white text-neutral-900"
                      : "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900"
                      }`}
                  >
                    {card.number}
                  </div>

                  <h3
                    className={`text-xl sm:text-2xl lg:text-3xl font-medium tracking-tight leading-tight mb-2 transition-colors duration-300 ${hoveredCard === card.number
                      ? "text-white"
                      : "text-neutral-900 dark:text-white"
                      }`}
                  >
                    {card.title}
                  </h3>

                  <a
                    href="#"
                    className={`inline-flex items-center gap-2 text-sm font-medium transition-colors duration-300 group ${hoveredCard === card.number
                      ? "text-white/90 hover:text-white"
                      : "text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white"
                      }`}
                  >
                    {card.link}
                    <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
                  </a>
                </div>

                <div className="mt-auto -mx-6 sm:-mx-8">
                  {card.items.map((item, itemIdx) => (
                    <div
                      key={itemIdx}
                      className={`py-3 px-6 border-t transition-colors duration-300 ${hoveredCard === card.number
                        ? "border-white/20 text-white/90"
                        : "border-neutral-200 dark:border-neutral-800 text-neutral-700 dark:text-neutral-300"
                        }`}
                    >
                      <span className="text-sm">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.article>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="text-center"
        >
          <a
            href="#"
            className="inline-flex items-center gap-2 text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition-colors duration-200 group"
          >
            <span className="text-sm sm:text-base">
              Upload your first item and get styled in under a minute.
            </span>
            <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-1" />
          </a>
        </motion.div>
      </div>
    </section>
  );
}
