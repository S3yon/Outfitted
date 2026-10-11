"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function FAQ1() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      question: "How does the background removal work?",
      answer:
        "When you upload a photo of a clothing item, we send it to Cloudinary's AI Background Removal tool. It automatically strips the real-world background and returns a clean, transparent PNG that looks great in your digital closet.",
    },
    {
      question: "What kind of photos should I take?",
      answer:
        "Lay your clothing flat on a solid surface with good lighting. Make sure the entire item is in frame and the background contrasts with the clothing. Near a window works great for natural light.",
    },
    {
      question: "How does the AI generate outfits?",
      answer:
        "Our AI stylist (powered by Google Gemini) reads your style profile and your uploaded wardrobe items, then builds outfit combinations that match your vibe, color preferences, and typical occasions.",
    },
    {
      question: "Is Outfitted free to use?",
      answer:
        "Outfitted is completely free. Sign up, upload your clothes, and start getting AI-curated outfits right away. No credit card required.",
    },
    {
      question: "Can I retake the style quiz?",
      answer:
        "Yes. Visit your Profile page and hit the retake button anytime your style evolves. The AI will immediately adapt its outfit recommendations to your updated preferences.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="w-full border-b border-border">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 lg:grid-cols-[1fr_2fr]">
        <div className="border-b border-border px-5 py-10 sm:px-8 lg:border-b-0 lg:border-r lg:py-14">
          <div className="lg:sticky lg:top-24">
            <h2 className="font-serif text-5xl leading-none sm:text-6xl">FAQ</h2>
            <p className="mt-4 max-w-[25ch] text-base leading-relaxed text-muted-foreground">
              Everything you need to know about Outfitted.
            </p>
          </div>
        </div>

        <div className="flex flex-col">
          {faqs.map((faq, index) => (
            <div
              key={faq.question}
              className={index < faqs.length - 1 ? "border-b border-border" : ""}
            >
              <button
                onClick={() => toggleFAQ(index)}
                aria-expanded={openIndex === index}
                className="group flex w-full items-start justify-between gap-6 px-5 py-6 text-left sm:px-8"
              >
                <span className="font-serif text-2xl leading-tight transition-colors group-hover:text-muted-foreground">
                  {faq.question}
                </span>
                <span className="mt-1 shrink-0 text-muted-foreground">
                  {openIndex === index ? <Minus className="h-5 w-5" /> : <Plus className="h-5 w-5" />}
                </span>
              </button>

              <AnimatePresence initial={false}>
                {openIndex === index && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-2xl px-5 pb-6 text-base leading-relaxed text-muted-foreground sm:px-8">
                      {faq.answer}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
