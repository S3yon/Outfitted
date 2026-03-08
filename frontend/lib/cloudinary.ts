import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;

// Category-specific crop transformations for consistent card sizes
export const CATEGORY_TRANSFORMS: Record<string, object> = {
  tops:      { width: 800, height: 1000, crop: "pad", background: "transparent" },
  bottoms:   { width: 800, height: 1000, crop: "pad", background: "transparent" },
  outerwear: { width: 800, height: 1000, crop: "pad", background: "transparent" },
  shoes:     { width: 800, height: 800,  crop: "pad", background: "transparent" },
  accessories: { width: 800, height: 800, crop: "pad", background: "transparent" },
};

// Upload an image buffer to Cloudinary, attempting background removal.
// Falls back to the plain uploaded URL if background removal fails.
export async function uploadWithBgRemoval(
  buffer: Buffer,
  category: string
): Promise<{ url: string; publicId: string }> {
  const transform = CATEGORY_TRANSFORMS[category] ?? CATEGORY_TRANSFORMS.tops;

  return new Promise((resolve, reject) => {
    cloudinary.uploader
      .upload_stream(
        {
          folder: "outfitted",
          resource_type: "image",
          format: "png",
          transformation: [transform],
          background_removal: "cloudinary_ai",
        },
        (error, result) => {
          if (error || !result) {
            // Background removal failed — try a plain upload as fallback
            cloudinary.uploader.upload_stream(
              {
                folder: "outfitted",
                resource_type: "image",
                format: "png",
                transformation: [transform],
              },
              (fallbackError, fallbackResult) => {
                if (fallbackError || !fallbackResult) {
                  reject(fallbackError ?? new Error("Upload failed"));
                } else {
                  resolve({
                    url: fallbackResult.secure_url,
                    publicId: fallbackResult.public_id,
                  });
                }
              }
            ).end(buffer);
          } else {
            resolve({
              url: result.secure_url,
              publicId: result.public_id,
            });
          }
        }
      )
      .end(buffer);
  });
}
