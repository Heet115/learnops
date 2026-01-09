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
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  Loader2,
  FileText,
  Link as LinkIcon,
  Trash2,
  Plus,
  Send,
  Download,
  File,
  ExternalLink,
  Crown,
  Users,
  Clock,
  AlertTriangle,
} from "lucide-react";
import {
  createSubmission,
  updateSubmission,
} from "@/lib/actions/submission.actions";
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
  isGroupSubmission?: boolean;
  isGroupLeader?: boolean;
  hasGroup?: boolean;
  isLateSubmission?: boolean;
  latePenaltyPercent?: number;
}

export function SubmissionForm({
  alaId,
  studentId,
  submission: existingSubmission,
  allowedFileTypes = ["pdf", "docx", "ppt", "zip"],
  maxFileSize = 30 * 1024 * 1024,
  isResubmit = false,
  isGroupSubmission = false,
  isGroupLeader = true,
  hasGroup = false,
  isLateSubmission = false,
  latePenaltyPercent = 0,
}: SubmissionFormProps) {
  const [localFiles, setLocalFiles] = useState<LocalFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>(
    existingSubmission?.files || [],
  );
  const [filesToDelete, setFilesToDelete] = useState<string[]>([]);
  const [links, setLinks] = useState<SubmissionLink[]>(
    existingSubmission?.links || [],
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
        `File type not allowed. Allowed: ${allowedFileTypes.join(", ").toUpperCase()}`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    if (file.size > maxFileSize) {
      toast.error(
        `File too large. Max size: ${Math.round(maxFileSize / (1024 * 1024))}MB`,
      );
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }

    const isDuplicate =
      localFiles.some((f) => f.name === file.name) ||
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
          throw new Error(
            uploadData.error || `Failed to upload ${localFile.name}`,
          );
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
        toast.success(
          isResubmit ? "Submission updated!" : "Submission successful!",
        );
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
  const hasContent =
    localFiles.length > 0 || existingFiles.length > 0 || links.length > 0;

  // For group submissions, check if student can submit/edit
  const canSubmitOrEdit = !isGroupSubmission || isGroupLeader;

  // Show message if student is in a group but not the leader
  if (isGroupSubmission && hasGroup && !isGroupLeader) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <Users className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle>Group Submission</CardTitle>
              <CardDescription>
                Only the group leader can submit
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-amber-200 bg-amber-500/10 p-4">
            <div className="flex items-start gap-3">
              <Crown className="mt-0.5 h-5 w-5 text-amber-600" />
              <div>
                <p className="font-medium text-amber-700">
                  Leader-Only Submission
                </p>
                <p className="mt-1 text-sm text-amber-600">
                  Only the group leader can submit and edit the group&apos;s
                  work. Contact your group leader to make changes or become the
                  leader if no one is assigned.
                </p>
              </div>
            </div>
          </div>
          {existingSubmission && (
            <div className="mt-4 space-y-3">
              <p className="text-sm font-medium">Current Submission</p>
              {existingSubmission.files?.length > 0 && (
                <div className="space-y-2">
                  {existingSubmission.files.map((file, i) => (
                    <a
                      key={i}
                      href={file.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border bg-emerald-500/5 p-3 transition-colors hover:bg-emerald-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                          <File className="h-4 w-4 text-emerald-600" />
                        </div>
                        <span className="text-sm">{file.name}</span>
                      </div>
                      <Download className="h-4 w-4 text-emerald-600" />
                    </a>
                  ))}
                </div>
              )}
              {existingSubmission.links?.length > 0 && (
                <div className="space-y-2">
                  {existingSubmission.links.map((link, i) => (
                    <a
                      key={i}
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between rounded-lg border bg-blue-500/5 p-3 transition-colors hover:bg-blue-500/10"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                          <LinkIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <span className="text-sm">{link.title}</span>
                      </div>
                      <ExternalLink className="h-4 w-4 text-blue-600" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // Show message if student needs to join a group first
  if (isGroupSubmission && !hasGroup) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Users className="h-4 w-4 text-violet-600" />
            </div>
            <div>
              <CardTitle>Group Required</CardTitle>
              <CardDescription>
                Join or create a group to submit
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-dashed p-4 text-center">
            <Users className="text-muted-foreground/50 mx-auto h-8 w-8" />
            <p className="text-muted-foreground mt-2 text-sm">
              You need to be in a group to submit this assignment. Create a
              group or wait to be assigned to one.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card
        className={
          isResubmit
            ? "border-blue-200"
            : isLateSubmission
              ? "border-amber-200"
              : ""
        }
      >
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div
              className={`flex h-8 w-8 items-center justify-center rounded-lg ${isLateSubmission ? "bg-amber-500/10" : "bg-blue-500/10"}`}
            >
              {isLateSubmission ? (
                <Clock className="h-4 w-4 text-amber-600" />
              ) : (
                <File className="h-4 w-4 text-blue-600" />
              )}
            </div>
            <div>
              <CardTitle>
                {isLateSubmission
                  ? "Late Submission"
                  : isResubmit
                    ? "Modify Submission"
                    : "Your Submission"}
              </CardTitle>
              <CardDescription>
                {isLateSubmission
                  ? `Submit late with ${latePenaltyPercent}% penalty`
                  : isResubmit
                    ? "Update your submission before the deadline"
                    : "Add files and links, then click Submit"}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6 pt-6">
          {/* Late Submission Warning */}
          {isLateSubmission && latePenaltyPercent > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 text-amber-600" />
                <div>
                  <p className="font-medium text-amber-700">
                    Late Submission Warning
                  </p>
                  <p className="mt-1 text-sm text-amber-600">
                    The deadline has passed. Submitting now will result in a{" "}
                    {latePenaltyPercent}% penalty being applied to your final
                    grade.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Files Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/10">
                  <FileText className="h-3.5 w-3.5 text-violet-600" />
                </div>
                <Label className="font-medium">Files</Label>
              </div>
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
                    className="flex items-center justify-between rounded-lg border bg-emerald-500/5 p-3 transition-colors hover:bg-emerald-500/10"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10">
                        <FileText className="h-4 w-4 text-emerald-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{file.name}</p>
                        <p className="text-muted-foreground text-xs">
                          {(file.size / 1024).toFixed(1)} KB • Uploaded
                        </p>
                      </div>
                    </div>
                    <Download className="h-4 w-4 text-emerald-600" />
                  </a>
                ))}
              </div>
            )}

            {localFiles.length > 0 && (
              <div className="space-y-2">
                {localFiles.map((file, index) => (
                  <div
                    key={`local-${index}`}
                    className="flex items-center justify-between rounded-lg border border-dashed border-blue-300 bg-blue-500/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                        <Upload className="h-4 w-4 text-blue-600" />
                      </div>
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
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            )}

            {existingFiles.length === 0 && localFiles.length === 0 && (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <FileText className="text-muted-foreground/50 mx-auto h-8 w-8" />
                <p className="text-muted-foreground mt-2 text-sm">
                  No files added yet
                </p>
              </div>
            )}

            <p className="text-muted-foreground text-xs">
              Allowed: {allowedFileTypes.join(", ").toUpperCase()} (max{" "}
              {Math.round(maxFileSize / (1024 * 1024))}MB)
            </p>
          </div>

          <Separator />

          {/* Links Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/10">
                  <LinkIcon className="h-3.5 w-3.5 text-amber-600" />
                </div>
                <Label className="font-medium">Links</Label>
              </div>
              <Dialog open={linkDialogOpen} onOpenChange={setLinkDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={submitting}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Link
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleAddLink}>
                    <DialogHeader>
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                          <ExternalLink className="h-5 w-5 text-amber-600" />
                        </div>
                        <div>
                          <DialogTitle>Add Link</DialogTitle>
                          <DialogDescription>
                            Add a link to your work (GitHub, Google Drive, etc.)
                          </DialogDescription>
                        </div>
                      </div>
                    </DialogHeader>
                    <Separator className="my-4" />
                    <div className="grid gap-4 py-2">
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
                    <DialogFooter className="mt-4">
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
                    className="flex items-center justify-between rounded-lg border bg-amber-500/5 p-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-amber-500/10">
                        <LinkIcon className="h-4 w-4 text-amber-600" />
                      </div>
                      <div>
                        <p className="text-sm font-medium">{link.title}</p>
                        <p className="max-w-[250px] truncate text-xs text-amber-600">
                          {link.url}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLink(link.url)}
                      disabled={submitting}
                      className="h-8 w-8 text-rose-500 hover:bg-rose-500/10 hover:text-rose-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-lg border border-dashed p-4 text-center">
                <LinkIcon className="text-muted-foreground/50 mx-auto h-8 w-8" />
                <p className="text-muted-foreground mt-2 text-sm">
                  No links added yet
                </p>
              </div>
            )}
          </div>

          <Separator />

          <div className="flex gap-2">
            {isResubmit && hasContent && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setClearConfirmOpen(true)}
                disabled={submitting}
                className="text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
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
                  {localFiles.length > 0
                    ? "Uploading & Submitting..."
                    : "Submitting..."}
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
