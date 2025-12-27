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
import { deleteDepartment } from "@/lib/actions/academic.actions";
import { MoreHorizontal, Trash2, Pencil } from "lucide-react";
import { IDepartment, IUser } from "@/lib/db";
import { EditDepartmentDialog } from "./edit-department-dialog";
import { toast } from "sonner";

interface DepartmentsTableProps {
  departments: (IDepartment & { hodId?: IUser })[];
  hods: IUser[];
}

export function DepartmentsTable({ departments, hods }: DepartmentsTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editDepartment, setEditDepartment] = useState<IDepartment | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    setError("");

    const result = await deleteDepartment(deleteId);

    if (result.success) {
      toast.success("Department deleted successfully");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete department");
      setError(result.error || "Failed to delete");
    }

    setIsLoading(false);
  };

  if (departments.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No departments found. Create your first department to get started.
      </div>
    );
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>HOD</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Created</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {departments.map((dept) => {
            const id = (
              dept._id as unknown as { toString(): string }
            ).toString();
            const hod = dept.hodId as unknown as IUser | undefined;
            return (
              <TableRow key={id}>
                <TableCell className="font-mono font-medium">
                  {dept.code}
                </TableCell>
                <TableCell>{dept.name}</TableCell>
                <TableCell>
                  {hod ? (
                    `${hod.firstName} ${hod.lastName}`
                  ) : (
                    <span className="text-muted-foreground">Not assigned</span>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={dept.isActive ? "default" : "secondary"}>
                    {dept.isActive ? "Active" : "Inactive"}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  {new Date(dept.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => setEditDepartment(dept)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
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
            <AlertDialogTitle>Delete Department</AlertDialogTitle>
            <AlertDialogDescription>
              {error ||
                "Are you sure? This action cannot be undone. Departments with courses cannot be deleted."}
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

      {editDepartment && (
        <EditDepartmentDialog
          department={editDepartment}
          hods={hods}
          open={!!editDepartment}
          onOpenChange={(open) => !open && setEditDepartment(null)}
        />
      )}
    </>
  );
}
