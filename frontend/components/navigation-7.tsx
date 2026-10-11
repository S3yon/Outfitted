"use client";

import { useState } from "react";
import { useUser } from "@auth0/nextjs-auth0/client";
import { Menu, X } from "lucide-react";
import Link from "next/link";

const navItems = [
  { label: "How it works", href: "#how-it-works" },
  { label: "Features", href: "#features" },
  { label: "FAQ", href: "#faq" },
];

export function Navigation7() {
  const { user, isLoading } = useUser();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <>
      <nav className="sticky top-0 z-50 w-full border-b border-border bg-background">
        <div className="mx-auto flex h-14 w-full max-w-[1200px] items-center justify-between px-5 sm:px-8">
          <Link href="/" className="font-serif text-2xl leading-none text-foreground" aria-label="Home">
            Outfitted
          </Link>

          <div className="hidden items-center gap-8 md:flex">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="label-caps text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {!isLoading && !user && (
              <a
                href="/login"
                className="label-caps border border-foreground px-4 py-2 text-foreground transition-colors hover:bg-foreground hover:text-background"
              >
                Log in
              </a>
            )}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 text-foreground md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </div>
      </nav>

      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex flex-col bg-background md:hidden">
          <div className="flex h-14 items-center justify-between border-b border-border px-5">
            <span className="font-serif text-2xl leading-none">Outfitted</span>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-foreground"
              aria-label="Close menu"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1">
            {navItems.map((item) => (
              <a
                key={item.label}
                href={item.href}
                onClick={() => setIsMobileMenuOpen(false)}
                className="block border-b border-border px-5 py-5 font-serif text-3xl text-foreground"
              >
                {item.label}
              </a>
            ))}
          </div>

          {!isLoading && !user && (
            <div className="border-t border-border p-5">
              <a
                href="/login"
                className="label-caps block w-full bg-foreground px-4 py-4 text-center text-background"
              >
                Log in
              </a>
            </div>
          )}
        </div>
      )}
    </>
  );
}
