import { lookup } from "node:dns/promises";
import { isIP } from "node:net";
import { isPublicAddress, parseSafeUrl } from "./safe-url.ts";

export class BlockedUrlError extends Error {
  constructor() {
    super("That link can't be opened");
  }
}

export type SafeResponse = { status: number; url: string; contentType: string; body: Buffer };

async function checkHost(url: URL) {
  const host = url.hostname.replace(/^\[|\]$/g, "");
  const addresses = isIP(host) ? [{ address: host }] : await lookup(host, { all: true });
  if (!addresses.length || addresses.some((a) => !isPublicAddress(a.address))) throw new BlockedUrlError();
}

// GET a user-supplied link: public hosts only (checked again on every redirect), at most
// 3 redirects, `maxBytes` of body and `timeoutMs` in total. Bigger bodies are cut, not failed.
export async function safeFetch(
  input: string,
  { maxBytes, timeoutMs = 10_000, headers = {} }: { maxBytes: number; timeoutMs?: number; headers?: Record<string, string> },
): Promise<SafeResponse> {
  const signal = AbortSignal.timeout(timeoutMs);
  let current = input;
  for (let hop = 0; hop <= 3; hop++) {
    const url = parseSafeUrl(current);
    if (!url) throw new BlockedUrlError();
    await checkHost(url);
    const res = await fetch(url, { headers, redirect: "manual", signal });
    const location = res.headers.get("location");
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, url).href;
      continue;
    }
    const chunks: Buffer[] = [];
    let size = 0;
    if (res.body) {
      const reader = res.body.getReader();
      while (size < maxBytes) {
        const { value, done } = await reader.read();
        if (done) break;
        chunks.push(Buffer.from(value));
        size += value.byteLength;
      }
      await reader.cancel().catch(() => {});
    }
    return {
      status: res.status,
      url: url.href,
      contentType: res.headers.get("content-type") ?? "",
      body: Buffer.concat(chunks).subarray(0, maxBytes),
    };
  }
  throw new BlockedUrlError();
}
