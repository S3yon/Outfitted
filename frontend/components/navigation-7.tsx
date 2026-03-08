"use client";

import { useState, useEffect } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { motion, AnimatePresence } from "motion/react";
import { Menu, X } from "lucide-react";

interface NavItem {
  label: string;
  href: string;
}

export function Navigation7() {
  const { user, isLoading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    function onScroll() {
      setScrolled(window.scrollY > 20);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navItems: NavItem[] = [
    { label: "How It Works", href: "#how-it-works" },
    { label: "Features", href: "#features" },
  ];

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 w-full py-4 px-4 sm:px-6 lg:px-8 transition-all duration-300 ${
          scrolled
            ? "backdrop-blur-xl bg-white/70 dark:bg-neutral-950/70 border-b border-neutral-200/50 dark:border-neutral-800/50 shadow-sm"
            : "bg-transparent border-b border-transparent"
        }`}
      >
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between gap-8">
          {/* Left: Logo + Nav */}
          <div className="flex items-center gap-6">
            <a
              href="/"
              className="text-base font-semibold tracking-tight text-neutral-800 dark:text-white"
              aria-label="Home"
            >
              Outfitted
            </a>

            <div className="hidden md:flex items-center gap-1">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="px-3 py-1.5 rounded-md text-sm tracking-tight font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            {!isLoading && !user && (
              <>
                <a
                  href="/login"
                  className="hidden md:block px-3 py-1.5 rounded-md text-sm font-medium tracking-tight text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  Log in
                </a>
                <a
                  href="/login"
                  className="px-4 py-2 bg-neutral-800 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm font-medium tracking-tight transition-colors"
                >
                  Get Started
                </a>
              </>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-white/95 dark:bg-neutral-950/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex items-center justify-between py-4 px-4">
              <span className="text-base font-semibold tracking-tight text-neutral-800 dark:text-white">
                Outfitted
              </span>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="px-4 pt-4 space-y-1">
              {navItems.map((item, index) => (
                <motion.a
                  key={item.label}
                  href={item.href}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="block px-4 py-3 rounded-lg text-base font-medium text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors"
                >
                  {item.label}
                </motion.a>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.15 }}
              className="absolute bottom-0 left-0 right-0 p-4 space-y-3 border-t border-neutral-200/50 dark:border-neutral-800/50"
            >
              {!isLoading && !user && (
                <>
                  <a
                    href="/login"
                    className="block w-full px-4 py-3 rounded-lg text-sm font-medium text-neutral-700 dark:text-neutral-200 text-center hover:bg-neutral-100/60 dark:hover:bg-neutral-800/60 transition-colors"
                  >
                    Log in
                  </a>
                  <a
                    href="/login"
                    className="block w-full px-4 py-3 bg-neutral-800 dark:bg-white hover:bg-neutral-700 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg text-sm font-medium transition-colors text-center"
                  >
                    Get Started
                  </a>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
