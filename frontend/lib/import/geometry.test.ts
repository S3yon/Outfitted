import { test } from "node:test";
import assert from "node:assert/strict";
import { clampBox, padBox, toPixels } from "./geometry.ts";

test("clampBox keeps a valid box", () => {
  assert.deepEqual(clampBox({ x1: 0.1, y1: 0.2, x2: 0.5, y2: 0.9 }), { x1: 0.1, y1: 0.2, x2: 0.5, y2: 0.9 });
});

test("clampBox clamps to the image and swaps reversed corners", () => {
  assert.deepEqual(clampBox({ x1: 1.2, y1: 0.9, x2: -0.1, y2: 0.1 }), { x1: 0, y1: 0.1, x2: 1, y2: 0.9 });
});

test("clampBox drops tiny or non-numeric boxes", () => {
  assert.equal(clampBox({ x1: 0.5, y1: 0.5, x2: 0.52, y2: 0.52 }), null);
  assert.equal(clampBox({ x1: "a", y1: 0, x2: 1, y2: 1 } as never), null);
  assert.equal(clampBox(undefined as never), null);
});

test("padBox grows each side by a share of the box size, inside the image", () => {
  const b = padBox({ x1: 0.2, y1: 0.2, x2: 0.6, y2: 0.4 }, 0.1);
  assert.ok(Math.abs(b.x1 - 0.16) < 1e-9 && Math.abs(b.x2 - 0.64) < 1e-9);
  assert.ok(Math.abs(b.y1 - 0.18) < 1e-9 && Math.abs(b.y2 - 0.42) < 1e-9);
  assert.deepEqual(padBox({ x1: 0, y1: 0, x2: 1, y2: 1 }, 0.1), { x1: 0, y1: 0, x2: 1, y2: 1 });
});

test("toPixels converts to whole pixels inside the image", () => {
  assert.deepEqual(toPixels({ x1: 0.1, y1: 0.25, x2: 0.55, y2: 1 }, 1000, 800), { left: 100, top: 200, width: 450, height: 600 });
  const p = toPixels({ x1: 0.999, y1: 0.999, x2: 1, y2: 1 }, 10, 10);
  assert.ok(p.width >= 1 && p.height >= 1 && p.left + p.width <= 10 && p.top + p.height <= 10);
});
