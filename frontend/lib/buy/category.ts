const CATEGORY_KEYWORDS: Record<string, string[]> = {
  shoes: ["shoe", "sneaker", "boot", "sandal", "loafer", "heel", "slipper", "mule", "clog", "trainer"],
  tops: ["shirt", "tee", "top", "blouse", "hoodie", "sweater", "pullover", "polo", "tank", "jersey", "knit", "cardigan", "vest"],
  bottoms: ["pant", "jean", "trouser", "short", "skirt", "legging", "jogger", "cargo", "chino", "denim"],
  outerwear: ["jacket", "coat", "blazer", "parka", "bomber", "windbreaker", "puffer", "overcoat", "trench", "anorak"],
  accessories: ["bag", "hat", "cap", "scarf", "belt", "wallet", "sunglasses", "glasses", "watch", "ring", "necklace", "bracelet", "earring", "chain", "pendant", "beanie", "glove"],
};

export const CATEGORIES = ["tops", "bottoms", "shoes", "outerwear", "accessories"] as const;

// Product title → closet category, by keyword. Anything unknown is an accessory.
export function inferCategory(title: string): string {
  const lower = title.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some((kw) => lower.includes(kw))) return category;
  }
  return "accessories";
}
