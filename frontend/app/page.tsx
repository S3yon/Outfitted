import { Navigation7 } from "@/components/navigation-7"
import { Hero1 } from "@/components/hero-1"
import { Features1 } from "@/components/features-1"
import { HowItWorks2 } from "@/components/how-it-works-2"
import Stats4 from "@/components/stats-4"
import FAQ1 from "@/components/faq-1"
import CTA1 from "@/components/cta-1"
import Footer4 from "@/components/footer-4"

function Divider() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="border-t border-neutral-200/40 dark:border-neutral-800" />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="relative min-h-svh flex flex-col bg-gradient-to-br from-rose-50 via-amber-50 to-violet-50 dark:from-neutral-950 dark:via-neutral-900 dark:to-neutral-950">
      {/* Decorative blobs that span the whole page */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute top-[5%] right-[-5%] w-[500px] h-[500px] rounded-full bg-rose-200/25 dark:bg-rose-900/10 blur-3xl" />
        <div className="absolute top-[35%] left-[-8%] w-[400px] h-[400px] rounded-full bg-violet-200/25 dark:bg-violet-900/10 blur-3xl" />
        <div className="absolute top-[60%] right-[10%] w-[350px] h-[350px] rounded-full bg-amber-200/20 dark:bg-amber-900/10 blur-3xl" />
        <div className="absolute top-[85%] left-[15%] w-[300px] h-[300px] rounded-full bg-rose-100/20 dark:bg-rose-900/5 blur-3xl" />
      </div>

      <div className="relative z-10 flex flex-col">
        <Navigation7 />
        <Hero1 />
        <Divider />
        <div id="how-it-works">
          <HowItWorks2 />
        </div>
        <Divider />
        <div id="features">
          <Features1 />
        </div>
        <Divider />
        <Stats4 />
        <Divider />
        <FAQ1 />
        <Divider />
        <CTA1 />
        <Divider />
        <Footer4 />
      </div>
    </div>
  )
}
