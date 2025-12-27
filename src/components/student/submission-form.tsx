"use client";

import { useState, useRef } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Upload,
  Loader2,
  FileText,
  Link as LinkIcon,
  Trash2,
  Plus,
  Send,
  Download,
} from "lucide-react";
import { createSubmission, updateSubmission } from "@/lib/actions/submission.actions";
import { toast } from "sonner";

interface ExistingFile {
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
  files: ExistingFile[];
  links: SubmissionLink[];
  status: string;
}

interface LocalFile {
  file: File;
  name: string;
  type: string;
  size: number;
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
  submission: existingSubmission,
  allowedFileTypes = ["pdf", "docx", "ppt", "zip"],
  maxFileSize = 30 * 1024 * 1024,
  isResubmit = false,
}: SubmissionFormProps) {
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>(
    existingSubmission?.files || []
  );
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [links, setLinks] = useState<SubmissionLink[]>(
    existingSubmission?.links || []
  );
  const [submitting, setSubmitting] = useState(false);
  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [submitConfirmOpen, setSubmitConfirmOpen] = useState(false);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const ext = file.name.split(".").pop()?.toLowerCase();
    if (!ext || !allowedFileTypes.includes(ext)) {
      toast.error(
        `File type not allowed. Allowed: ${allowedFileTypes.join(", ").toUpperCase()}`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > maxFileSize) {
      toast.error(
        `File too large. Max size: ${Math.round(maxFileSize / (1024 * 1024))}MB`
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const isDuplicate = localFiles.some((f) => f.name === file.name) ||
      existingFiles.some((f) => f.name === file.name);
    if (isDuplicate) {
      toast.error("A file with this name already exists");
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    setLocalFiles([
      ...localFiles,
      { file, name: file.name, type: ext, size: file.size },
    ]);
    toast.success("File added");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLocalFile = (index: number) => {
    setLocalFiles(localFiles.filter((_, i) => i !== index));
  };

  const handleAddLink = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const link = {
      title: formData.get("title") as string,
      url: formData.get("url") as string,
    };

    if (links.some((l) => l.url === link.url)) {
      toast.error("This link already exists");
      return;
    }

    setLinks([...links, link]);
    setLinkDialogOpen(false);
    toast.success("Link added");
  };

  const handleRemoveLink = (linkUrl: string) => {
    setLinks(links.filter((l) => l.url !== linkUrl));
  };

  const handleSubmitClick = () => {
    const totalFiles = localFiles.length + existingFiles.length;
    if (totalFiles === 0 && links.length === 0) {
      toast.error("Please add at least one file or link");
      return;
    }
    setSubmitConfirmOpen(true);
  };

  const handleSubmitConfirm = async () => {
    setSubmitConfirmOpen(false);
    setSubmitting(true);

    try {
      const uploadedFiles: ExistingFile[] = [];
      
      for (const localFile of localFiles) {
        const formData = new FormData();
        formData.append("file", localFile.file);
        formData.append("folder", `learnops/submissions/${alaId}/${studentId}`);

        const uploadRes = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        const uploadData = await uploadRes.json();

        if (!uploadRes.ok) {
          throw new Error(uploadData.error || `Failed to upload ${localFile.name}`);
        }

        uploadedFiles.push({
          name: localFile.name,
          url: uploadData.url,
          type: localFile.type,
          size: localFile.size,
        });
      }

      const allFiles = [...existingFiles, ...uploadedFiles];

      let result;
      if (existingSubmission?._id) {
        result = await updateSubmission(existingSubmission._id, {
          files: allFiles,
          links,
          filesToDelete,
        });
      } else {
        result = await createSubmission(alaId, {
          files: allFiles,
          links,
        });
      }

      if (result.success) {
        toast.success(isResubmit ? "Submission updated!" : "Submission successful!");
        setLocalFiles([]);
        setExistingFiles(allFiles);
        setFilesToDelete([]);
        router.refresh();
      } else {
        toast.error(result.error || "Failed to submit");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  };

  const handleClearConfirm = () => {
    setClearConfirmOpen(false);
    setFilesToDelete([...filesToDelete, ...existingFiles.map((f) => f.url)]);
    setExistingFiles([]);
    setLocalFiles([]);
    setLinks([]);
    toast.success("Cleared all files and links");
  };

  const acceptTypes = allowedFileTypes.map((t) => `.${t}`).join(",");
  const hasContent = localFiles.length > 0 || existingFiles.length > 0 || links.length > 0;

  return (
    <>
      <Card className={isResubmit ? "border-blue-200" : ""}>
        <CardHeader>
          <CardTitle>
            {isResubmit ? "Modify Submission" : "Your Submission"}
          </CardTitle>
          <CardDescription>
            {isResubmit
              ? "Update your submission before the deadline"
              : "Add files and links, then click Submit"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Files</Label>
              <input
                ref={fileInputRef}
                type="file"
                accept={acceptTypes}
                onChange={handleFileSelect}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={submitting}
              >
                <Plus className="mr-2 h-4 w-4" />
                Add File
              </Button>
            </div>

            {existingFiles.length > 0 && (
              <div className="space-y-2">
                {existingFiles.map((file, index) => (
                  <a
                    key={`existing-${index}`}
                    href={file.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:bg-muted flex items-center justify-between rounded-lg border p-3 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {(file.size / 1024).toFixed(1)} KB • Uploaded
                        </p>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-blue-600" />
                  </a>
                ))}
              </div>
            )}

            {localFiles.length > 0 && (
              <div className="space-y-2">
                {localFiles.map((file, index) => (
                  <div
                    key={`local-${index}`}
                    className="flex items-center justify-between rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Upload className="h-4 w-4 text-blue-500" />
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-xs text-blue-600">
                          {(file.size / 1024).toFixed(1)} KB • Ready to upload
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLocalFile(index)}
                      disabled={submitting}
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {existingFiles.length === 0 && localFiles.length === 0 && (
              <p className="text-muted-foreground text-sm">No files added yet</p>
            )}

            <p className="text-muted-foreground text-xs">
              Allowed: {allowedFileTypes.join(", ").toUpperCase()} (max{" "}
              {Math.round(maxFileSize / (1024 * 1024))}MB)
            </p>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Links</Label>
              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button type="button" variant="outline" size="sm" disabled={submitting}>
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

            {links.length > 0 ? (
              <div className="space-y-2">
                {links.map((link, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="flex items-center gap-3">
                      <LinkIcon className="text-muted-foreground h-4 w-4" />
                      <div>
                        <p className="text-sm font-medium">{link.title}</p>
                        <p className="text-xs text-blue-600 truncate max-w-[250px]">
                          {link.url}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLink(link.url)}
                      disabled={submitting}
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

          <div className="flex gap-2">
            {isResubmit && hasContent && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setClearConfirmOpen(true)}
                disabled={submitting}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
            )}
            <Button
              onClick={handleSubmitClick}
              disabled={submitting || !hasContent}
              className="flex-1"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  {localFiles.length > 0 ? "Uploading & Submitting..." : "Submitting..."}
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

      <ConfirmDialog
        open={submitConfirmOpen}
        onOpenChange={setSubmitConfirmOpen}
        title={isResubmit ? "Update Submission" : "Submit Assignment"}
        description={
          isResubmit
            ? "Are you sure you want to update your submission? Your previous submission will be replaced."
            : "Are you sure you want to submit? Make sure you have added all required files and links."
        }
        confirmText={isResubmit ? "Update" : "Submit"}
        onConfirm={handleSubmitConfirm}
      />

      <ConfirmDialog
        open={clearConfirmOpen}
        onOpenChange={setClearConfirmOpen}
        title="Clear All"
        description="This will remove all files and links. Are you sure?"
        confirmText="Clear All"
        variant="destructive"
        onConfirm={handleClearConfirm}
      />
    </>
  );
}
