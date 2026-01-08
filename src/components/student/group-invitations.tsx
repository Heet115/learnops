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
import { Users, Check, X, Loader2 } from "lucide-react";
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
      toast.success(accept ? "Joined group!" : "Invitation declined");
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

  return (
    <Card className="border-blue-500/30 bg-blue-500/5">
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10">
            <Users className="h-4 w-4 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-blue-700">Group Invitations</CardTitle>
            <CardDescription>
              You have {localInvites.length} pending group invitation
              {localInvites.length !== 1 ? "s" : ""}
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 pt-6">
        {localInvites.map((invite) => {
          const acceptedMembers = invite.members.filter(
            (m) => m.status === "accepted",
          );
          const deadline = new Date(invite.alaId.deadline);
          const isPastDeadline = deadline < new Date();

          return (
            <div
              key={invite._id}
              className="bg-card hover:bg-muted/50 space-y-3 rounded-lg border p-4 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-medium">{invite.name}</p>
                  <p className="text-muted-foreground text-sm">
                    Invited by {invite.createdBy.firstName}{" "}
                    {invite.createdBy.lastName}
                  </p>
                </div>
                {isPastDeadline && (
                  <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-500/10 text-rose-600"
                  >
                    <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-rose-500" />
                    Expired
                  </Badge>
                )}
              </div>

              <div className="text-sm">
                <Link
                  href={`/student/alas/${invite.alaId._id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {invite.alaId.title}
                </Link>
                <p className="text-muted-foreground">
                  {invite.alaId.subjectOfferingId?.subjectId?.code} -{" "}
                  {invite.alaId.subjectOfferingId?.subjectId?.name}
                </p>
              </div>

              <div className="text-sm">
                <p className="text-muted-foreground">
                  Current members:{" "}
                  {acceptedMembers.map((m) => m.studentId.firstName).join(", ")}
                </p>
              </div>

              {!isPastDeadline && (
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleRespond(invite._id, true)}
                    disabled={responding === invite._id}
                  >
                    {responding === invite._id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Check className="mr-1 h-4 w-4" />
                        Accept
                      </>
                    )}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleRespond(invite._id, false)}
                    disabled={responding === invite._id}
                  >
                    <X className="mr-1 h-4 w-4" />
                    Decline
                  </Button>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
