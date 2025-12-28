"use client";

import { useState, useMemo } from "react";
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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    title: string;
  }>({
    open: false,
    id: "",
    title: "",
  });
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    subject: "",
    class: "",
    status: "",
    type: "",
  });

  const { subjectOptions, classOptions } = useMemo(() => {
    const subjectMap = new Map<string, { label: string; value: string }>();
    const classMap = new Map<string, { label: string; value: string }>();
    alas.forEach((ala) => {
      const subject = ala.subjectOfferingId?.subjectId;
      const cls = ala.subjectOfferingId?.classId;
      if (subject) {
        subjectMap.set(subject.code, {
          label: `${subject.code} - ${subject.name}`,
          value: subject.code,
        });
      }
      if (cls) {
        classMap.set(cls.name, { label: cls.name, value: cls.name });
      }
    });
    return {
      subjectOptions: Array.from(subjectMap.values()),
      classOptions: Array.from(classMap.values()),
    };
  }, [alas]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by title...",
      },
      {
        key: "subject",
        label: "Subject",
        type: "select",
        options: subjectOptions,
      },
      { key: "class", label: "Class", type: "select", options: classOptions },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Locked", value: "locked" },
          { label: "Past Due", value: "past" },
        ],
      },
      {
        key: "type",
        label: "Type",
        type: "select",
        options: [
          { label: "Individual", value: "individual" },
          { label: "Group", value: "group" },
        ],
      },
    ],
    [subjectOptions, classOptions],
  );

  const filteredALAs = useMemo(() => {
    return alas.filter((ala) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const subject = filters.subject as string;
      const classFilter = filters.class as string;
      const status = filters.status as string;
      const type = filters.type as string;

      if (search && !ala.title.toLowerCase().includes(search)) return false;
      if (
        subject &&
        subject !== "all" &&
        ala.subjectOfferingId?.subjectId?.code !== subject
      )
        return false;
      if (
        classFilter &&
        classFilter !== "all" &&
        ala.subjectOfferingId?.classId?.name !== classFilter
      )
        return false;

      if (status && status !== "all") {
        const alaStatus = getStatus(ala);
        if (status === "active" && alaStatus.label !== "Active") return false;
        if (status === "locked" && alaStatus.label !== "Locked") return false;
        if (status === "past" && alaStatus.label !== "Past Due") return false;
      }

      if (type && type !== "all") {
        if (type === "individual" && ala.isGroupSubmission) return false;
        if (type === "group" && !ala.isGroupSubmission) return false;
      }

      return true;
    });
  }, [alas, filters]);

  const handleDeleteClick = (id: string, title: string) => {
    setDeleteConfirm({ open: true, id, title });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", title: "" });

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
      <div className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredALAs.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No ALAs match your filters.
          </div>
        ) : (
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
              {filteredALAs.map((ala) => {
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
                            onClick={() =>
                              handleToggleLock(ala._id, ala.isLocked)
                            }
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
                            onClick={() =>
                              handleDeleteClick(ala._id, ala.title)
                            }
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
        )}
      </div>

      {editingALA && (
        <EditALADialog
          ala={editingALA}
          open={!!editingALA}
          onOpenChange={(open) => !open && setEditingALA(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "", title: "" })
        }
        title="Delete ALA"
        description={`Delete "${deleteConfirm.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
