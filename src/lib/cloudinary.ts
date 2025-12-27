// Cloudinary folder structure for LearnOps
// learnops/
// ├── alas/{alaId}/resources/     - ALA study materials
// ├── submissions/{alaId}/{odId}/ - Student submissions
// └── profiles/                   - User profile images

export const CLOUDINARY_FOLDERS = {
  ALA_RESOURCES: (alaId: string) => `learnops/alas/${alaId}/resources`,
  SUBMISSIONS: (alaId: string, visitorId: string) => `learnops/submissions/${alaId}/${visitorId}`,
  PROFILES: "learnops/profiles",
} as const;

interface UploadOptions {
  file: File;
  folder: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
  publicId?: string;
  error?: string;
}

export async function uploadToCloudinary({
  file,
  folder,
}: UploadOptions): Promise<UploadResult> {
  try {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    const response = await fetch("/api/upload", {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Upload failed");
    }

    return {
      success: true,
      url: data.url,
      publicId: data.publicId,
    };
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Upload failed",
    };
  }
}

// Extract public_id from Cloudinary URL
export function extractPublicIdFromUrl(url: string): string | null {
  try {
    // URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
    const regex = /\/upload\/(?:v\d+\/)?(.+)\.[^.]+$/;
    const match = url.match(regex);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// File validation helpers
export const ALLOWED_RESOURCE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const ALLOWED_SUBMISSION_TYPES = [
  ...ALLOWED_RESOURCE_TYPES,
  "application/zip",
  "application/x-zip-compressed",
];

export const MAX_RESOURCE_SIZE = 10 * 1024 * 1024; // 10MB
export const MAX_SUBMISSION_SIZE = 30 * 1024 * 1024; // 30MB

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: "File type not allowed" };
  }
  if (file.size > maxSize) {
    return { valid: false, error: `File size must be less than ${maxSize / (1024 * 1024)}MB` };
  }
  return { valid: true };
}
