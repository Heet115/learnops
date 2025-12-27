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
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { deleteClass } from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditClassDialog } from "./edit-class-dialog";

interface ClassItem {
  _id: string;
  name: string;
  academicYear: string;
  isActive: boolean;
  semesterId: {
    _id: string;
    name: string;
    number: number;
    courseId: {
      _id: string;
      name: string;
      code: string;
      departmentId: {
        name: string;
        code: string;
      };
    };
  };
}

interface Semester {
  _id: string;
  name: string;
  number: number;
  courseId: {
    _id: string;
    name: string;
    code: string;
    departmentId: {
      name: string;
      code: string;
    };
  };
}

interface ClassesTableProps {
  classes: ClassItem[];
  semesters: Semester[];
}

export function ClassesTable({ classes, semesters }: ClassesTableProps) {
  const [editingClass, setEditingClass] = useState<ClassItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string; name: string }>({
    open: false,
    id: "",
    name: "",
  });
  const router = useRouter();

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", name: "" });

    const result = await deleteClass(id);
    if (result.success) {
      toast.success("Class deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete class");
    }
  };

  if (classes.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No classes found. Create your first class to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {classes.map((classItem) => (
            <TableRow key={classItem._id}>
              <TableCell className="font-medium">{classItem.name}</TableCell>
              <TableCell>{classItem.semesterId?.name || "N/A"}</TableCell>
              <TableCell>
                {classItem.semesterId?.courseId?.name || "N/A"} (
                {classItem.semesterId?.courseId?.code || ""})
              </TableCell>
              <TableCell>
                {classItem.semesterId?.courseId?.departmentId?.code || "N/A"}
              </TableCell>
              <TableCell>{classItem.academicYear}</TableCell>
              <TableCell>
                <Badge variant={classItem.isActive ? "default" : "secondary"}>
                  {classItem.isActive ? "Active" : "Inactive"}
                </Badge>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem
                      onClick={() => setEditingClass(classItem)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() =>
                        handleDeleteClick(classItem._id, classItem.name)
                      }
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {editingClass && (
        <EditClassDialog
          classItem={editingClass}
          semesters={semesters}
          open={!!editingClass}
          onOpenChange={(open) => !open && setEditingClass(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, id: "", name: "" })}
        title="Delete Class"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
