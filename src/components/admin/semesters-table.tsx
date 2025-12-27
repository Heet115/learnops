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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { deleteSemester } from "@/lib/actions/academic.actions";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { ISemester, ICourse, IDepartment } from "@/lib/db";
import { toast } from "sonner";

interface SemestersTableProps {
  semesters: (ISemester & {
    courseId?: ICourse & { departmentId?: IDepartment };
  })[];
}

export function SemestersTable({ semesters }: SemestersTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);

    const result = await deleteSemester(deleteId);

    if (result.success) {
      toast.success("Semester deleted successfully");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete semester");
    }

    setIsLoading(false);
  };

  if (semesters.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No semesters found. Create your first semester to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Semester</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Duration</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {semesters.map((semester) => {
            const id = (
              semester._id as unknown as { toString(): string }
            ).toString();
            const course = semester.courseId as unknown as
              | (ICourse & { departmentId?: IDepartment })
              | undefined;
            const dept = course?.departmentId as unknown as
              | IDepartment
              | undefined;
            return (
              <TableRow key={id}>
                <TableCell>
                  <div>
                    <span className="font-medium">{semester.name}</span>
                    <span className="text-muted-foreground ml-2">
                      (#{semester.number})
                    </span>
                  </div>
                </TableCell>
                <TableCell>
                  {course ? (
                    <Badge variant="outline">{course.code}</Badge>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell>{dept ? dept.code : "-"}</TableCell>
                <TableCell className="text-muted-foreground">
                  {semester.startDate && semester.endDate ? (
                    <>
                      {new Date(semester.startDate).toLocaleDateString()} -{" "}
                      {new Date(semester.endDate).toLocaleDateString()}
                    </>
                  ) : (
                    "Not set"
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={semester.isActive ? "default" : "secondary"}>
                    {semester.isActive ? "Active" : "Inactive"}
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
                        className="text-destructive"
                        onClick={() => setDeleteId(id)}
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

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Semester</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isLoading}
              className="bg-destructive hover:bg-destructive/90"
            >
              {isLoading ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
