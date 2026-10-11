import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function CTA1() {
  return (
    <section className="w-full border-b border-border">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 md:grid-cols-[1.4fr_1fr]">
        <div className="flex flex-col justify-between gap-10 px-5 py-14 sm:px-8 lg:py-20">
          <h2 className="font-serif text-6xl leading-[0.95] sm:text-7xl">
            Ready to digitize <em className="italic">your wardrobe?</em>
          </h2>
          <div className="space-y-6">
            <p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
              Upload your clothes, set your style, and get outfits from what you own every
              day. Free to use.
            </p>
            <div className="flex flex-wrap items-center gap-6">
              <a
                href="/login"
                className="label-caps group inline-flex items-center gap-3 bg-foreground px-6 py-4 text-background transition-opacity hover:opacity-85"
              >
                Get started free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <a
                href="/login"
                className="label-caps text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                I have an account
              </a>
            </div>
          </div>
        </div>

        <div className="relative hidden min-h-[420px] bg-card md:block">
          <Image
            src="/hero-outfit.png"
            alt="Tee and pinstripe trousers"
            fill
            sizes="(min-width: 768px) 480px, 0px"
            className="object-contain p-10"
          />
        </div>
      </div>
    </section>
  );
}
