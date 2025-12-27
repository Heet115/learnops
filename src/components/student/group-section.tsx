"use client";

import { useState, useEffect } from "react";
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
import { Users, Plus, LogOut, Loader2, Clock, Check, X } from "lucide-react";
import {
  getStudentGroup,
  getClassmatesForInvite,
  createGroupByStudent,
  leaveGroup,
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
  status: "pending" | "accepted" | "declined";
  joinedAt?: string;
}

interface Group {
  _id: string;
  name: string;
  createdBy: { _id: string; firstName: string; lastName: string };
  createdByRole: string;
  members: GroupMember[];
  isLocked: boolean;
}

interface GroupSectionProps {
  alaId: string;
  studentId: string;
  groupFormation: "student" | "professor";
  maxGroupSize: number;
  canModify: boolean;
}

export function GroupSection({
  alaId,
  studentId,
  groupFormation,
  maxGroupSize,
  canModify,
}: GroupSectionProps) {
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    loadGroup();
  }, [alaId]);

  const loadGroup = async () => {
    setLoading(true);
    const result = await getStudentGroup(alaId);
    setGroup(result);
    setLoading(false);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Loader2 className="h-6 w-6 animate-spin mx-auto text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Student has a group
  if (group) {
    const isCreator = group.createdBy._id === studentId;
    const myMembership = group.members.find(
      (m) => m.studentId._id === studentId
    );
    const acceptedMembers = group.members.filter(
      (m) => m.status === "accepted"
    );
    const pendingMembers = group.members.filter((m) => m.status === "pending");

    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {group.name}
              </CardTitle>
              <CardDescription>
                {groupFormation === "professor"
                  ? "Assigned by professor"
                  : `Created by ${group.createdBy.firstName} ${group.createdBy.lastName}`}
              </CardDescription>
            </div>
            {group.isLocked && (
              <Badge variant="secondary">Submitted</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium mb-2">Members</p>
            <div className="space-y-2">
              {acceptedMembers.map((member) => (
                <div
                  key={member.studentId._id}
                  className="flex items-center justify-between text-sm"
                >
                  <span>
                    {member.studentId.firstName} {member.studentId.lastName}
                    {member.studentId._id === studentId && " (You)"}
                    {member.studentId._id === group.createdBy._id && " ★"}
                  </span>
                  <Badge variant="outline" className="text-green-600">
                    <Check className="h-3 w-3 mr-1" />
                    Joined
                  </Badge>
                </div>
              ))}
              {pendingMembers.map((member) => (
                <div
                  key={member.studentId._id}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-muted-foreground">
                    {member.studentId.firstName} {member.studentId.lastName}
                  </span>
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    Pending
                  </Badge>
                </div>
              ))}
            </div>
          </div>

          {canModify && !group.isLocked && groupFormation === "student" && (
            <LeaveGroupButton
              groupId={group._id}
              isCreator={isCreator}
              onSuccess={loadGroup}
            />
          )}
        </CardContent>
      </Card>
    );
  }

  // No group yet
  if (groupFormation === "professor") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Group Assignment
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm">
            You have not been assigned to a group yet. Please wait for your
            professor to assign you to a group.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Student can create group
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Group Submission
        </CardTitle>
        <CardDescription>
          Create a group and invite your classmates
        </CardDescription>
      </CardHeader>
      <CardContent>
        {canModify ? (
          <CreateGroupDialog
            alaId={alaId}
            maxGroupSize={maxGroupSize}
            onSuccess={loadGroup}
          />
        ) : (
          <p className="text-muted-foreground text-sm">
            Cannot create group - deadline passed or ALA is locked
          </p>
        )}
      </CardContent>
    </Card>
  );
}


// Create Group Dialog for Students
function CreateGroupDialog({
  alaId,
  maxGroupSize,
  onSuccess,
}: {
  alaId: string;
  maxGroupSize: number;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClassmates, setLoadingClassmates] = useState(false);
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  useEffect(() => {
    if (open) {
      setLoadingClassmates(true);
      setSelectedIds([]);
      getClassmatesForInvite(alaId).then((result) => {
        if (result.success) {
          setClassmates(result.classmates || []);
        } else {
          toast.error(result.error || "Failed to load classmates");
        }
        setLoadingClassmates(false);
      });
    }
  }, [open, alaId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (selectedIds.length < 1) {
      toast.error("Invite at least 1 classmate");
      return;
    }

    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const name = formData.get("name") as string;

    const result = await createGroupByStudent(alaId, {
      name,
      inviteIds: selectedIds,
    });

    if (result.success) {
      toast.success("Group created! Invitations sent.");
      setOpen(false);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to create group");
    }
    setLoading(false);
  };

  const toggleClassmate = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((s) => s !== id));
    } else if (selectedIds.length < maxGroupSize - 1) {
      // -1 because creator is already counted
      setSelectedIds([...selectedIds, id]);
    } else {
      toast.error(`Max ${maxGroupSize} members including you`);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Group</DialogTitle>
            <DialogDescription>
              Create a group and invite classmates. They will need to accept
              your invitation.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Group Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="e.g., Team Alpha"
                required
              />
            </div>
            <div className="grid gap-2">
              <Label>
                Invite Classmates ({selectedIds.length}/{maxGroupSize - 1})
              </Label>
              {loadingClassmates ? (
                <div className="border rounded-lg p-4 text-center">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                </div>
              ) : classmates.length === 0 ? (
                <div className="border rounded-lg p-4 text-center text-muted-foreground text-sm">
                  No available classmates to invite
                </div>
              ) : (
                <div className="border rounded-lg max-h-60 overflow-y-auto">
                  {classmates.map((classmate) => (
                    <div
                      key={classmate._id}
                      className="flex items-center gap-3 p-3 border-b last:border-0 hover:bg-muted/50 cursor-pointer"
                      onClick={() => toggleClassmate(classmate._id)}
                    >
                      <Checkbox
                        checked={selectedIds.includes(classmate._id)}
                        onClick={(e) => e.stopPropagation()}
                        onCheckedChange={() => toggleClassmate(classmate._id)}
                      />
                      <div>
                        <p className="text-sm font-medium">
                          {classmate.firstName} {classmate.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {classmate.email}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedIds.length < 1}>
              {loading ? "Creating..." : "Create & Send Invites"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// Leave Group Button
function LeaveGroupButton({
  groupId,
  isCreator,
  onSuccess,
}: {
  groupId: string;
  isCreator: boolean;
  onSuccess: () => void;
}) {
  const [leaving, setLeaving] = useState(false);

  const handleLeave = async () => {
    setLeaving(true);
    const result = await leaveGroup(groupId);
    if (result.success) {
      toast.success(isCreator ? "Group deleted" : "Left group");
      onSuccess();
    } else {
      toast.error(result.error || "Failed to leave group");
    }
    setLeaving(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="outline" className="w-full" disabled={leaving}>
          <LogOut className="h-4 w-4 mr-2" />
          {isCreator ? "Delete Group" : "Leave Group"}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isCreator ? "Delete Group?" : "Leave Group?"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isCreator
              ? "This will delete the group and remove all members. This cannot be undone."
              : "You will be removed from this group. You can join or create another group."}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleLeave}>
            {isCreator ? "Delete" : "Leave"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
