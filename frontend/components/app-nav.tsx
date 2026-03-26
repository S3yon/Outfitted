"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shirt, Layers, User } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"

const NAV_ITEMS = [
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Layers },
  { href: "/profile", label: "Profile", icon: User },
] as const

export function AppNav() {
  const pathname = usePathname()

  return (
    <>
      {/* Desktop: top bar */}
      <nav className="hidden md:flex items-center h-14 border-b border-border px-6">
        <Link href="/?home=1" className="text-base font-semibold tracking-tight mr-8">
          Outfitted
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={active ? () => window.scrollTo({ top: 0, behavior: "smooth" }) : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors duration-150",
                  active
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Mobile: bottom tabs */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background/95 backdrop-blur-sm"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={active ? () => window.scrollTo({ top: 0, behavior: "smooth" }) : undefined}
              className="relative flex flex-1 flex-col items-center gap-0.5 py-3 text-xs"
            >
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-x-3 inset-y-1.5 rounded-xl bg-secondary"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className={cn("relative z-10 size-5 transition-colors duration-150", active ? "text-foreground" : "text-muted-foreground")} />
              <span className={cn("relative z-10 transition-colors duration-150", active ? "text-foreground font-medium" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
