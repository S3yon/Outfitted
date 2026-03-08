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
      <div className="border-t border-neutral-200 dark:border-neutral-800" />
    </div>
  )
}

export default function LandingPage() {
  return (
    <div className="min-h-svh flex flex-col">
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
  )
}
