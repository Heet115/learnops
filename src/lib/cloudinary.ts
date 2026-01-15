import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export { cloudinary };

// Extract public_id from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/upload/");
    if (pathParts.length < 2) return null;

    let publicIdWithExt = pathParts[1];
    // Remove version if present (v1234567890/)
    if (publicIdWithExt.match(/^v\d+\//)) {
      publicIdWithExt = publicIdWithExt.replace(/^v\d+\//, "");
    }

    // Remove file extension
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex > 0) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch {
    return null;
  }
}

export async function deleteFromCloudinary(url: string): Promise<boolean> {
  const publicId = extractPublicIdFromUrl(url);
  if (!publicId) {
    console.warn("Could not extract public_id from URL:", url);
    return false;
  }

  try {
    // Try as raw first (for documents like PDF, DOCX)
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    if (result.result === "ok") return true;

    // Try as image if raw didn't work
    result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "image",
    });

    if (result.result === "ok") return true;

    // Try as auto
    result = await cloudinary.uploader.destroy(publicId);

    return result.result === "ok" || result.result === "not found";
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return false;
  }
}
