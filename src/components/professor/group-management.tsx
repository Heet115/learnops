"use client";

import { useState, useEffect, useCallback } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Users, Plus, Trash2, Pencil, Loader2 } from "lucide-react";
import {
  getStudentsForGroupAssignment,
  createGroupByProfessor,
  updateGroupByProfessor,
  deleteGroupByProfessor,
} from "@/lib/actions/group.actions";
import { toast } from "sonner";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface GroupMember {
  studentId: Student;
  status: string;
  joinedAt?: string;
}

interface Group {
  _id: string;
  name: string;
  members: GroupMember[];
  isLocked: boolean;
}

interface GroupManagementProps {
  alaId: string;
  maxGroupSize: number;
}

export function GroupManagement({ alaId, maxGroupSize }: GroupManagementProps) {
  const [students, setStudents] = useState<Student[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [assignedIds, setAssignedIds] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    const result = await getStudentsForGroupAssignment(alaId);
    if (result.success) {
      setStudents(result.students || []);
      setGroups(result.groups || []);
      setAssignedIds(result.assignedStudentIds || []);
    } else {
      toast.error(result.error || "Failed to load data");
    }
    setLoading(false);
  }, [alaId]);

  useEffect(() => {
    let isMounted = true;

    getStudentsForGroupAssignment(alaId).then((result) => {
      if (!isMounted) return;
      if (result.success) {
        setStudents(result.students || []);
        setGroups(result.groups || []);
        setAssignedIds(result.assignedStudentIds || []);
      } else {
        toast.error(result.error || "Failed to load data");
      }
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [alaId]);

  const unassignedStudents = students.filter(
    (s) => !assignedIds.includes(s._id),
  );

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <Loader2 className="text-muted-foreground mx-auto h-8 w-8 animate-spin" />
          <p className="text-muted-foreground mt-2">Loading groups...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Group Management
            </CardTitle>
            <CardDescription>
              Assign students to groups (max {maxGroupSize} per group)
            </CardDescription>
          </div>
          <CreateGroupDialog
            alaId={alaId}
            students={unassignedStudents}
            maxGroupSize={maxGroupSize}
            open={createOpen}
            onOpenChange={setCreateOpen}
            onSuccess={loadData}
          />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {groups.length === 0 ? (
          <p className="text-muted-foreground py-4 text-center">
            No groups created yet. Click &quot;Create Group&quot; to get
            started.
          </p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {groups.map((group) => (
              <GroupCard
                key={group._id}
                group={group}
                allStudents={students}
                assignedIds={assignedIds}
                maxGroupSize={maxGroupSize}
                onUpdate={loadData}
              />
            ))}
          </div>
        )}

        {unassignedStudents.length > 0 && (
          <div className="border-t pt-4">
            <p className="mb-2 text-sm font-medium">
              Unassigned Students ({unassignedStudents.length})
            </p>
            <div className="flex flex-wrap gap-2">
              {unassignedStudents.map((s) => (
                <Badge key={s._id} variant="outline">
                  {s.firstName} {s.lastName}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Create Group Dialog
function CreateGroupDialog({
  alaId,
  students,
  maxGroupSize,
  open,
  onOpenChange,
  onSuccess,
}: {
  alaId: string;
  students: Student[];
  maxGroupSize: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 students");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    const result = await createGroupByProfessor(alaId, {
      name,
      studentIds: selectedIds,
    });

    if (result.success) {
      toast.success("Group created");
      setSelectedIds([]);
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to create group");
    }
    setLoading(false);
  };

  const toggleStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
    } else if (selectedIds.length < maxGroupSize) {
      setSelectedIds([...selectedIds, id]);
    } else {
      toast.error(`Max ${maxGroupSize} students per group`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" disabled={students.length < 2}>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Select students to form a group.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Group 1, Team Alpha"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>
                Select Students ({selectedIds.length}/{maxGroupSize})
              </Label>
              <div className="max-h-60 overflow-y-auto rounded-lg border">
                {students.length === 0 ? (
                  <p className="text-muted-foreground p-4 text-center text-sm">
                    All students are assigned to groups
                  </p>
                ) : (
                  students.map((student) => (
                    <div
                      key={student._id}
                      className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 border-b p-3 last:border-0"
                      onClick={() => toggleStudent(student._id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(student._id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleStudent(student._id)}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {student.firstName} {student.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {student.email}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedIds.length < 2}>
              {loading ? "Creating..." : "Create Group"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Group Card Component
function GroupCard({
  group,
  allStudents,
  assignedIds,
  maxGroupSize,
  onUpdate,
}: {
  group: Group;
  allStudents: Student[];
  assignedIds: string[];
  maxGroupSize: number;
  onUpdate: () => void;
}) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteGroupByProfessor(group._id);
    if (result.success) {
      toast.success("Group deleted");
      onUpdate();
    } else {
      toast.error(result.error || "Failed to delete");
    }
    setDeleting(false);
  };

  // Available students = unassigned + current group members
  const currentMemberIds = group.members.map((m) => m.studentId._id);
  const availableStudents = allStudents.filter(
    (s) => !assignedIds.includes(s._id) || currentMemberIds.includes(s._id),
  );

  return (
    <div className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h4 className="font-medium">{group.name}</h4>
          {group.isLocked && (
            <Badge variant="secondary" className="text-xs">
              Locked
            </Badge>
          )}
        </div>
        {!group.isLocked && (
          <div className="flex gap-1">
            <EditGroupDialog
              group={group}
              availableStudents={availableStudents}
              maxGroupSize={maxGroupSize}
              open={editOpen}
              onOpenChange={setEditOpen}
              onSuccess={onUpdate}
            />
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="ghost" size="icon" disabled={deleting}>
                  <Trash2 className="text-destructive h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Group?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove all students from this group.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>
      <div className="space-y-1">
        {group.members.map((member) => (
          <div key={member.studentId._id} className="text-sm">
            {member.studentId.firstName} {member.studentId.lastName}
          </div>
        ))}
      </div>
      <p className="text-muted-foreground mt-2 text-xs">
        {group.members.length} member{group.members.length !== 1 ? "s" : ""}
      </p>
    </div>
  );
}

// Edit Group Dialog
function EditGroupDialog({
  group,
  availableStudents,
  maxGroupSize,
  open,
  onOpenChange,
  onSuccess,
}: {
  group: Group;
  availableStudents: Student[];
  maxGroupSize: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>(
    group.members.map((m) => m.studentId._id),
  );
  const [name, setName] = useState(group.name);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedIds.length < 2) {
      toast.error("Select at least 2 students");
      return;
    }

    setLoading(true);
    const result = await updateGroupByProfessor(group._id, {
      name,
      studentIds: selectedIds,
    });

    if (result.success) {
      toast.success("Group updated");
      onOpenChange(false);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to update");
    }
    setLoading(false);
  };

  const toggleStudent = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
    } else if (selectedIds.length < maxGroupSize) {
      setSelectedIds([...selectedIds, id]);
    } else {
      toast.error(`Max ${maxGroupSize} students per group`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Group</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-name">Group Name</Label>
              <Input
                id="edit-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>
                Members ({selectedIds.length}/{maxGroupSize})
              </Label>
              <div className="max-h-60 overflow-y-auto rounded-lg border">
                {availableStudents.map((student) => (
                  <div
                    key={student._id}
                    className="hover:bg-muted/50 flex cursor-pointer items-center gap-3 border-b p-3 last:border-0"
                    onClick={() => toggleStudent(student._id)}
                  >
                    <Checkbox
                      checked={selectedIds.includes(student._id)}
                      onClick={(e) => e.stopPropagation()}
                      onCheckedChange={() => toggleStudent(student._id)}
                    />
                    <div>
                      <p className="text-sm font-medium">
                        {student.firstName} {student.lastName}
                      </p>
                      <p className="text-muted-foreground text-xs">
                        {student.email}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedIds.length < 2}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
