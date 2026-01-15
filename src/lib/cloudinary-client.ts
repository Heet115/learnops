// Client-safe Cloudinary utilities (no server-only imports)

export const CLOUDINARY_FOLDERS = {
  SUBMISSIONS: (alaId: string) => `learnops/submissions/${alaId}`,
  ALA_RESOURCES: (alaId: string) => `learnops/ala-resources/${alaId}`,
  PROFILES: "learnops/profiles",
};

export const ALLOWED_RESOURCE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export const MAX_RESOURCE_SIZE = 10 * 1024 * 1024; // 10MB

export function validateFile(
  file: File,
  allowedTypes: string[],
  maxSize: number
): { valid: boolean; error?: string } {
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX`,
    };
  }

  if (file.size > maxSize) {
    const maxMB = Math.round(maxSize / (1024 * 1024));
    return {
      valid: false,
      error: `File too large. Maximum size: ${maxMB}MB`,
    };
  }

  return { valid: true };
}

interface UploadOptions {
  file: File;
  folder: string;
}

interface UploadResult {
  success: boolean;
  url?: string;
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
      return { success: false, error: data.error || "Upload failed" };
    }

    return { success: true, url: data.url };
  } catch (error) {
    console.error("Upload error:", error);
    return { success: false, error: "Failed to upload file" };
  }
}
