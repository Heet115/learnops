"use client";

import { useState, useMemo } from "react";
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
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
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
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    course: "",
    status: "",
  });

  const courseOptions = useMemo(() => {
    const uniqueCourses = new Map<string, { label: string; value: string }>();
    semesters.forEach((sem) => {
      const course = sem.courseId as unknown as
        | (ICourse & { departmentId?: IDepartment })
        | undefined;
      if (course) {
        const id = (course._id as unknown as { toString(): string }).toString();
        if (!uniqueCourses.has(id)) {
          uniqueCourses.set(id, {
            label: `${course.code} - ${course.name}`,
            value: id,
          });
        }
      }
    });
    return Array.from(uniqueCourses.values());
  }, [semesters]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name...",
      },
      {
        key: "course",
        label: "Course",
        type: "select",
        options: courseOptions,
      },
      {
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ],
    [courseOptions],
  );

  const filteredSemesters = useMemo(() => {
    return semesters.filter((semester) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const courseFilter = filters.course as string;
      const status = filters.status as string;
      const course = semester.courseId as unknown as
        | (ICourse & { departmentId?: IDepartment })
        | undefined;

      if (search && !semester.name.toLowerCase().includes(search)) return false;

      if (courseFilter && courseFilter !== "all") {
        const courseId = course
          ? (course._id as unknown as { toString(): string }).toString()
          : "";
        if (courseId !== courseFilter) return false;
      }

      if (status && status !== "all") {
        if (status === "active" && !semester.isActive) return false;
        if (status === "inactive" && semester.isActive) return false;
      }

      return true;
    });
  }, [semesters, filters]);

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
      <div className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredSemesters.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No semesters match your filters.
          </div>
        ) : (
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
              {filteredSemesters.map((semester) => {
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
                      <Badge
                        variant={semester.isActive ? "default" : "secondary"}
                      >
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
        )}
      </div>

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
