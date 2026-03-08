import { Navigation7 } from "@/components/navigation-7"
import { Hero1 } from "@/components/hero-1"
import { Features1 } from "@/components/features-1"
import { HowItWorks2 } from "@/components/how-it-works-2"
import Stats4 from "@/components/stats-4"
import FAQ1 from "@/components/faq-1"
import CTA1 from "@/components/cta-1"
import Footer4 from "@/components/footer-4"

export default function LandingPage() {
  return (
    <div className="min-h-svh flex flex-col">
      <Navigation7 />
      <Hero1 />
      <div id="features">
        <Features1 />
      </div>
      <div id="how-it-works">
        <HowItWorks2 />
      </div>
      <Stats4 />
      <FAQ1 />
      <CTA1 />
      <Footer4 />
    </div>
  )
}
