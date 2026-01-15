import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { cloudinary, extractPublicIdFromUrl } from "@/lib/cloudinary";

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
      return NextResponse.json(
        { error: "Invalid Cloudinary URL" },
        { status: 400 },
      );
    }

    console.log("Deleting from Cloudinary:", publicId);

    // Try deleting as raw first (for documents), then as image
    let result = await cloudinary.uploader.destroy(publicId, {
      resource_type: "raw",
    });

    if (result.result !== "ok" && result.result !== "not found") {
      // Try as image
      result = await cloudinary.uploader.destroy(publicId, {
        resource_type: "image",
      });
    }

    if (result.result === "ok" || result.result === "not found") {
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: result.result }, { status: 500 });
  } catch (error) {
    console.error("Delete error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Delete failed" },
      { status: 500 },
    );
  }
}
