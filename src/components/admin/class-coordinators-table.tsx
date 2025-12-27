"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreHorizontal, Pencil, Trash2, Crown } from "lucide-react";
import { deleteClassCoordinator } from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditCoordinatorDialog } from "./edit-coordinator-dialog";

interface ClassCoordinator {
  _id: string;
  academicYear: string;
  classId: {
    _id: string;
    name: string;
    academicYear: string;
    semesterId: {
      _id: string;
      name: string;
      number: number;
      courseId: {
        name: string;
        code: string;
        departmentId: {
          name: string;
          code: string;
        };
      };
    };
  };
  professorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
  semesterId: {
    _id: string;
    name: string;
    courseId: {
      name: string;
      code: string;
      departmentId: {
        code: string;
      };
    };
  };
}

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface ClassCoordinatorsTableProps {
  coordinators: ClassCoordinator[];
  classes: ClassItem[];
  professors: Professor[];
}

export function ClassCoordinatorsTable({
  coordinators,
  classes,
  professors,
}: ClassCoordinatorsTableProps) {
  const [editingCoordinator, setEditingCoordinator] =
    useState<ClassCoordinator | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; className: string }>({
    open: false,
    id: "",
    className: "",
  });
  const router = useRouter();

  const handleDeleteClick = (id: string, className: string) => {
    setDeleteConfirm({ open: true, id, className });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", className: "" });

    const result = await deleteClassCoordinator(id);
    if (result.success) {
      toast.success("Coordinator removed successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to remove coordinator");
    }
  };

  if (coordinators.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No class coordinators assigned yet. Assign your first coordinator to get
        started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Class</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Coordinator</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {coordinators.map((coordinator) => (
            <TableRow key={coordinator._id}>
              <TableCell>
                <div className="flex items-center gap-2">
                  <Crown className="h-4 w-4 text-yellow-500" />
                  <span className="font-medium">
                    {coordinator.classId?.name || "N/A"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                {coordinator.classId?.semesterId?.name || "N/A"}
              </TableCell>
              <TableCell>
                {coordinator.classId?.semesterId?.courseId?.name || "N/A"} (
                {coordinator.classId?.semesterId?.courseId?.code || ""})
              </TableCell>
              <TableCell>
                {coordinator.classId?.semesterId?.courseId?.departmentId
                  ?.code || "N/A"}
              </TableCell>
              <TableCell>
                <div>
                  <span>
                    {coordinator.professorId?.firstName}{" "}
                    {coordinator.professorId?.lastName}
                  </span>
                  <p className="text-muted-foreground text-sm">
                    {coordinator.professorId?.email}
                  </p>
                </div>
              </TableCell>
              <TableCell>{coordinator.academicYear}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingCoordinator(coordinator)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Change Coordinator
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        handleDeleteClick(
                          coordinator._id,
                          coordinator.classId?.name || "",
                        )
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingCoordinator && (
        <EditCoordinatorDialog
          coordinator={editingCoordinator}
          professors={professors}
          open={!!editingCoordinator}
          onOpenChange={(open) => !open && setEditingCoordinator(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, id: "", className: "" })}
        title="Remove Coordinator"
        description={`Are you sure you want to remove the coordinator for "${deleteConfirm.className}"?`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
