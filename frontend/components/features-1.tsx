const features = [
  { title: "Photo upload", description: "From your phone camera or your camera roll." },
  { title: "Background removal", description: "Every item becomes a clean cutout." },
  { title: "Digital closet", description: "All your items in one browsable grid." },
  { title: "Outfit generation", description: "Combinations built from what you own." },
  { title: "Colour matching", description: "Outfits that respect your palette." },
  { title: "Style profile", description: "A short quiz sets your vibe and fit." },
  { title: "Category filters", description: "Tops, bottoms, shoes, outerwear, accessories." },
  { title: "Virtual try-on", description: "See an outfit on you before you wear it." },
];

export function Features1() {
  return (
    <section className="w-full border-b border-border">
      <div className="mx-auto w-full max-w-[1200px]">
        <div className="grid grid-cols-1 gap-6 px-5 py-10 sm:px-8 lg:grid-cols-[1fr_1fr] lg:py-14">
          <h2 className="font-serif text-5xl leading-none sm:text-6xl">Everything your closet needs</h2>
          <p className="max-w-md self-end text-base leading-relaxed text-muted-foreground lg:justify-self-end">
            Upload your real clothes, get clean cutouts, and let the stylist build outfits
            from what you already own.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-x-8 gap-y-10 px-5 pb-14 sm:px-8 lg:grid-cols-4">
          {features.map((feature) => (
            <div key={feature.title}>
              <h3 className="font-serif text-2xl leading-tight">{feature.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
