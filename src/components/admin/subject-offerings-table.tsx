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
import { deleteSubjectOffering } from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditSubjectOfferingDialog } from "./edit-subject-offering-dialog";

interface SubjectOffering {
  _id: string;
  academicYear: string;
  isActive: boolean;
  subjectId: {
    _id: string;
    name: string;
    code: string;
    credits: number;
  };
  classId: {
    _id: string;
    name: string;
    academicYear: string;
  };
  professorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
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
}

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SubjectOfferingsTableProps {
  offerings: SubjectOffering[];
  professors: Professor[];
}

export function SubjectOfferingsTable({
  offerings,
  professors,
}: SubjectOfferingsTableProps) {
  const [editingOffering, setEditingOffering] =
    useState<SubjectOffering | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: string }>({
    open: false,
    id: "",
  });
  const router = useRouter();

  const handleDeleteClick = (id: string) => {
    setDeleteConfirm({ open: true, id });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "" });

    const result = await deleteSubjectOffering(id);
    if (result.success) {
      toast.success("Subject offering deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete subject offering");
    }
  };

  if (offerings.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No subject offerings found. Create your first assignment to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Subject</TableHead>
            <TableHead>Class</TableHead>
            <TableHead>Professor</TableHead>
            <TableHead>Semester</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {offerings.map((offering) => (
            <TableRow key={offering._id}>
              <TableCell>
                <div>
                  <span className="font-medium">
                    {offering.subjectId?.code}
                  </span>
                  <p className="text-muted-foreground text-sm">
                    {offering.subjectId?.name}
                  </p>
                </div>
              </TableCell>
              <TableCell>{offering.classId?.name || "N/A"}</TableCell>
              <TableCell>
                <div>
                  <span>
                    {offering.professorId?.firstName}{" "}
                    {offering.professorId?.lastName}
                  </span>
                  <p className="text-muted-foreground text-sm">
                    {offering.professorId?.email}
                  </p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <span>{offering.semesterId?.name}</span>
                  <p className="text-muted-foreground text-sm">
                    {offering.semesterId?.courseId?.departmentId?.code} -{" "}
                    {offering.semesterId?.courseId?.code}
                  </p>
                </div>
              </TableCell>
              <TableCell>{offering.academicYear}</TableCell>
              <TableCell>
                <Badge variant={offering.isActive ? "default" : "secondary"}>
                  {offering.isActive ? "Active" : "Inactive"}
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
                      onClick={() => setEditingOffering(offering)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDeleteClick(offering._id)}
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

      {editingOffering && (
        <EditSubjectOfferingDialog
          offering={editingOffering}
          professors={professors}
          open={!!editingOffering}
          onOpenChange={(open) => !open && setEditingOffering(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => !open && setDeleteConfirm({ open: false, id: "" })}
        title="Delete Subject Offering"
        description="Are you sure you want to delete this subject offering? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
