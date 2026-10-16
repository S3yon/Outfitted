import { test } from "node:test";
import assert from "node:assert/strict";
import { exifDate } from "./exif-date.ts";

// Build a minimal JPEG: SOI, APP1 Exif (TIFF, IFD0 with an ExifIFD pointer, Exif IFD with
// DateTimeOriginal), then EOI.
function jpegWithDate(date: string, little = true): Uint8Array {
  const tiff: number[] = [];
  const u16 = (v: number) => (little ? [v & 255, v >> 8] : [v >> 8, v & 255]);
  const u32 = (v: number) =>
    little ? [v & 255, (v >> 8) & 255, (v >> 16) & 255, v >>> 24] : [v >>> 24, (v >> 16) & 255, (v >> 8) & 255, v & 255];
  tiff.push(...(little ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8));
  // IFD0 at 8: one entry, ExifIFD pointer (0x8769, LONG) to offset 26.
  tiff.push(...u16(1), ...u16(0x8769), ...u16(4), ...u32(1), ...u32(26), ...u32(0));
  // Exif IFD at 26: one entry, DateTimeOriginal (0x9003, ASCII, 20) at offset 44.
  tiff.push(...u16(1), ...u16(0x9003), ...u16(2), ...u32(20), ...u32(44), ...u32(0));
  tiff.push(...[...date].map((c) => c.charCodeAt(0)), 0);
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const len = app1.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255, ...app1, 0xff, 0xd9]);
}

test("reads DateTimeOriginal as YYYY-MM-DD (little endian)", () => {
  assert.equal(exifDate(jpegWithDate("2026:09:14 18:22:05")), "2026-09-14");
});

test("reads DateTimeOriginal (big endian)", () => {
  assert.equal(exifDate(jpegWithDate("2025:12:31 23:59:59", false)), "2025-12-31");
});

test("skips other segments before APP1", () => {
  const plain = jpegWithDate("2026:01:02 03:04:05");
  const app0 = [0xff, 0xe0, 0, 4, 1, 2];
  const bytes = new Uint8Array([0xff, 0xd8, ...app0, ...plain.slice(2)]);
  assert.equal(exifDate(bytes), "2026-01-02");
});

test("null for non-JPEG, no EXIF, or a zeroed date", () => {
  assert.equal(exifDate(new Uint8Array([0x89, 0x50, 0x4e, 0x47])), null);
  assert.equal(exifDate(new Uint8Array([0xff, 0xd8, 0xff, 0xd9])), null);
  assert.equal(exifDate(jpegWithDate("0000:00:00 00:00:00")), null);
});

test("null on truncated bytes instead of throwing", () => {
  assert.equal(exifDate(jpegWithDate("2026:09:14 18:22:05").slice(0, 30)), null);
});
