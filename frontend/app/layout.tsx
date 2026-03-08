import type { Metadata } from "next"
import { Geist_Mono, Outfit } from "next/font/google"
import { Auth0Provider } from "@auth0/nextjs-auth0/client"

import "./globals.css"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { SolanaProvider } from "@/providers/solana-provider"
import { cn } from "@/lib/utils"

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" })

const fontMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Outfitted",
  description: "Your wardrobe, digitized. AI-powered personal styling.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn("antialiased", fontMono.variable, "font-sans", outfit.variable)}
    >
      <body>
        <Auth0Provider>
          <SolanaProvider>
            <ThemeProvider>
              {children}
              <Toaster />
            </ThemeProvider>
          </SolanaProvider>
        </Auth0Provider>
      </body>
    </html>
  )
}
