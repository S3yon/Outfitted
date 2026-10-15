import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSaveInput, EMBEDDING_SIZE } from "./save-input.ts";

const crop = "data:image/jpeg;base64," + Buffer.from("jpeg bytes").toString("base64");
const embedding = Array.from({ length: EMBEDDING_SIZE }, (_, i) => i / EMBEDDING_SIZE);

test("accepts a valid item and decodes the crop", () => {
  const out = parseSaveInput({ crop, category: "tops", description: " black tee ", embedding });
  assert.ok(out.ok);
  assert.equal(out.value.image.toString(), "jpeg bytes");
  assert.equal(out.value.description, "black tee");
  assert.equal(out.value.embedding?.length, EMBEDDING_SIZE);
});

test("embedding is optional", () => {
  const out = parseSaveInput({ crop, category: "shoes", description: "white sneakers" });
  assert.ok(out.ok);
  assert.equal(out.value.embedding, null);
});

test("rejects a bad category, crop or embedding", () => {
  assert.equal(parseSaveInput({ crop, category: "socks", description: "x" }).ok, false);
  assert.equal(parseSaveInput({ crop: "https://example.com/a.jpg", category: "tops", description: "x" }).ok, false);
  assert.equal(parseSaveInput({ crop, category: "tops", description: "x", embedding: [1, 2] }).ok, false);
  assert.equal(parseSaveInput({ crop, category: "tops", description: "x", embedding: [...embedding.slice(1), NaN] }).ok, false);
  assert.equal(parseSaveInput(null).ok, false);
});

test("falls back to the category when the description is empty", () => {
  const out = parseSaveInput({ crop, category: "bottoms", description: "  " });
  assert.ok(out.ok);
  assert.equal(out.value.description, "bottoms");
});
