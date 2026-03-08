import { redirect } from "next/navigation"
import { auth0 } from "@/lib/auth0"
import { Navigation7 } from "@/components/navigation-7"
import { Hero1 } from "@/components/hero-1"
import { Features1 } from "@/components/features-1"
import { HowItWorks2 } from "@/components/how-it-works-2"
import Stats4 from "@/components/stats-4"
import FAQ1 from "@/components/faq-1"
import CTA1 from "@/components/cta-1"
import Footer4 from "@/components/footer-4"
import Grainient from "@/components/grainient"

function Divider() {
  return (
    <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
      <div className="border-t border-neutral-200/40 dark:border-neutral-800" />
    </div>
  )
}

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ home?: string }>;
}) {
  const params = await searchParams;
  if (!params.home) {
    const session = await auth0.getSession();
    if (session?.user) redirect("/wardrobe");
  }

  return (
    <div className="relative min-h-svh flex flex-col">
      <div className="pointer-events-none fixed inset-0 z-0">
        <Grainient
          color1="#F9D1D1"
          color2="#FDE8C8"
          color3="#DDD6FE"
          grainAmount={0.12}
          timeSpeed={0.3}
          warpStrength={0.8}
          warpFrequency={2.0}
          warpSpeed={1.5}
          warpAmplitude={30.0}
          blendSoftness={0.3}
          contrast={1.1}
          saturation={0.9}
          rotationAmount={200.0}
          noiseScale={1.5}
          className="h-full w-full"
        />
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
