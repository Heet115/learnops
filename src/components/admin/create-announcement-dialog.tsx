"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import {
  createAnnouncement,
  getAnnouncementTargetOptions,
} from "@/lib/actions/announcement.actions";

interface TargetOptions {
  departments: Array<{ _id: string; name: string; code: string }>;
  courses: Array<{ _id: string; name: string; code: string }>;
  classes: Array<{ _id: string; name: string; academicYear: string }>;
}

export function CreateAnnouncementDialog() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<TargetOptions | null>(null);
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [targetType, setTargetType] = useState<string>("all");
  const [targetId, setTargetId] = useState<string>("");
  const [targetRole, setTargetRole] = useState<string>("");
  const [priority, setPriority] = useState<string>("normal");
  const [isPinned, setIsPinned] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");

  useEffect(() => {
    if (open) {
      getAnnouncementTargetOptions().then((result) => {
        if (result.success && result.options) {
          setOptions(result.options);
        }
      });
    }
  }, [open]);

  const resetForm = () => {
    setTitle("");
    setContent("");
    setTargetType("all");
    setTargetId("");
    setTargetRole("");
    setPriority("normal");
    setIsPinned(false);
    setExpiresAt("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const target: { type: string; id?: string; role?: string } = {
      type: targetType,
    };
    if (targetType === "role") {
      target.role = targetRole as "student" | "professor" | "hod";
    } else if (["department", "course", "class"].includes(targetType)) {
      target.id = targetId;
    }

    const result = await createAnnouncement({
      title,
      content,
      target: target as { type: "all" | "department" | "course" | "class" | "role"; id?: string; role?: "student" | "professor" | "hod" },
      priority: priority as "low" | "normal" | "high" | "urgent",
      isPinned,
      expiresAt: expiresAt || undefined,
    });

    setLoading(false);

    if (result.success) {
      toast.success("Announcement created");
      setOpen(false);
      resetForm();
    } else {
      toast.error(result.error || "Failed to create announcement");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Create Announcement</DialogTitle>
          <DialogDescription>
            Broadcast a message to users across the system
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Announcement title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Content</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Target Audience</Label>
              <Select value={targetType} onValueChange={setTargetType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Users</SelectItem>
                  <SelectItem value="role">By Role</SelectItem>
                  <SelectItem value="department">Department</SelectItem>
                  <SelectItem value="course">Course</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {targetType === "role" && (
            <div className="space-y-2">
              <Label>Select Role</Label>
              <Select value={targetRole} onValueChange={setTargetRole}>
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="student">Students</SelectItem>
                  <SelectItem value="professor">Professors</SelectItem>
                  <SelectItem value="hod">HODs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === "department" && options && (
            <div className="space-y-2">
              <Label>Select Department</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  {options.departments.map((dept) => (
                    <SelectItem key={dept._id} value={dept._id}>
                      {dept.name} ({dept.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === "course" && options && (
            <div className="space-y-2">
              <Label>Select Course</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select course" />
                </SelectTrigger>
                <SelectContent>
                  {options.courses.map((course) => (
                    <SelectItem key={course._id} value={course._id}>
                      {course.name} ({course.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {targetType === "class" && options && (
            <div className="space-y-2">
              <Label>Select Class</Label>
              <Select value={targetId} onValueChange={setTargetId}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {options.classes.map((cls) => (
                    <SelectItem key={cls._id} value={cls._id}>
                      {cls.name} ({cls.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="expiresAt">Expires At (Optional)</Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Switch
                id="pinned"
                checked={isPinned}
                onCheckedChange={setIsPinned}
              />
              <Label htmlFor="pinned">Pin announcement</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Creating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
