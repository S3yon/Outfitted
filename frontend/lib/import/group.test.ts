import { test } from "node:test";
import assert from "node:assert/strict";
import { cosine, textSimilarity, groupDetections, splitDetection, type Detection } from "./group.ts";

function det(id: string, photoId: string, over: Partial<Detection> = {}): Detection {
  return { id, photoId, category: "tops", description: "black crew neck tee", color: "black", area: 0.2, ...over };
}

test("cosine of vectors", () => {
  assert.equal(cosine([1, 0], [1, 0]), 1);
  assert.equal(cosine([1, 0], [0, 1]), 0);
  assert.ok(Math.abs(cosine([3, 4], [3, 4]) - 1) < 1e-9);
});

test("textSimilarity is word overlap, ignoring case and punctuation", () => {
  assert.equal(textSimilarity("Black crew-neck tee", "black crew neck tee"), 1);
  assert.equal(textSimilarity("white sneakers", "black boots"), 0);
});

test("groups the same garment across photos by embedding", () => {
  const groups = groupDetections([
    det("a", "p1", { embedding: [1, 0, 0] }),
    det("b", "p2", { embedding: [0.99, 0.1, 0] }),
    det("c", "p3", { embedding: [0, 1, 0] }),
  ]);
  assert.deepEqual(groups.map((g) => [...g.detectionIds].sort()), [["a", "b"], ["c"]]);
});

test("never groups across categories", () => {
  const groups = groupDetections([
    det("a", "p1", { embedding: [1, 0] }),
    det("b", "p2", { category: "outerwear", embedding: [1, 0] }),
  ]);
  assert.equal(groups.length, 2);
});

test("never puts two detections from one photo in a group, even through a third", () => {
  const groups = groupDetections([
    det("a", "p1", { embedding: [1, 0] }),
    det("b", "p1", { embedding: [1, 0] }),
    det("c", "p2", { embedding: [1, 0] }),
  ]);
  assert.deepEqual(groups.map((g) => g.detectionIds.length).sort(), [1, 2]);
  for (const g of groups) assert.ok(!(g.detectionIds.includes("a") && g.detectionIds.includes("b")));
});

test("falls back to text and colour when an embedding is missing", () => {
  const groups = groupDetections([
    det("a", "p1"),
    det("b", "p2", { description: "Black crew-neck tee" }),
    det("c", "p3", { color: "white" }),
  ]);
  assert.deepEqual(groups.map((g) => [...g.detectionIds].sort()), [["a", "b"], ["c"]]);
});

test("the cover is the largest crop and groups keep input order", () => {
  const groups = groupDetections([
    det("a", "p1", { area: 0.1, embedding: [1, 0] }),
    det("x", "p1", { category: "shoes", embedding: [0, 1] }),
    det("b", "p2", { area: 0.3, embedding: [1, 0], description: "black tee" }),
  ]);
  assert.equal(groups[0].coverId, "b");
  assert.equal(groups[0].description, "black tee");
  assert.equal(groups[1].coverId, "x");
});

test("splitDetection moves one crop into its own group", () => {
  const dets = [det("a", "p1", { embedding: [1, 0] }), det("b", "p2", { embedding: [1, 0], area: 0.5 })];
  const split = splitDetection(groupDetections(dets), "b", dets);
  assert.deepEqual(split.map((g) => g.detectionIds), [["a"], ["b"]]);
  assert.equal(split[0].coverId, "a");
});
