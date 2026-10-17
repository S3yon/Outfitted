import { isIP } from "node:net";

// Server-side fetches of links users paste: only public web addresses, so a link can't reach
// the server's own network (localhost, the cloud metadata address, private ranges).

function v4Public(ip: string): boolean {
  const [a, b] = ip.split(".").map(Number);
  if (a === 0 || a === 10 || a === 127 || a >= 224) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  return true;
}

export function isPublicAddress(ip: string): boolean {
  const kind = isIP(ip);
  if (kind === 4) return v4Public(ip);
  if (kind !== 6) return false;
  const lower = ip.toLowerCase();
  const mapped = lower.match(/^::ffff:(.+)$/)?.[1];
  if (mapped) {
    if (isIP(mapped) === 4) return v4Public(mapped);
    const [hi, lo] = mapped.split(":").map((h) => parseInt(h, 16));
    return v4Public([hi >> 8, hi & 255, lo >> 8, lo & 255].join("."));
  }
  if (lower === "::" || lower === "::1") return false;
  if (/^f[cd]/.test(lower)) return false; // fc00::/7 unique local
  if (/^fe[89ab]/.test(lower)) return false; // fe80::/10 link-local
  return true;
}

export function parseSafeUrl(input: string): URL | null {
  let url: URL;
  try {
    url = new URL(input.trim());
  } catch {
    return null;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return null;
  if (url.username || url.password) return null;
  if (url.port && url.port !== "80" && url.port !== "443") return null;
  const host = url.hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (host === "localhost" || /\.(local|localhost|internal)$/.test(host) || !host.includes(".") && !isIP(host)) {
    return null;
  }
  if (isIP(host) && !isPublicAddress(host)) return null;
  return url;
}
