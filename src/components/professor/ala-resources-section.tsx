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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  Plus,
  FileText,
  Link as LinkIcon,
  Trash2,
  ExternalLink,
  Upload,
  Loader2,
  FolderOpen,
  Type,
  Globe,
} from "lucide-react";
import { addResource, removeResource } from "@/lib/actions/ala.actions";
import {
  uploadToCloudinary,
  CLOUDINARY_FOLDERS,
  ALLOWED_RESOURCE_TYPES,
  MAX_RESOURCE_SIZE,
  validateFile,
} from "@/lib/cloudinary";
import { toast } from "sonner";

interface Resource {
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
}

interface ALAResourcesSectionProps {
  alaId: string;
  resources: Resource[];
}

const RESOURCE_TYPES = [
  { value: "document", label: "Document (Upload File)", icon: FileText },
  { value: "link", label: "Link (URL)", icon: LinkIcon },
];

export function ALAResourcesSection({
  alaId,
  resources,
}: ALAResourcesSectionProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [resourceType, setResourceType] = useState("link");
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [fileName, setFileName] = useState("");
  const [removeConfirm, setRemoveConfirm] = useState<{
    open: boolean;
    url: string;
    name: string;
  }>({
    open: false,
    url: "",
    name: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(
      file,
      ALLOWED_RESOURCE_TYPES,
      MAX_RESOURCE_SIZE,
    );
    if (!validation.valid) {
      toast.error(validation.error);
      return;
    }

    setUploading(true);
    setFileName(file.name);

    const result = await uploadToCloudinary({
      file,
      folder: CLOUDINARY_FOLDERS.ALA_RESOURCES(alaId),
    });

    if (result.success && result.url) {
      setUploadedUrl(result.url);
      toast.success("File uploaded successfully");
    } else {
      toast.error(result.error || "Failed to upload file");
      setFileName("");
    }

    setUploading(false);
  };

  const handleAddResource = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const url =
      resourceType === "document"
        ? uploadedUrl
        : (formData.get("url") as string);

    if (!url) {
      toast.error(
        resourceType === "document"
          ? "Please upload a file first"
          : "Please enter a URL",
      );
      setLoading(false);
      return;
    }

    const data = {
      name: formData.get("name") as string,
      url,
      type: resourceType,
    };

    const result = await addResource(alaId, data);

    if (result.success) {
      toast.success("Resource added");
      setOpen(false);
      resetForm();
      router.refresh();
    } else {
      toast.error(result.error || "Failed to add resource");
    }

    setLoading(false);
  };

  const resetForm = () => {
    setResourceType("link");
    setUploadedUrl("");
    setFileName("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleOpenChange = (isOpen: boolean) => {
    setOpen(isOpen);
    if (!isOpen) resetForm();
  };

  const handleRemoveClick = (url: string, name: string) => {
    setRemoveConfirm({ open: true, url, name });
  };

  const handleRemoveConfirm = async () => {
    const { url } = removeConfirm;
    setRemoveConfirm({ open: false, url: "", name: "" });

    const result = await removeResource(alaId, url);
    if (result.success) {
      toast.success("Resource removed");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove resource");
    }
  };

  return (
    <>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10">
              <FolderOpen className="h-4 w-4 text-amber-600" />
            </div>
            <div>
              <CardTitle>Resources</CardTitle>
              <CardDescription>
                Study materials and references for students
              </CardDescription>
            </div>
          </div>
          <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Resource
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleAddResource}>
                <DialogHeader>
                  <div className="flex items-center gap-2">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                      <Plus className="h-5 w-5 text-amber-600" />
                    </div>
                    <div>
                      <DialogTitle>Add Resource</DialogTitle>
                      <DialogDescription>
                        Upload a document or add a link for students.
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                <Separator className="my-4" />
                <div className="grid gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="type" className="flex items-center gap-2">
                      <FileText className="text-muted-foreground h-4 w-4" />
                      Resource Type
                    </Label>
                    <Select
                      value={resourceType}
                      onValueChange={setResourceType}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {RESOURCE_TYPES.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            <div className="flex items-center gap-2">
                              <type.icon className="h-4 w-4" />
                              {type.label}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="name" className="flex items-center gap-2">
                      <Type className="text-muted-foreground h-4 w-4" />
                      Name
                    </Label>
                    <Input
                      id="name"
                      name="name"
                      placeholder="e.g., Lecture Notes Chapter 1"
                      required
                    />
                  </div>

                  {resourceType === "link" ? (
                    <div className="grid gap-2">
                      <Label htmlFor="url" className="flex items-center gap-2">
                        <Globe className="text-muted-foreground h-4 w-4" />
                        URL
                      </Label>
                      <Input
                        id="url"
                        name="url"
                        type="url"
                        placeholder="https://..."
                        required
                      />
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      <Label className="flex items-center gap-2">
                        <Upload className="text-muted-foreground h-4 w-4" />
                        Upload File
                      </Label>
                      <div className="flex flex-col gap-2">
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.ppt,.pptx"
                          onChange={handleFileUpload}
                          className="hidden"
                          id="file-upload"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="w-full justify-start"
                        >
                          {uploading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="mr-2 h-4 w-4" />
                              Choose File
                            </>
                          )}
                        </Button>
                        {fileName && (
                          <div className="flex items-center gap-2 rounded-md border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                            <FileText className="h-4 w-4 text-emerald-600" />
                            <span className="text-sm text-emerald-600">
                              {uploadedUrl ? "✓ " : ""}
                              {fileName}
                            </span>
                          </div>
                        )}
                        <p className="text-muted-foreground text-xs">
                          PDF, DOC, DOCX, PPT, PPTX (max 10MB)
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <Separator className="my-4" />
                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => handleOpenChange(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={
                      loading ||
                      uploading ||
                      (resourceType === "document" && !uploadedUrl)
                    }
                  >
                    {loading ? "Adding..." : "Add Resource"}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="pt-6">
          {resources.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
                <FolderOpen className="text-muted-foreground h-6 w-6" />
              </div>
              <p className="mt-4 text-sm font-medium">No resources yet</p>
              <p className="text-muted-foreground text-sm">
                Add study materials for your students.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {resources.map((resource, index) => (
                <div
                  key={index}
                  className="group bg-card hover:bg-muted/50 flex items-center justify-between rounded-lg border p-3 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                        resource.type === "link"
                          ? "bg-blue-500/10"
                          : "bg-amber-500/10"
                      }`}
                    >
                      {resource.type === "link" ? (
                        <LinkIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <FileText className="h-4 w-4 text-amber-600" />
                      )}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{resource.name}</p>
                      <p className="text-muted-foreground max-w-[300px] truncate text-xs">
                        {resource.url}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    <Button variant="ghost" size="icon" asChild>
                      <a
                        href={resource.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() =>
                        handleRemoveClick(resource.url, resource.name)
                      }
                    >
                      <Trash2 className="text-destructive h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <ConfirmDialog
        open={removeConfirm.open}
        onOpenChange={(open) =>
          !open && setRemoveConfirm({ open: false, url: "", name: "" })
        }
        title="Remove Resource"
        description={`Remove "${removeConfirm.name}"? This action cannot be undone.`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleRemoveConfirm}
      />
    </>
  );
}
