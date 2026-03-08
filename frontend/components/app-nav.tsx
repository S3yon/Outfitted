"use client"

import dynamic from "next/dynamic"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Shirt, Layers, User } from "lucide-react"
import { cn } from "@/lib/utils"

const WalletMultiButton = dynamic(
  () =>
    import("@solana/wallet-adapter-react-ui").then(
      (mod) => mod.WalletMultiButton,
    ),
  { ssr: false },
)

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
        <Link href="/" className="text-base font-semibold tracking-tight mr-8">
          Outfitted
        </Link>
        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const active = pathname.startsWith(href)
            return (
              <Link
                key={href}
                href={href}
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
        <div className="ml-auto">
          <WalletMultiButton
            style={{
              height: 36,
              fontSize: 13,
              borderRadius: 8,
              backgroundColor: "hsl(var(--secondary))",
            }}
          />
        </div>
      </nav>

      {/* Mobile: bottom tabs */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around h-14 border-t border-border bg-background">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 py-1 px-4 text-xs transition-colors duration-150",
                active
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              <Icon className="size-5" />
              {label}
            </Link>
          )
        })}
      </nav>
    </>
  )
}
