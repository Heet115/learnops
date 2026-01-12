"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Users,
  Check,
  X,
  Loader2,
  BookOpen,
  Clock,
  UserPlus,
  ChevronRight,
} from "lucide-react";
import { respondToGroupInvite } from "@/lib/actions/group.actions";
import { toast } from "sonner";

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
}

interface GroupMember {
  studentId: Student;
  status: string;
}

interface ALA {
  _id: string;
  title: string;
  deadline: string;
  subjectOfferingId?: {
    subjectId?: {
      name: string;
      code: string;
    };
  };
}

interface GroupInvite {
  _id: string;
  name: string;
  alaId: ALA;
  createdBy: Student;
  members: GroupMember[];
}

interface GroupInvitationsProps {
  invitations: GroupInvite[];
}

export function GroupInvitations({ invitations }: GroupInvitationsProps) {
  const [responding, setResponding] = useState<string | null>(null);
  const [localInvites, setLocalInvites] = useState(invitations);
  const router = useRouter();

  const handleRespond = async (groupId: string, accept: boolean) => {
    setResponding(groupId);
    const result = await respondToGroupInvite(groupId, accept);

    if (result.success) {
      toast.success(
        accept ? "Joined group successfully!" : "Invitation declined",
      );
      setLocalInvites(localInvites.filter((i) => i._id !== groupId));
      router.refresh();
    } else {
      toast.error(result.error || "Failed to respond");
    }
    setResponding(null);
  };

  if (localInvites.length === 0) {
    return null;
  }

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    if (days < 0) return { text: "Expired", urgent: true, expired: true };
    if (days === 0) return { text: "Due today", urgent: true, expired: false };
    if (days === 1)
      return { text: "Due tomorrow", urgent: true, expired: false };
    if (days <= 3)
      return { text: `${days} days left`, urgent: true, expired: false };
    return {
      text: date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      }),
      urgent: false,
      expired: false,
    };
  };

  return (
    <Card className="border-blue-500/30 bg-linear-to-br from-blue-500/5 to-violet-500/5">
      <CardHeader className="border-b border-blue-500/20 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
              <UserPlus className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-blue-700">Group Invitations</CardTitle>
              <CardDescription>
                {localInvites.length} pending invitation
                {localInvites.length !== 1 ? "s" : ""} waiting for your response
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-blue-600 text-white">
            {localInvites.length} New
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-6">
        {localInvites.map((invite) => {
          const acceptedMembers = invite.members.filter(
            (m) => m.status === "accepted",
          );
          const pendingMembers = invite.members.filter(
            (m) => m.status === "pending",
          );
          const deadline = formatDeadline(invite.alaId.deadline);
          const isResponding = responding === invite._id;

          return (
            <div
              key={invite._id}
              className="group bg-card relative overflow-hidden rounded-xl border transition-all hover:shadow-md"
            >
              {/* Gradient accent */}
              <div className="absolute inset-x-0 top-0 h-1 bg-linear-to-r from-blue-500 to-violet-500" />

              <div className="p-4">
                {/* Header with group name and deadline */}
                <div className="mb-3 flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                      <Users className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <h4 className="font-semibold">{invite.name}</h4>
                      <p className="text-muted-foreground text-sm">
                        Invited by {invite.createdBy.firstName}{" "}
                        {invite.createdBy.lastName}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      deadline.expired
                        ? "border-rose-500/30 bg-rose-500/10 text-rose-600"
                        : deadline.urgent
                          ? "border-amber-500/30 bg-amber-500/10 text-amber-600"
                          : "border-emerald-500/30 bg-emerald-500/10 text-emerald-600"
                    }
                  >
                    <Clock className="mr-1.5 h-3 w-3" />
                    {deadline.text}
                  </Badge>
                </div>

                {/* ALA Info */}
                <Link
                  href={`/student/alas/${invite.alaId._id}`}
                  className="bg-muted/30 hover:bg-muted/50 mb-4 flex items-center gap-3 rounded-lg border p-3 transition-colors"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-500/10">
                    <BookOpen className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{invite.alaId.title}</p>
                    <p className="text-muted-foreground text-xs">
                      {invite.alaId.subjectOfferingId?.subjectId?.code} -{" "}
                      {invite.alaId.subjectOfferingId?.subjectId?.name}
                    </p>
                  </div>
                  <ChevronRight className="text-muted-foreground h-4 w-4" />
                </Link>

                {/* Members */}
                <div className="mb-4">
                  <p className="text-muted-foreground mb-2 text-xs font-medium tracking-wide uppercase">
                    Group Members ({acceptedMembers.length} joined
                    {pendingMembers.length > 1
                      ? `, ${pendingMembers.length - 1} pending`
                      : ""}
                    )
                  </p>
                  <div className="flex items-center gap-2">
                    <TooltipProvider>
                      <div className="flex -space-x-2">
                        {acceptedMembers.slice(0, 5).map((member) => (
                          <Tooltip key={member.studentId._id}>
                            <TooltipTrigger asChild>
                              <Avatar className="border-background h-8 w-8 border-2">
                                <AvatarFallback className="bg-emerald-500/10 text-xs text-emerald-600">
                                  {member.studentId.firstName[0]}
                                  {member.studentId.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {member.studentId.firstName}{" "}
                                {member.studentId.lastName}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                        {acceptedMembers.length > 5 && (
                          <Avatar className="border-background h-8 w-8 border-2">
                            <AvatarFallback className="bg-muted text-xs">
                              +{acceptedMembers.length - 5}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </TooltipProvider>
                    <span className="text-muted-foreground text-sm">
                      {acceptedMembers
                        .map((m) => m.studentId.firstName)
                        .join(", ")}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                {!deadline.expired ? (
                  <div className="flex gap-2">
                    <Button
                      className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                      onClick={() => handleRespond(invite._id, true)}
                      disabled={isResponding}
                    >
                      {isResponding ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="mr-2 h-4 w-4" />
                      )}
                      Accept
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1 border-rose-500/30 text-rose-600 hover:bg-rose-500/10 hover:text-rose-700"
                      onClick={() => handleRespond(invite._id, false)}
                      disabled={isResponding}
                    >
                      <X className="mr-2 h-4 w-4" />
                      Decline
                    </Button>
                  </div>
                ) : (
                  <div className="rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-center">
                    <p className="text-sm text-rose-600">
                      This invitation has expired. The deadline has passed.
                    </p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
