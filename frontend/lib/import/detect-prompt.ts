// Prompt for the camera-roll importer: every garment the main person wears, not just one.
export const DETECT_PROMPT = `This is a photo of a person wearing an outfit (often a mirror selfie or a camera-roll shot).

List every clothing item and accessory worn by the main person in the photo. Ignore other people, clothes lying around or hanging in the background, the phone in their hand, and anything not worn.

If there is no person wearing clothes, return { "items": [] }.

For each item give:
- "category": one of "tops", "bottoms", "shoes", "outerwear", "accessories"
- "description": a short description a person would use to find it in their closet (e.g. "white oversized t-shirt", "black leather chelsea boots")
- "color": the main colour in one or two plain words (e.g. "black", "light blue")
- "bbox": bounding box of the visible part of the item as normalized coordinates (0.0-1.0): { "x1": left, "y1": top, "x2": right, "y2": bottom }

Category rules:
- tops: t-shirts, shirts, blouses, tank tops, polos, sweaters, hoodies without a zipper
- bottoms: pants, jeans, shorts, skirts, trousers, joggers
- shoes: sneakers, boots, sandals, heels, loafers, slides (one item for the pair)
- outerwear: jackets, coats, blazers, zip-up hoodies, vests, parkas
- accessories: hats, bags, belts, jewelry, watches, sunglasses, scarves, glasses

List an item only when enough of it is visible to recognise it again in another photo. A layered outfit (jacket over a shirt) is two items.

Respond ONLY with valid JSON, no markdown:
{ "items": [{ "category": "tops", "description": "white t-shirt", "color": "white", "bbox": { "x1": 0.3, "y1": 0.25, "x2": 0.7, "y2": 0.55 } }] }`;
