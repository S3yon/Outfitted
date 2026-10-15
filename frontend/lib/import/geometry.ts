// Box math for crops. Boxes are normalized (0-1) with x1,y1 top-left and x2,y2 bottom-right.

export type Box = { x1: number; y1: number; x2: number; y2: number };

// Smaller than this share of the photo is noise (a logo, a button), not a garment.
const MIN_AREA = 0.0025;

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

export function clampBox(box: Box | null | undefined): Box | null {
  if (!box || typeof box !== "object") return null;
  const vals = [box.x1, box.y1, box.x2, box.y2];
  if (!vals.every((v) => typeof v === "number" && Number.isFinite(v))) return null;
  const [ax, ay, bx, by] = vals.map(clamp01);
  const out = {
    x1: Math.min(ax, bx),
    y1: Math.min(ay, by),
    x2: Math.max(ax, bx),
    y2: Math.max(ay, by),
  };
  return boxArea(out) < MIN_AREA ? null : out;
}

export function boxArea(box: Box): number {
  return (box.x2 - box.x1) * (box.y2 - box.y1);
}

// Grow each side by `pad` times the box's width or height, so crops don't clip sleeves or soles.
export function padBox(box: Box, pad: number): Box {
  const dx = (box.x2 - box.x1) * pad;
  const dy = (box.y2 - box.y1) * pad;
  return {
    x1: clamp01(box.x1 - dx),
    y1: clamp01(box.y1 - dy),
    x2: clamp01(box.x2 + dx),
    y2: clamp01(box.y2 + dy),
  };
}

export function toPixels(box: Box, width: number, height: number) {
  const left = Math.min(width - 1, Math.floor(box.x1 * width));
  const top = Math.min(height - 1, Math.floor(box.y1 * height));
  const right = Math.max(left + 1, Math.min(width, Math.round(box.x2 * width)));
  const bottom = Math.max(top + 1, Math.min(height, Math.round(box.y2 * height)));
  return { left, top, width: right - left, height: bottom - top };
}
