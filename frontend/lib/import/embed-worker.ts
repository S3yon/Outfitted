// Web worker: image embeddings with Marqo FashionSigLIP (int8 ONNX, ~94 MB, cached by the
// browser after the first load). Posts { type: "ready" } or { type: "failed" } once, then
// answers each { id, crop } with { type: "embedding", id, vector } or { type: "error", id }.
import { AutoProcessor, RawImage, SiglipVisionModel } from "@huggingface/transformers";

const MODEL_ID = "Marqo/marqo-fashionSigLIP";

type Request = { id: string; crop: string };

const loading = Promise.all([
  AutoProcessor.from_pretrained(MODEL_ID),
  SiglipVisionModel.from_pretrained(MODEL_ID, { dtype: "int8", device: "wasm" }),
]);

loading.then(
  () => self.postMessage({ type: "ready" }),
  (err) => self.postMessage({ type: "failed", error: String(err) }),
);

// One inference at a time: the wasm session isn't meant to run calls in parallel.
let queue: Promise<unknown> = Promise.resolve();

self.onmessage = (event: MessageEvent<Request>) => {
  const { id, crop } = event.data;
  queue = queue.then(async () => {
    try {
      const [processor, model] = await loading;
      const image = await RawImage.fromURL(crop);
      const { image_embeds } = await model(await processor(image));
      const vector = (image_embeds.normalize().tolist() as number[][])[0];
      self.postMessage({ type: "embedding", id, vector });
    } catch (err) {
      self.postMessage({ type: "error", id, error: String(err) });
    }
  });
};
