import { auth } from "@clerk/nextjs/server";
import { v2 as cloudinary } from "cloudinary";
import { NextRequest, NextResponse } from "next/server";

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Extract public_id from Cloudinary URL
function extractPublicIdFromUrl(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
    // For raw files: https://res.cloudinary.com/{cloud_name}/raw/upload/v{version}/{folder}/{filename}
    const urlObj = new URL(url);
    const pathParts = urlObj.pathname.split("/upload/");
    if (pathParts.length < 2) return null;
    
    // Get everything after /upload/ and remove version if present
    let publicIdWithExt = pathParts[1];
    if (publicIdWithExt.startsWith("v")) {
      const versionEnd = publicIdWithExt.indexOf("/");
      if (versionEnd > 0) {
        publicIdWithExt = publicIdWithExt.substring(versionEnd + 1);
      }
    }
    
    // Remove file extension for the public_id
    const lastDotIndex = publicIdWithExt.lastIndexOf(".");
    if (lastDotIndex > 0) {
      return publicIdWithExt.substring(0, lastDotIndex);
    }
    return publicIdWithExt;
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  try {
    const { userId, sessionClaims } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const role = (sessionClaims?.metadata as { role?: string })?.role;
    if (role !== "professor" && role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { url } = await request.json();

    if (!url) {
      return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    const publicId = extractPublicIdFromUrl(url);
    
    if (!publicId) {
      console.warn("Could not extract public_id from URL:", url);
      return NextResponse.json({ error: "Invalid Cloudinary URL" }, { status: 400 });
    }

    console.log("Deleting from Cloudinary:", publicId);

    // Try deleting as raw first (for documents), then as image
    let result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });
    
    if (result.result !== "ok" && result.result !== "not found") {
      // Try as image
      result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
    }

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.result }, { status: 500 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 }
    );
  }
}
