"use client";

import {
  motion,
  useAnimationFrame,
  useMotionValue,
  useTransform,
} from "motion/react";
import { useRef, useState } from "react";

const logits1 = [
  { name: "Acme Corp", url: "#", img: "/mock-logos/acmecorp.svg" },
  { name: "Boltshift", url: "#", img: "/mock-logos/boltshift.svg" },
  { name: "Capsule", url: "#", img: "/mock-logos/capsule.svg" },
  { name: "FeatherDev", url: "#", img: "/mock-logos/featherdev.svg" },
  { name: "GlobalBank", url: "#", img: "/mock-logos/globalbank.svg" },
  { name: "Interlock", url: "#", img: "/mock-logos/interlock.svg" },
];

const logits2 = [
  { name: "Lightbox", url: "#", img: "/mock-logos/lightbox.svg" },
  { name: "Polymath", url: "#", img: "/mock-logos/polymath.svg" },
  { name: "Quotient", url: "#", img: "/mock-logos/quotient.svg" },
  { name: "Sisyphus", url: "#", img: "/mock-logos/sisyphus.svg" },
  { name: "Spherule", url: "#", img: "/mock-logos/spherule.svg" },
  { name: "Luminous", url: "#", img: "/mock-logos/luminous.svg" },
];

const Marquee = ({
  items,
  direction = "left",
  speed = 20,
}: {
  items: typeof logits1;
  direction?: "left" | "right";
  speed?: number;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const xPercent = useMotionValue(0);
  const x = useTransform(xPercent, (v) => `${v}%`);
  const containerRef = useRef<HTMLDivElement>(null);

  useAnimationFrame((time, delta) => {
    if (isHovered) return;

    const moveBy = (speed * delta) / 1000;

    if (direction === "left") {
      const newX = xPercent.get() - moveBy;
      if (newX <= -50) {
        xPercent.set(0);
      } else {
        xPercent.set(newX);
      }
    } else {
      const newX = xPercent.get() + moveBy;
      if (newX >= 0) {
        xPercent.set(-50);
      } else {
        xPercent.set(newX);
      }
    }
  });

  return (
    <div
      className="flex overflow-hidden w-full group"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={containerRef}
    >
      <motion.div
        className="flex shrink-0 gap-8 sm:gap-16 pr-8 sm:pr-16 min-w-full items-center justify-around"
        style={{ x }}
      >
        {[...items, ...items].map((logo, idx) => (
          <a
            key={idx}
            href={logo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300"
          >
            <img
              src={logo.img}
              alt={logo.name}
              className="h-6 md:h-8 w-auto object-contain brightness-0 dark:invert"
            />
          </a>
        ))}
      </motion.div>
      <motion.div
        className="flex shrink-0 gap-8 sm:gap-16 pr-8 sm:pr-16 min-w-full items-center justify-around"
        style={{ x }}
        aria-hidden="true"
      >
        {[...items, ...items].map((logo, idx) => (
          <a
            key={`dup-${idx}`}
            href={logo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center opacity-40 hover:opacity-100 transition-opacity duration-300"
          >
            <img
              src={logo.img}
              alt={logo.name}
              className="h-6 md:h-8 w-auto object-contain brightness-0 dark:invert"
            />
          </a>
        ))}
      </motion.div>
    </div>
  );
};

export function SocialProof9() {
  return (
    <section className="py-24 bg-white dark:bg-neutral-950 text-neutral-900 dark:text-white overflow-hidden">
      <div className="container mx-auto px-4 mb-12 text-center">
        <h3 className="text-sm font-medium tracking-widest uppercase text-black dark:text-white">
          Connecting the world's greatest companies to their customers
        </h3>
      </div>

      <div className="relative flex flex-col gap-16">
        <div className="relative flex w-full flex-col items-center justify-center overflow-hidden">
          <Marquee items={logits1} direction="left" speed={1} />

          <div className="h-8" />

          <Marquee items={logits2} direction="right" speed={1} />

          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-linear-to-r from-white dark:from-neutral-950 to-transparent"></div>
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/3 bg-linear-to-l from-white dark:from-neutral-950 to-transparent"></div>
        </div>
      </div>
    </section>
  );
}
