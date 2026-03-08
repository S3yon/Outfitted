"use client";

import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
  MotionValue,
} from "motion/react";

const backgroundCards = [
  {
    id: 1,
    image:
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
    x: "10%",
    y: "12%",
    rotation: -12,
    scale: 1,
    opacity: 0.15,
    intensity: 0.02,
  },
  {
    id: 2,
    image:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    x: "70%",
    y: "10%",
    rotation: 8,
    scale: 0.9,
    opacity: 0.2,
    intensity: 0.03,
  },
  {
    id: 3,
    image:
      "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?w=400&h=400&fit=crop",
    x: "30%",
    y: "40%",
    rotation: 15,
    scale: 1.1,
    opacity: 0.12,
    intensity: 0.04,
  },
  {
    id: 4,
    image:
      "https://images.unsplash.com/photo-1639149888905-fb39731f2e6c?w=400&h=400&fit=crop",
    x: "75%",
    y: "67%",
    rotation: -8,
    scale: 0.95,
    opacity: 0.18,
    intensity: 0.02,
  },
  {
    id: 5,
    image:
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=400&fit=crop",
    x: "55%",
    y: "37%",
    rotation: -12,
    scale: 1,
    opacity: 0.1,
    intensity: 0.03,
  },
  {
    id: 6,
    image:
      "https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=400&h=400&fit=crop",
    x: "8%",
    y: "67%",
    rotation: -15,
    scale: 0.85,
    opacity: 0.15,
    intensity: 0.04,
  },
];

function BackgroundCard({
  card,
  smoothMouseX,
  smoothMouseY,
  index,
}: {
  card: (typeof backgroundCards)[0];
  smoothMouseX: MotionValue<number>;
  smoothMouseY: MotionValue<number>;
  index: number;
}) {
  const parallaxX = useTransform(
    smoothMouseX,
    [-1, 1],
    [-15 * card.intensity * 100, 15 * card.intensity * 100],
  );
  const parallaxY = useTransform(
    smoothMouseY,
    [-1, 1],
    [-10 * card.intensity * 100, 10 * card.intensity * 100],
  );

  return (
    <motion.div
      className="absolute"
      style={{
        left: card.x,
        top: card.y,
        x: parallaxX,
        y: parallaxY,
        rotate: card.rotation,
        scale: card.scale,
        opacity: card.opacity,
      }}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: card.opacity, scale: card.scale }}
      transition={{ duration: 0.8, delay: index * 0.1 }}
    >
      <div className="w-32 h-32 sm:w-40 sm:h-40 md:w-48 md:h-48 rounded-2xl overflow-hidden shadow-xl">
        <img
          src={card.image}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      </div>
    </motion.div>
  );
}

export default function CTA1() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springConfig = { damping: 50, stiffness: 100 };
  const smoothMouseX = useSpring(mouseX, springConfig);
  const smoothMouseY = useSpring(mouseY, springConfig);

  const handleMouseMove = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
    mouseX.set(x);
    mouseY.set(y);
  };

  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center py-12 sm:py-16 md:py-20 lg:py-24 px-4 sm:px-6 lg:px-8 bg-white dark:bg-neutral-950 overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {/* Background Cards Layer */}
      <div className="absolute inset-0 pointer-events-none">
        {backgroundCards.map((card, index) => (
          <BackgroundCard
            key={card.id}
            card={card}
            smoothMouseX={smoothMouseX}
            smoothMouseY={smoothMouseY}
            index={index}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 max-w-[1400px] mx-auto w-full">
        <div className="max-w-4xl mx-auto text-center">
          {/* Heading */}
          <motion.h1
            className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-[1.15] mb-4 sm:mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <span className="text-neutral-900 dark:text-white font-medium tracking-tight">
              Ready to digitize
            </span>
            <br />
            <span className="text-neutral-900 dark:text-white font-medium tracking-tight">
              your wardrobe?
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            className="text-base sm:text-lg md:text-xl text-neutral-600 dark:text-neutral-400 leading-relaxed mb-8 sm:mb-10 md:mb-12 max-w-xl mx-auto"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            Upload your clothes, tell us your style, and get AI-curated outfits
            every day. Free to use.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            className="mb-6 sm:mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <a
              href="/api/auth/login"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-md bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 font-medium text-base hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-colors duration-200"
            >
              Get Started Free
            </a>
          </motion.div>

          {/* Login Link */}
          <motion.p
            className="text-sm sm:text-base text-neutral-600 dark:text-neutral-400"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            Already have an account?{" "}
            <a
              href="/api/auth/login"
              className="text-neutral-900 dark:text-white font-medium hover:underline transition-all duration-200"
            >
              Log in
            </a>
          </motion.p>
        </div>
      </div>
    </section>
  );
}
