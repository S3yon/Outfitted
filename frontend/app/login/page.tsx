"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@auth0/nextjs-auth0/client";
import { ArrowRight, ArrowLeft } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

const FEATURES = [
  "Photograph your clothes, backgrounds removed for you",
  "Outfits built only from what you own",
  "Try a look on before you wear it",
];

export default function LoginPage() {
  const { user, isLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && user) {
      router.replace("/wardrobe");
    }
  }, [user, isLoading, router]);

  return (
    <div className="grid min-h-svh grid-cols-1 bg-background lg:grid-cols-2">
      <div className="flex flex-col">
        {/* Top bar */}
        <div className="flex h-14 items-center justify-between border-b border-border px-5 sm:px-8">
          <Link
            href="/"
            className="label-caps flex items-center gap-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Back
          </Link>
          <Link href="/" className="font-serif text-2xl leading-none text-foreground">
            Outfitted
          </Link>
          <div className="w-12" />
        </div>

        {/* Content */}
        <div className="flex flex-1 items-center px-5 py-16 sm:px-8">
          <div className="mx-auto w-full max-w-sm">
            <p className="label-caps text-muted-foreground">Sign in</p>
            <h1 className="mt-4 font-serif text-5xl leading-[0.95] tracking-tight text-foreground sm:text-6xl">
              Get <em className="italic">started.</em>
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
              One account for your wardrobe, outfits and try-ons.
            </p>

            {/* eslint-disable-next-line @next/next/no-html-link-for-pages -- auth route handler; must be a full navigation, and <Link> prefetch would hit it */}
            <a
              href="/api/auth/login?returnTo=/wardrobe"
              className="label-caps group mt-10 flex w-full items-center justify-between bg-foreground px-6 py-4 text-background transition-opacity hover:opacity-85"
            >
              Continue
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
            <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
              By continuing you agree to our Terms and Privacy Policy.
            </p>

            <ul className="mt-12 border-t border-border">
              {FEATURES.map((feature, i) => (
                <li
                  key={feature}
                  className="flex items-baseline gap-4 border-b border-border py-4 text-sm text-foreground"
                >
                  <span className="label-caps text-muted-foreground">0{i + 1}</span>
                  {feature}
                </li>
              ))}
            </ul>

            <p className="label-caps mt-8 text-muted-foreground">Built for Hack Canada 2025</p>
          </div>
        </div>
      </div>

      {/* Image panel, large screens only */}
      <div className="relative hidden border-l border-border bg-card lg:block">
        <Image
          src="/hero-outfit.png"
          alt="An outfit put together in Outfitted"
          fill
          priority
          sizes="50vw"
          className="object-contain p-16"
        />
      </div>
    </div>
  );
}
