// Merge detections of the same garment seen across several photos.

export type Detection = {
  id: string;
  photoId: string;
  category: string;
  description: string;
  color: string | null;
  area: number; // share of the photo the crop covers; the biggest crop becomes the cover
  embedding?: number[];
};

export type Group = {
  id: string;
  detectionIds: string[];
  coverId: string;
  category: string;
  description: string;
};

// Starting values, not measured: tune on real photos.
export const EMBEDDING_THRESHOLD = 0.88;
export const TEXT_THRESHOLD = 0.6;

export function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

function words(text: string): Set<string> {
  return new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean));
}

export function textSimilarity(a: string, b: string): number {
  const wa = words(a);
  const wb = words(b);
  if (wa.size === 0 || wb.size === 0) return 0;
  let shared = 0;
  for (const w of wa) if (wb.has(w)) shared++;
  return shared / (wa.size + wb.size - shared);
}

function sameGarment(a: Detection, b: Detection): boolean {
  if (a.category !== b.category) return false;
  if (a.embedding && b.embedding) return cosine(a.embedding, b.embedding) >= EMBEDDING_THRESHOLD;
  return a.color === b.color && textSimilarity(a.description, b.description) >= TEXT_THRESHOLD;
}

function toGroup(members: Detection[]): Group {
  const cover = members.reduce((best, d) => (d.area > best.area ? d : best));
  return {
    id: `g-${members[0].id}`,
    detectionIds: members.map((d) => d.id),
    coverId: cover.id,
    category: cover.category,
    description: cover.description,
  };
}

// Union-find over matching pairs. One person can't wear the same garment twice in one photo, so
// two groups that share a photo are never joined, even through a third detection.
export function groupDetections(detections: Detection[]): Group[] {
  const parent = detections.map((_, i) => i);
  const photos = detections.map((d) => new Set([d.photoId]));
  const find = (i: number): number => (parent[i] === i ? i : (parent[i] = find(parent[i])));

  for (let i = 0; i < detections.length; i++) {
    for (let j = i + 1; j < detections.length; j++) {
      const ri = find(i);
      const rj = find(j);
      if (ri === rj || !sameGarment(detections[i], detections[j])) continue;
      if ([...photos[rj]].some((p) => photos[ri].has(p))) continue;
      const [root, child] = ri < rj ? [ri, rj] : [rj, ri];
      parent[child] = root;
      for (const p of photos[child]) photos[root].add(p);
    }
  }

  const byRoot = new Map<number, Detection[]>();
  detections.forEach((d, i) => {
    const r = find(i);
    byRoot.set(r, [...(byRoot.get(r) ?? []), d]);
  });
  return [...byRoot.values()].map(toGroup);
}

// "Not the same item": take one crop out of its group and give it a group of its own.
export function splitDetection(groups: Group[], detectionId: string, detections: Detection[]): Group[] {
  const byId = new Map(detections.map((d) => [d.id, d]));
  return groups.flatMap((g) => {
    if (!g.detectionIds.includes(detectionId) || g.detectionIds.length === 1) return [g];
    const rest = g.detectionIds.filter((id) => id !== detectionId).map((id) => byId.get(id)!);
    return [toGroup(rest), toGroup([byId.get(detectionId)!])];
  });
}
