"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChevronDown, Menu, X } from "lucide-react";

interface DropdownItem {
  title: string;
  description: string;
  badge?: string;
  href: string;
}

interface NavItem {
  label: string;
  href?: string;
  dropdown?: {
    title: string;
    items: DropdownItem[];
  };
}

export function Navigation7() {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpandedItem, setMobileExpandedItem] = useState<string | null>(
    null,
  );

  const navItems: NavItem[] = [
    { label: "Features", href: "#features" },
    { label: "How It Works", href: "#how-it-works" },
  ];

  return (
    <>
      <nav className="absolute top-0 left-0 right-0 z-50 w-full py-6 px-4 sm:px-6 lg:px-8 bg-transparent">
        <div className="max-w-[1100px] mx-auto w-full flex items-center justify-between gap-8">
          {/* Left side: Logo + Nav Items */}
          <div className="flex items-center gap-2">
            {/* Logo */}
            <a
              href="/"
              className="flex items-center justify-center h-10 px-3 text-base font-semibold tracking-tight text-neutral-900 dark:text-white"
              aria-label="Home"
            >
              Outfitted
            </a>

            {/* Nav Items */}
            <div className="hidden md:flex items-center gap-2">
              {navItems.map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  className="flex items-center gap-1.5 px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md transition-colors text-sm tracking-tight font-medium text-neutral-900 dark:text-neutral-100"
                >
                  {item.label}
                </a>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {/* Desktop Buttons */}
            <a href="/api/auth/login" className="hidden md:block px-4 h-10 leading-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors">
              Log in
            </a>
            <a href="/api/auth/login" className="px-4 h-10 leading-10 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md text-sm font-medium tracking-tight transition-colors">
              Get Started
            </a>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="md:hidden px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium tracking-tight text-neutral-900 dark:text-neutral-100 transition-colors flex items-center gap-2"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 bg-white dark:bg-neutral-950 md:hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between py-6 px-4">
              <span className="text-base font-semibold tracking-tight text-neutral-900 dark:text-white px-3">
                Outfitted
              </span>
              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setMobileExpandedItem(null);
                }}
                className="flex items-center gap-2 px-4 h-10 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium text-neutral-900 dark:text-neutral-100 transition-colors"
                aria-label="Close menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Menu Content */}
            <div className="overflow-y-auto h-[calc(100vh-240px)] p-4 sm:p-6">
              <nav className="space-y-2">
                {navItems.map((item, index) => (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: index * 0.05,
                      ease: [0.4, 0, 0.2, 1],
                    }}
                  >
                    <button
                      onClick={() =>
                        setMobileExpandedItem(
                          mobileExpandedItem === item.label ? null : item.label,
                        )
                      }
                      className="w-full flex items-center justify-between px-4 py-3 bg-neutral-100 dark:bg-neutral-900 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md text-left transition-colors"
                    >
                      <span className="font-medium text-neutral-900 dark:text-neutral-100">
                        {item.label}
                      </span>
                      <motion.div
                        animate={{
                          rotate: mobileExpandedItem === item.label ? 180 : 0,
                        }}
                        transition={{ duration: 0.2 }}
                      >
                        <ChevronDown className="w-5 h-5 text-neutral-500 dark:text-neutral-400" />
                      </motion.div>
                    </button>

                    {/* Expandable Content */}
                    <AnimatePresence>
                      {mobileExpandedItem === item.label && item.dropdown && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 pb-1 space-y-1">
                            {item.dropdown.items.map((dropdownItem, idx) => (
                              <motion.a
                                key={idx}
                                href={dropdownItem.href}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{
                                  duration: 0.2,
                                  delay: idx * 0.03,
                                }}
                                onClick={() => {
                                  setIsMobileMenuOpen(false);
                                  setMobileExpandedItem(null);
                                }}
                                className="block p-3 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 transition-colors"
                              >
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="text-sm font-medium text-neutral-900 dark:text-neutral-100">
                                    {dropdownItem.title}
                                  </h3>
                                  {dropdownItem.badge && (
                                    <span className="text-[10px] font-semibold text-neutral-600 dark:text-neutral-400 bg-neutral-200 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                      {dropdownItem.badge}
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
                                  {dropdownItem.description}
                                </p>
                              </motion.a>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </nav>
            </div>

            {/* Mobile Action Buttons - Fixed at Bottom */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 space-y-3 bg-white dark:bg-neutral-950 border-t border-neutral-200 dark:border-neutral-800"
            >
              <a href="/api/auth/login" className="block w-full px-4 py-3 bg-neutral-200 dark:bg-neutral-900 hover:bg-neutral-300 dark:hover:bg-neutral-800 rounded-md text-sm font-medium text-neutral-900 dark:text-neutral-100 transition-colors text-center">
                Log in
              </a>
              <a href="/api/auth/login" className="block w-full px-4 py-3 bg-neutral-900 dark:bg-white hover:bg-neutral-800 dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-md text-sm font-medium transition-colors text-center">
                Get Started
              </a>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
