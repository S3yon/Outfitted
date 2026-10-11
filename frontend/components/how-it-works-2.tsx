import { ArrowRight } from "lucide-react";

const steps = [
  {
    number: "01",
    title: "Upload your clothes",
    items: ["Snap a photo from your phone", "The background is removed", "A clean cutout lands in your closet"],
  },
  {
    number: "02",
    title: "Set your style profile",
    items: ["Pick your vibe and fit", "Choose your go-to colours", "Tell us your occasions", "Add style influences"],
  },
  {
    number: "03",
    title: "Get outfits",
    items: ["Built only from items you own", "Matched to your profile", "A new pick every day"],
  },
];

export function HowItWorks2() {
  return (
    <section className="w-full border-b border-border" aria-label="How it works">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="flex items-end justify-between gap-6 px-5 py-10 sm:px-8 lg:py-14">
          <h2 className="font-serif text-5xl leading-none sm:text-6xl">How it works</h2>
          <p className="label-caps hidden text-muted-foreground sm:block">Three steps</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3">
          {steps.map((step, i) => (
            <article
              key={step.number}
              className="flex flex-col"
            >
              <div className="px-5 pb-8 pt-8 sm:px-8">
                <span className="font-serif text-7xl leading-none text-muted-foreground">{step.number}</span>
                <h3 className="mt-6 font-serif text-3xl leading-tight">{step.title}</h3>
              </div>
              <ul className="space-y-2 px-5 pb-10 sm:px-8">
                {step.items.map((item) => (
                  <li key={item} className="text-sm text-muted-foreground">
                    {item}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>

        <a
          href="/login"
          className="label-caps group mx-5 mb-12 inline-flex items-center gap-3 text-foreground underline-offset-4 hover:underline sm:mx-8"
        >
          Upload your first item
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </section>
  );
}
