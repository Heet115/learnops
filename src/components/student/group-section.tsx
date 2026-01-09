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
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Users,
  Plus,
  LogOut,
  Loader2,
  Check,
  UserPlus,
  Crown,
  Lock,
  MoreVertical,
  UserMinus,
  ArrowRightLeft,
  X,
} from "lucide-react";
import {
  getStudentGroup,
  getClassmatesForInvite,
  createGroupByStudent,
  leaveGroup,
  selfAssignAsLeader,
  inviteMemberByLeader,
  removeMemberByLeader,
  transferLeadership,
  getAvailableClassmatesForLeader,
  cancelInvite,
} from "@/lib/actions/group.actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

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
  leaderId?: { _id: string; firstName: string; lastName: string };
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

  const loadGroup = useCallback(async () => {
    setLoading(true);
    const result = await getStudentGroup(alaId);
    setGroup(result);
    setLoading(false);
  }, [alaId]);

  useEffect(() => {
    let isMounted = true;

    getStudentGroup(alaId).then((result) => {
      if (!isMounted) return;
      setGroup(result);
      setLoading(false);
    });

    return () => {
      isMounted = false;
    };
  }, [alaId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6 text-center">
          <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  // Student has a group
  if (group) {
    const isCreator = group.createdBy._id === studentId;
    const isLeader = group.leaderId?._id === studentId;
    const acceptedMembers = group.members.filter(
      (m) => m.status === "accepted",
    );
    const pendingMembers = group.members.filter((m) => m.status === "pending");
    const canBecomeLeader = !group.leaderId && !group.isLocked && canModify;
    const canManageMembers =
      isLeader && !group.isLocked && canModify && groupFormation === "student";

    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
                <Users className="h-4 w-4 text-violet-600" />
              </div>
              <div>
                <CardTitle>{group.name}</CardTitle>
                <CardDescription>
                  {groupFormation === "professor"
                    ? "Assigned by professor"
                    : `Created by ${group.createdBy.firstName} ${group.createdBy.lastName}`}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {group.isLocked && (
                <Badge
                  variant="outline"
                  className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                >
                  <Lock className="mr-1 h-3 w-3" />
                  Submitted
                </Badge>
              )}
              {canManageMembers && (
                <InviteMemberDialog groupId={group._id} onSuccess={loadGroup} />
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          {/* Leader Section */}
          <div className="flex items-center justify-between rounded-lg border bg-amber-500/5 p-3">
            <div className="flex items-center gap-2">
              <Crown className="h-4 w-4 text-amber-500" />
              <span className="text-sm font-medium">Group Leader:</span>
              {group.leaderId ? (
                <span className="text-sm">
                  {group.leaderId.firstName} {group.leaderId.lastName}
                  {isLeader && (
                    <Badge
                      variant="outline"
                      className="ml-2 border-amber-500/30 bg-amber-500/10 px-1.5 py-0 text-[10px] text-amber-600"
                    >
                      You
                    </Badge>
                  )}
                </span>
              ) : (
                <span className="text-muted-foreground text-sm italic">
                  Not assigned
                </span>
              )}
            </div>
            {canBecomeLeader && (
              <BecomeLeaderButton groupId={group._id} onSuccess={loadGroup} />
            )}
          </div>

          {/* Leader Info Banner */}
          {isLeader && !group.isLocked && canModify && (
            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <p className="text-sm text-amber-700">
                <Crown className="mr-1.5 inline h-4 w-4" />
                As the group leader, you can submit and edit the group&apos;s
                work
                {groupFormation === "student" &&
                  ", invite or remove members, and transfer leadership"}
                .
              </p>
            </div>
          )}

          <div>
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/10">
                <Users className="h-3.5 w-3.5 text-blue-600" />
              </div>
              <p className="text-sm font-medium">
                Members ({acceptedMembers.length + pendingMembers.length})
              </p>
            </div>
            <div className="space-y-2">
              {acceptedMembers.map((member) => (
                <div
                  key={member.studentId._id}
                  className="flex items-center justify-between rounded-lg border bg-emerald-500/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-emerald-500/10 text-xs text-emerald-600">
                        {member.studentId.firstName[0]}
                        {member.studentId.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-sm font-medium">
                          {member.studentId.firstName}{" "}
                          {member.studentId.lastName}
                        </span>
                        {member.studentId._id === studentId && (
                          <Badge
                            variant="outline"
                            className="border-blue-500/30 bg-blue-500/10 px-1.5 py-0 text-[10px] text-blue-600"
                          >
                            You
                          </Badge>
                        )}
                        {group.leaderId &&
                          member.studentId._id === group.leaderId._id && (
                            <Crown className="h-3.5 w-3.5 text-amber-500" />
                          )}
                        {member.studentId._id === group.createdBy._id &&
                          !group.leaderId && (
                            <Badge
                              variant="outline"
                              className="border-violet-500/30 bg-violet-500/10 px-1.5 py-0 text-[10px] text-violet-600"
                            >
                              Creator
                            </Badge>
                          )}
                      </div>
                      <p className="text-muted-foreground text-xs">
                        {member.studentId.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    >
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      Joined
                    </Badge>
                    {canManageMembers && member.studentId._id !== studentId && (
                      <MemberActionsMenu
                        groupId={group._id}
                        memberId={member.studentId._id}
                        memberName={`${member.studentId.firstName} ${member.studentId.lastName}`}
                        isCurrentLeader={
                          group.leaderId?._id === member.studentId._id
                        }
                        onSuccess={loadGroup}
                      />
                    )}
                  </div>
                </div>
              ))}
              {pendingMembers.map((member) => (
                <div
                  key={member.studentId._id}
                  className="flex items-center justify-between rounded-lg border border-dashed bg-amber-500/5 p-3"
                >
                  <div className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-amber-500/10 text-xs text-amber-600">
                        {member.studentId.firstName[0]}
                        {member.studentId.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <span className="text-muted-foreground text-sm">
                        {member.studentId.firstName} {member.studentId.lastName}
                      </span>
                      <p className="text-muted-foreground text-xs">
                        {member.studentId.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className="border-amber-500/30 bg-amber-500/10 text-amber-600"
                    >
                      <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-amber-500" />
                      Pending
                    </Badge>
                    {(isCreator || isLeader) && !group.isLocked && canModify && (
                      <CancelInviteButton
                        groupId={group._id}
                        memberId={member.studentId._id}
                        memberName={`${member.studentId.firstName} ${member.studentId.lastName}`}
                        onSuccess={loadGroup}
                      />
                    )}
                  </div>
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
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
              <Users className="h-4 w-4 text-violet-600" />
            </div>
            <CardTitle>Group Assignment</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-lg border border-dashed p-4 text-center">
            <Users className="text-muted-foreground/50 mx-auto h-8 w-8" />
            <p className="text-muted-foreground mt-2 text-sm">
              You have not been assigned to a group yet. Please wait for your
              professor to assign you to a group.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Student can create group
  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500/10">
            <Users className="h-4 w-4 text-violet-600" />
          </div>
          <div>
            <CardTitle>Group Submission</CardTitle>
            <CardDescription>
              Create a group and invite your classmates
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {canModify ? (
          <CreateGroupDialog
            alaId={alaId}
            maxGroupSize={maxGroupSize}
            onSuccess={loadGroup}
          />
        ) : (
          <div className="rounded-lg border border-dashed p-4 text-center">
            <Lock className="text-muted-foreground/50 mx-auto h-8 w-8" />
            <p className="text-muted-foreground mt-2 text-sm">
              Cannot create group - deadline passed or ALA is locked
            </p>
          </div>
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
  const [loadingClassmates, setLoadingClassmates] = useState(true);
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (!newOpen) {
      // Reset state when dialog closes
      setSelectedIds([]);
      setLoadingClassmates(true);
    }
  };

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    getClassmatesForInvite(alaId).then((result) => {
      if (!isMounted) return;
      if (result.success) {
        setClassmates(result.classmates || []);
      } else {
        toast.error(result.error || "Failed to load classmates");
      }
      setLoadingClassmates(false);
    });

    return () => {
      isMounted = false;
    };
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
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Create Group
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] p-0">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="p-6 pb-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                <UserPlus className="h-5 w-5 text-violet-600" />
              </div>
              <div>
                <DialogTitle>Create Group</DialogTitle>
                <DialogDescription>
                  Create a group and invite classmates. They will need to accept
                  your invitation.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="mt-4" />
          <div className="grid gap-4 p-6">
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
              <div className="flex items-center justify-between">
                <Label>Invite Classmates</Label>
                <Badge
                  variant="outline"
                  className="border-blue-500/30 bg-blue-500/10 text-blue-600"
                >
                  {selectedIds.length}/{maxGroupSize - 1} selected
                </Badge>
              </div>
              {loadingClassmates ? (
                <div className="rounded-lg border p-8 text-center">
                  <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
                  <p className="text-muted-foreground mt-2 text-sm">
                    Loading classmates...
                  </p>
                </div>
              ) : classmates.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <Users className="text-muted-foreground/50 mx-auto h-8 w-8" />
                  <p className="text-muted-foreground mt-2 text-sm">
                    No available classmates to invite
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-60 rounded-lg border">
                  <div className="p-1">
                    {classmates.map((classmate) => {
                      const isSelected = selectedIds.includes(classmate._id);
                      return (
                        <div
                          key={classmate._id}
                          className={`flex cursor-pointer items-center gap-3 rounded-md p-3 transition-colors ${
                            isSelected
                              ? "bg-violet-500/10"
                              : "hover:bg-muted/50"
                          }`}
                          onClick={() => toggleClassmate(classmate._id)}
                        >
                          <div
                            className={cn(
                              "flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border",
                              isSelected
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-input",
                            )}
                          >
                            {isSelected && <Check className="h-3 w-3" />}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback
                              className={`text-xs ${isSelected ? "bg-violet-500/20 text-violet-600" : "bg-muted"}`}
                            >
                              {classmate.firstName[0]}
                              {classmate.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              {classmate.firstName} {classmate.lastName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {classmate.email}
                            </p>
                          </div>
                          {isSelected && (
                            <Check className="h-4 w-4 text-violet-600" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
          <Separator />
          <DialogFooter className="p-6 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || selectedIds.length < 1}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Send Invites"
              )}
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
        <Button
          variant="outline"
          className="w-full text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
          disabled={leaving}
        >
          <LogOut className="mr-2 h-4 w-4" />
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
          <AlertDialogAction
            onClick={handleLeave}
            className="bg-rose-600 hover:bg-rose-700"
          >
            {leaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isCreator ? "Deleting..." : "Leaving..."}
              </>
            ) : isCreator ? (
              "Delete"
            ) : (
              "Leave"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Become Leader Button
function BecomeLeaderButton({
  groupId,
  onSuccess,
}: {
  groupId: string;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);

  const handleBecomeLeader = async () => {
    setLoading(true);
    const result = await selfAssignAsLeader(groupId);
    if (result.success) {
      toast.success("You are now the group leader!");
      onSuccess();
    } else {
      toast.error(result.error || "Failed to become leader");
    }
    setLoading(false);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleBecomeLeader}
      disabled={loading}
      className="border-amber-500/30 bg-amber-500/10 text-amber-600 hover:bg-amber-500/20"
    >
      {loading ? (
        <>
          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          Assigning...
        </>
      ) : (
        <>
          <Crown className="mr-1 h-3 w-3" />
          Become Leader
        </>
      )}
    </Button>
  );
}

// Invite Member Dialog (for leaders)
function InviteMemberDialog({
  groupId,
  onSuccess,
}: {
  groupId: string;
  onSuccess: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingClassmates, setLoadingClassmates] = useState(true);
  const [classmates, setClassmates] = useState<Student[]>([]);
  const [remainingSlots, setRemainingSlots] = useState(0);

  useEffect(() => {
    if (!open) return;

    let isMounted = true;

    getAvailableClassmatesForLeader(groupId).then((result) => {
      if (!isMounted) return;
      if (result.success) {
        setClassmates(result.classmates || []);
        setRemainingSlots(result.remainingSlots || 0);
      } else {
        toast.error(result.error || "Failed to load classmates");
      }
      setLoadingClassmates(false);
    });

    return () => {
      isMounted = false;
    };
  }, [open, groupId]);

  const handleInvite = async (studentId: string) => {
    setLoading(true);
    const result = await inviteMemberByLeader(groupId, studentId);
    if (result.success) {
      toast.success("Invitation sent!");
      setClassmates(classmates.filter((c) => c._id !== studentId));
      setRemainingSlots((prev) => prev - 1);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to invite");
    }
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[80vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <UserPlus className="h-5 w-5 text-violet-600" />
            </div>
            <div>
              <DialogTitle>Invite Members</DialogTitle>
              <DialogDescription>
                Invite classmates to join your group ({remainingSlots} slots
                remaining)
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        <Separator className="mt-4" />
        <div className="p-6">
          {loadingClassmates ? (
            <div className="rounded-lg border p-8 text-center">
              <Loader2 className="text-muted-foreground mx-auto h-6 w-6 animate-spin" />
              <p className="text-muted-foreground mt-2 text-sm">
                Loading classmates...
              </p>
            </div>
          ) : classmates.length === 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="text-muted-foreground/50 mx-auto h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                No available classmates to invite
              </p>
            </div>
          ) : remainingSlots <= 0 ? (
            <div className="rounded-lg border border-dashed p-8 text-center">
              <Users className="text-muted-foreground/50 mx-auto h-8 w-8" />
              <p className="text-muted-foreground mt-2 text-sm">
                Group is at maximum capacity
              </p>
            </div>
          ) : (
            <ScrollArea className="h-60 rounded-lg border">
              <div className="p-1">
                {classmates.map((classmate) => (
                  <div
                    key={classmate._id}
                    className="hover:bg-muted/50 flex items-center justify-between gap-3 rounded-md p-3"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-muted text-xs">
                          {classmate.firstName[0]}
                          {classmate.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-medium">
                          {classmate.firstName} {classmate.lastName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {classmate.email}
                        </p>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleInvite(classmate._id)}
                      disabled={loading}
                    >
                      {loading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <UserPlus className="mr-1 h-3 w-3" />
                          Invite
                        </>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Member Actions Menu (for leaders)
function MemberActionsMenu({
  groupId,
  memberId,
  memberName,
  isCurrentLeader,
  onSuccess,
}: {
  groupId: string;
  memberId: string;
  memberName: string;
  isCurrentLeader: boolean;
  onSuccess: () => void;
}) {
  const [removing, setRemoving] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    const result = await removeMemberByLeader(groupId, memberId);
    if (result.success) {
      toast.success(`${memberName} removed from group`);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to remove member");
    }
    setRemoving(false);
  };

  const handleTransfer = async () => {
    setTransferring(true);
    const result = await transferLeadership(groupId, memberId);
    if (result.success) {
      toast.success(`Leadership transferred to ${memberName}`);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to transfer leadership");
    }
    setTransferring(false);
  };

  if (isCurrentLeader) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
              <ArrowRightLeft className="mr-2 h-4 w-4" />
              Transfer Leadership
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Transfer Leadership?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to make {memberName} the group leader? You
                will no longer be able to manage the group.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleTransfer}
                disabled={transferring}
              >
                {transferring ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Transferring...
                  </>
                ) : (
                  "Transfer"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-rose-600 focus:text-rose-600"
            >
              <UserMinus className="mr-2 h-4 w-4" />
              Remove from Group
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member?</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {memberName} from the group?
                They can be invited again later.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleRemove}
                disabled={removing}
                className="bg-rose-600 hover:bg-rose-700"
              >
                {removing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Removing...
                  </>
                ) : (
                  "Remove"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Remove Member Button (for pending members)
function RemoveMemberButton({
  groupId,
  memberId,
  memberName,
  onSuccess,
}: {
  groupId: string;
  memberId: string;
  memberName: string;
  onSuccess: () => void;
}) {
  const [removing, setRemoving] = useState(false);

  const handleRemove = async () => {
    setRemoving(true);
    const result = await removeMemberByLeader(groupId, memberId);
    if (result.success) {
      toast.success(`Invitation to ${memberName} cancelled`);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to cancel invitation");
    }
    setRemoving(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
          disabled={removing}
        >
          {removing ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <UserMinus className="h-4 w-4" />
          )}
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel the invitation to {memberName}?
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleRemove}
            className="bg-rose-600 hover:bg-rose-700"
          >
            Cancel Invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Cancel Invite Button (for creator/leader to cancel pending invites)
function CancelInviteButton({
  groupId,
  memberId,
  memberName,
  onSuccess,
}: {
  groupId: string;
  memberId: string;
  memberName: string;
  onSuccess: () => void;
}) {
  const [cancelling, setCancelling] = useState(false);

  const handleCancel = async () => {
    setCancelling(true);
    const result = await cancelInvite(groupId, memberId);
    if (result.success) {
      toast.success(`Invitation to ${memberName} cancelled`);
      onSuccess();
    } else {
      toast.error(result.error || "Failed to cancel invitation");
    }
    setCancelling(false);
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
          disabled={cancelling}
        >
          {cancelling ? (
            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
          ) : (
            <X className="mr-1 h-3 w-3" />
          )}
          Cancel
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Cancel Invitation?</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to cancel the invitation to {memberName}? They will no longer be able to join this group.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep Invitation</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleCancel}
            className="bg-rose-600 hover:bg-rose-700"
          >
            Cancel Invitation
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
