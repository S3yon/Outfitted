const footerColumns = [
  {
    title: "App",
    links: [
      { text: "Wardrobe", href: "/wardrobe" },
      { text: "Outfits", href: "/outfits" },
      { text: "Market", href: "/market" },
      { text: "Profile", href: "/profile" },
    ],
  },
  {
    title: "Built with",
    links: [
      { text: "Auth0", href: "https://auth0.com" },
      { text: "Cloudinary", href: "https://cloudinary.com" },
      { text: "Google Gemini", href: "https://deepmind.google/technologies/gemini/" },
      { text: "Solana", href: "https://solana.com" },
    ],
  },
];

export default function Footer4() {
  return (
    <footer className="w-full">
      <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 border-b border-border md:grid-cols-[2fr_1fr_1fr]">
        <div className="px-5 py-10 sm:px-8">
          <p className="max-w-sm font-serif text-3xl leading-tight">
            Your closet. Your style. Outfits from what you own.
          </p>
        </div>
        {footerColumns.map((column) => (
          <div
            key={column.title}
            className="px-5 py-10 sm:px-8"
          >
            <h4 className="label-caps mb-5 text-muted-foreground">{column.title}</h4>
            <ul className="space-y-3">
              {column.links.map((link) => (
                <li key={link.text}>
                  <a
                    href={link.href}
                    {...(link.href.startsWith("http") ? { target: "_blank", rel: "noreferrer" } : {})}
                    className="text-sm text-foreground underline-offset-4 hover:underline"
                  >
                    {link.text}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-5 pb-8 pt-6 sm:px-8">
        <p className="font-serif text-[22vw] leading-[0.8] tracking-tight md:text-[13rem]">Outfitted</p>
        <p className="label-caps mt-6 text-muted-foreground">Built for Hack Canada</p>
      </div>
    </footer>
  );
}
