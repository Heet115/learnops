"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Upload,
  Loader2,
  FileText,
  Link as LinkIcon,
  Trash2,
  Plus,
  Send,
} from "lucide-react";
import {
  getOrCreateSubmission,
  addFileToSubmission,
  removeFileFromSubmission,
  addLinkToSubmission,
  removeLinkFromSubmission,
  submitSubmission,
  clearAndResubmit,
} from "@/lib/actions/submission.actions";
import { toast } from "sonner";

interface SubmissionFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface SubmissionLink {
  title: string;
  url: string;
}

interface Submission {
  _id: string;
  files: SubmissionFile[];
  links: SubmissionLink[];
  status: string;
}

interface SubmissionFormProps {
  alaId: string;
  studentId: string;
  submission?: Submission | null;
  allowedFileTypes?: string[];
  maxFileSize?: number;
  isResubmit?: boolean;
}

export function SubmissionForm({
  alaId,
  studentId,
  submission: initialSubmission,
  allowedFileTypes = ["pdf", "docx", "ppt", "zip"],
  maxFileSize = 30 * 1024 * 1024,
  isResubmit = false,
}: SubmissionFormProps) {
  const [submission, setSubmission] = useState<Submission | null>(
    initialSubmission || null,
  );
  const [uploading, setUploading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!submission) {
      initSubmission();
    }
  }, []);

  const initSubmission = async () => {
    const result = await getOrCreateSubmission(alaId);
    if (result.success && result.submission) {
      setSubmission(result.submission);
    } else {
      toast.error(result.error || "Failed to initialize submission");
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !submission) return;

    // Validate file type
    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedFileTypes.includes(ext)) {
      toast.error(
        `File type not allowed. Allowed: ${allowedFileTypes.join(", ").toUpperCase()}`,
      );
      return;
    }

    // Validate file size
    if (file.size > maxFileSize) {
      toast.error(
        `File too large. Max size: ${Math.round(maxFileSize / (1024 * 1024))}MB`,
      );
      return;
    }

    setUploading(true);

    try {
      // Upload to Cloudinary via API
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", `learnops/submissions/${alaId}/${studentId}`);

      const uploadRes = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const uploadData = await uploadRes.json();

      if (!uploadRes.ok) {
        throw new Error(uploadData.error || "Upload failed");
      }

      // Add file to submission
      const result = await addFileToSubmission(submission._id, {
        name: file.name,
        url: uploadData.url,
        type: ext,
        size: file.size,
      });

      if (result.success) {
        setSubmission(result.submission);
        toast.success("File uploaded");
      } else {
        toast.error(result.error || "Failed to add file");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Upload failed");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleRemoveFile = async (fileUrl: string) => {
    if (!submission) return;

    const result = await removeFileFromSubmission(submission._id, fileUrl);
    if (result.success) {
      setSubmission(result.submission);
      toast.success("File removed");
    } else {
      toast.error(result.error || "Failed to remove file");
    }
  };

  const handleAddLink = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!submission) return;

    const formData = new FormData(e.currentTarget);
    const link = {
      title: formData.get("title") as string,
      url: formData.get("url") as string,
    };

    const result = await addLinkToSubmission(submission._id, link);
    if (result.success) {
      setSubmission(result.submission);
      setLinkDialogOpen(false);
      toast.success("Link added");
    } else {
      toast.error(result.error || "Failed to add link");
    }
  };

  const handleRemoveLink = async (linkUrl: string) => {
    if (!submission) return;

    const result = await removeLinkFromSubmission(submission._id, linkUrl);
    if (result.success) {
      setSubmission(result.submission);
      toast.success("Link removed");
    } else {
      toast.error(result.error || "Failed to remove link");
    }
  };

  const handleSubmit = async () => {
    if (!submission) return;

    if (submission.files.length === 0 && submission.links.length === 0) {
      toast.error("Please add at least one file or link");
      return;
    }

    const message = isResubmit
      ? "Are you sure you want to resubmit? This will update your previous submission."
      : "Are you sure you want to submit? You can still modify before the deadline.";

    if (!confirm(message)) {
      return;
    }

    setSubmitting(true);
    const result = await submitSubmission(submission._id);

    if (result.success) {
      toast.success(
        isResubmit ? "Resubmission successful!" : "Submission successful!",
      );
      router.refresh();
    } else {
      toast.error(result.error || "Failed to submit");
    }

    setSubmitting(false);
  };

  const handleClearAndResubmit = async () => {
    if (!submission) return;

    if (
      !confirm(
        "This will delete all your current files and links. Are you sure?",
      )
    ) {
      return;
    }

    setClearing(true);
    const result = await clearAndResubmit(submission._id);

    if (result.success) {
      setSubmission(result.submission);
      toast.success("Submission cleared. You can now upload new files.");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to clear submission");
    }

    setClearing(false);
  };

  const acceptTypes = allowedFileTypes.map((t) => `.${t}`).join(",");

  return (
    <Card className={isResubmit ? "border-blue-200" : ""}>
      <CardHeader>
        <CardTitle>
          {isResubmit ? "Modify Submission" : "Your Submission"}
        </CardTitle>
        <CardDescription>
          {isResubmit
            ? "You can modify your submission before the deadline. Changes will update your previous submission."
            : "Upload files or add links to submit your work"}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Files Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Files</Label>
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptTypes}
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload File
                </>
              )}
            </Button>
          </div>

          {submission?.files && submission.files.length > 0 ? (
            <div className="space-y-2">
              {submission.files.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveFile(file.url)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              No files uploaded yet
            </p>
          )}

          <p className="text-muted-foreground text-xs">
            Allowed: {allowedFileTypes.join(", ").toUpperCase()} (max{" "}
            {Math.round(maxFileSize / (1024 * 1024))}MB)
          </p>
        </div>

        {/* Links Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Links</Label>
            <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="outline" size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Link
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddLink}>
                  <DialogHeader>
                    <DialogTitle>Add Link</DialogTitle>
                    <DialogDescription>
                      Add a link to your work (GitHub, Google Drive, etc.)
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        name="title"
                        placeholder="e.g., GitHub Repository"
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="url">URL</Label>
                      <Input
                        id="url"
                        name="url"
                        type="url"
                        placeholder="https://..."
                        required
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setLinkDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button type="submit">Add Link</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          {submission?.links && submission.links.length > 0 ? (
            <div className="space-y-2">
              {submission.links.map((link, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div className="flex items-center gap-3">
                    <LinkIcon className="text-muted-foreground h-4 w-4" />
                    <div>
                      <p className="text-sm font-medium">{link.title}</p>
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block max-w-[250px] truncate text-xs text-blue-600 hover:underline"
                      >
                        {link.url}
                      </a>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveLink(link.url)}
                  >
                    <Trash2 className="text-destructive h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No links added yet</p>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex gap-2">
          {isResubmit && (
            <Button
              type="button"
              variant="outline"
              onClick={handleClearAndResubmit}
              disabled={clearing || submitting}
              className="flex-1"
            >
              {clearing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Clearing...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Clear & Start Fresh
                </>
              )}
            </Button>
          )}
          <Button
            onClick={handleSubmit}
            disabled={
              submitting ||
              clearing ||
              (!submission?.files?.length && !submission?.links?.length)
            }
            className={isResubmit ? "flex-1" : "w-full"}
          >
            {submitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isResubmit ? "Resubmitting..." : "Submitting..."}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {isResubmit ? "Update Submission" : "Submit"}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
