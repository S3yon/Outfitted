// The day a JPEG was taken, from EXIF DateTimeOriginal (or DateTime), as YYYY-MM-DD. Reads the
// original bytes, since downscaling through a canvas drops EXIF. Null when there is none.
const EXIF_IFD = 0x8769;
const DATE_TIME_ORIGINAL = 0x9003;
const DATE_TIME = 0x0132;

export function exifDate(bytes: Uint8Array): string | null {
  try {
    return read(new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength));
  } catch {
    return null; // truncated or malformed: out-of-range reads throw
  }
}

function read(view: DataView): string | null {
  if (view.getUint16(0) !== 0xffd8) return null;
  let offset = 2;
  while (offset + 4 <= view.byteLength) {
    const marker = view.getUint16(offset);
    if ((marker & 0xff00) !== 0xff00 || marker === 0xffda || marker === 0xffd9) return null;
    const length = view.getUint16(offset + 2);
    // "Exif\0\0"
    if (marker === 0xffe1 && view.getUint32(offset + 4) === 0x45786966 && view.getUint16(offset + 8) === 0) {
      return fromTiff(view, offset + 10);
    }
    offset += 2 + length;
  }
  return null;
}

function fromTiff(view: DataView, start: number): string | null {
  const little = view.getUint16(start) === 0x4949;
  const u16 = (at: number) => view.getUint16(start + at, little);
  const u32 = (at: number) => view.getUint32(start + at, little);

  // Tag → value offset (relative to the TIFF start) in the IFD at `ifd`.
  const entries = (ifd: number) => {
    const found = new Map<number, number>();
    const count = u16(ifd);
    for (let i = 0; i < count; i++) {
      const at = ifd + 2 + i * 12;
      found.set(u16(at), at + 8);
    }
    return found;
  };

  const ifd0 = entries(u32(4));
  const exifAt = ifd0.get(EXIF_IFD);
  const exif = exifAt === undefined ? new Map<number, number>() : entries(u32(exifAt));
  const valueAt = exif.get(DATE_TIME_ORIGINAL) ?? ifd0.get(DATE_TIME);
  if (valueAt === undefined) return null;

  const at = start + u32(valueAt);
  const text = String.fromCharCode(...new Uint8Array(view.buffer, view.byteOffset + at, 10));
  const match = text.match(/^(\d{4}):(\d{2}):(\d{2})$/);
  if (!match || match[1] === "0000") return null;
  return `${match[1]}-${match[2]}-${match[3]}`;
}
