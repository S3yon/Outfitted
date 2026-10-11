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
    <div className="flex min-h-svh flex-col bg-background">
      <Navigation7 />
      <Hero1 />
      <div id="how-it-works" className="scroll-mt-14">
        <HowItWorks2 />
      </div>
      <div id="features" className="scroll-mt-14">
        <Features1 />
      </div>
      <Stats4 />
      <div id="faq" className="scroll-mt-14">
        <FAQ1 />
      </div>
      <CTA1 />
      <Footer4 />
    </div>
  )
}
