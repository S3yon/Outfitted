import sharp from "sharp";
import { boxArea, padBox, toPixels, type Box } from "./geometry.ts";

const PAD = 0.04;
const MAX_EDGE = 512;

// Cut one detected garment out of the photo: pad the box, crop, cap the long edge at 512 px.
// `area` is the padded box's share of the photo, used to pick a group's cover.
export async function cropDetection(image: Buffer, bbox: Box): Promise<{ crop: string; area: number }> {
  const padded = padBox(bbox, PAD);
  const meta = await sharp(image).rotate().metadata();
  // rotate() applies EXIF orientation, so swap sides when the photo is stored on its side.
  const sideways = (meta.orientation ?? 1) >= 5;
  const width = (sideways ? meta.height : meta.width) ?? 1;
  const height = (sideways ? meta.width : meta.height) ?? 1;

  const jpeg = await sharp(image)
    .rotate()
    .extract(toPixels(padded, width, height))
    .resize(MAX_EDGE, MAX_EDGE, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();

  return { crop: `data:image/jpeg;base64,${jpeg.toString("base64")}`, area: boxArea(padded) };
}
