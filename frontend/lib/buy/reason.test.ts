import { test } from "node:test";
import assert from "node:assert/strict";
import { reasonPrompt, cleanReason } from "./reason.ts";

test("reasonPrompt states the numbers and the verdict, and nothing personal", () => {
  const msgs = reasonPrompt({
    title: "Linen Shirt",
    category: "tops",
    price: "$45",
    verdict: "buy",
    added: 6,
    before: 12,
    missing: [],
    duplicateOf: null,
    costPerWear: "$3",
    fallback: "Unlocks 6 new outfits with what you own.",
  });
  assert.equal(msgs.length, 2);
  assert.match(msgs[1].content, /Linen Shirt/);
  assert.match(msgs[1].content, /Verdict: buy/);
  assert.match(msgs[1].content, /6 new outfits \(12 now\)/);
});

test("cleanReason keeps two short sentences and drops quotes and markdown", () => {
  assert.equal(cleanReason('"**Buy it.** It pairs with 6 outfits. Also great. More text."'), "Buy it. It pairs with 6 outfits.");
  assert.equal(cleanReason("   "), null);
  assert.equal(cleanReason("x".repeat(400)), null);
});
