"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { useEffect, useState } from "react"
import { Shirt, Layers, CalendarDays, CalendarCheck, User } from "lucide-react"
import { motion } from "motion/react"
import { cn } from "@/lib/utils"
import { useDropDot } from "@/components/market/use-drop-dot"

// Market isn't a tab, so a wishlist price drop shows on Wardrobe, where the wishlist and the
// Price watch link live.
const DOT_TAB = "/wardrobe"

function DropDot({ className }: { className?: string }) {
  return <span aria-label="A wishlist price dropped" className={cn("size-1.5 rounded-full bg-emerald-700", className)} />
}

const NAV_ITEMS = [
  { href: "/wardrobe", label: "Wardrobe", icon: Shirt },
  { href: "/outfits", label: "Outfits", icon: Layers },
  { href: "/week", label: "Week", icon: CalendarDays },
  { href: "/wear", label: "Wear", icon: CalendarCheck },
  { href: "/profile", label: "Profile", icon: User },
] as const

export function AppNav() {
  const pathname = usePathname()
  const dropped = useDropDot(true, pathname)

  // Track browser chrome at the bottom (toolbar sliding in on scroll-up)
  // and push the nav above it so it's never hidden
  const [navBottom, setNavBottom] = useState(0)
  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return
    function update() {
      setNavBottom(Math.max(0, window.innerHeight - vv!.offsetTop - vv!.height))
    }
    vv.addEventListener("resize", update)
    update()
    return () => {
      vv!.removeEventListener("resize", update)
    }
  }, [])

  return (
    <>
      {/* Desktop: top bar */}
      <nav className="hidden md:block border-b border-border bg-background">
        <div className="mx-auto flex h-14 max-w-7xl items-center px-5 sm:px-8">
        <Link href="/?home=1" className="font-serif text-2xl leading-none mr-10">
          Outfitted
        </Link>
        <div className="flex h-full items-center gap-8">
          {NAV_ITEMS.map(({ href, label }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
                onClick={active ? () => window.scrollTo({ top: 0, behavior: "smooth" }) : undefined}
                className={cn(
                  "label-caps flex h-full items-center border-b transition-colors duration-150",
                  active
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                {label}
                {dropped && href === DOT_TAB && <DropDot className="ml-1.5 -translate-y-1.5" />}
              </Link>
            )
          })}
        </div>
        </div>
      </nav>

      {/* Mobile: bottom tabs */}
      <nav
        className="md:hidden fixed left-0 right-0 z-50 flex items-center justify-around border-t border-border bg-background transform-gpu"
        style={{ bottom: navBottom, paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              onClick={active ? () => window.scrollTo({ top: 0, behavior: "smooth" }) : undefined}
              className="relative flex flex-1 flex-col items-center gap-1 py-3"
            >
              {active && (
                <motion.div
                  layoutId="tab-pill"
                  className="absolute inset-x-6 top-0 h-px bg-foreground"
                  transition={{ type: "spring", stiffness: 400, damping: 35 }}
                />
              )}
              <Icon className={cn("relative z-10 size-[18px] stroke-[1.5] transition-colors duration-150", active ? "text-foreground" : "text-muted-foreground")} />
              {dropped && href === DOT_TAB && <DropDot className="absolute top-2.5 left-1/2 z-10 ml-3" />}
              <span className={cn("label-caps relative z-10 transition-colors duration-150", active ? "text-foreground" : "text-muted-foreground")}>
                {label}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
