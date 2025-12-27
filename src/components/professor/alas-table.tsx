"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Lock,
  Unlock,
  Eye,
  Users,
} from "lucide-react";
import { deleteALA, toggleALALock } from "@/lib/actions/ala.actions";
import { toast } from "sonner";
import { EditALADialog } from "./edit-ala-dialog";

interface ALA {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  maxMarks: number;
  isGroupSubmission: boolean;
  maxGroupSize?: number;
  isLocked: boolean;
  subjectOfferingId: {
    _id: string;
    subjectId: { name: string; code: string };
    classId: { name: string };
    semesterId: { name: string };
    academicYear: string;
  };
}

interface SubjectOffering {
  _id: string;
  academicYear: string;
  subjectId: { _id: string; name: string; code: string };
  classId: { _id: string; name: string };
  semesterId: { _id: string; name: string; number: number };
}

interface ALAsTableProps {
  alas: ALA[];
  offerings: SubjectOffering[];
}

export function ALAsTable({ alas, offerings }: ALAsTableProps) {
  const [editingALA, setEditingALA] = useState<ALA | null>(null);
  const router = useRouter();

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Delete "${title}"? This action cannot be undone.`)) return;

    const result = await deleteALA(id);
    if (result.success) {
      toast.success("ALA deleted");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete ALA");
    }
  };

  const handleToggleLock = async (id: string, currentlyLocked: boolean) => {
    const result = await toggleALALock(id);
    if (result.success) {
      toast.success(result.isLocked ? "ALA locked" : "ALA unlocked");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to toggle lock");
    }
  };

  const getStatus = (ala: ALA) => {
    if (ala.isLocked)
      return { label: "Locked", variant: "destructive" as const };
    const deadline = new Date(ala.deadline);
    if (deadline < new Date())
      return { label: "Past Due", variant: "secondary" as const };
    return { label: "Active", variant: "default" as const };
  };

  const formatDeadline = (deadline: string) => {
    const date = new Date(deadline);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  if (alas.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No ALAs created yet. Create your first ALA to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Subject</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Deadline</TableHead>
            <TableHead>Marks</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {alas.map((ala) => {
            const status = getStatus(ala);
            return (
              <TableRow key={ala._id}>
                <TableCell className="max-w-[200px] truncate font-medium">
                  {ala.title}
                </TableCell>
                <TableCell>
                  {ala.subjectOfferingId?.subjectId?.code || "-"}
                </TableCell>
                <TableCell>
                  {ala.subjectOfferingId?.classId?.name || "-"}
                </TableCell>
                <TableCell>{formatDeadline(ala.deadline)}</TableCell>
                <TableCell>{ala.maxMarks}</TableCell>
                <TableCell>
                  {ala.isGroupSubmission ? (
                    <Badge variant="outline" className="gap-1">
                      <Users className="h-3 w-3" />
                      Group ({ala.maxGroupSize})
                    </Badge>
                  ) : (
                    <Badge variant="outline">Individual</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem asChild>
                        <Link href={`/professor/alas/${ala._id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setEditingALA(ala)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleToggleLock(ala._id, ala.isLocked)}
                      >
                        {ala.isLocked ? (
                          <>
                            <Unlock className="mr-2 h-4 w-4" />
                            Unlock
                          </>
                        ) : (
                          <>
                            <Lock className="mr-2 h-4 w-4" />
                            Lock
                          </>
                        )}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => handleDelete(ala._id, ala.title)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      {editingALA && (
        <EditALADialog
          ala={editingALA}
          open={!!editingALA}
          onOpenChange={(open) => !open && setEditingALA(null)}
        />
      )}
    </>
  );
}
