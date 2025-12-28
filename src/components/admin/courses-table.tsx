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
import { deleteCourse } from "@/lib/actions/academic.actions";
import { MoreHorizontal, Trash2 } from "lucide-react";
import { ICourse, IDepartment } from "@/lib/db";
import { toast } from "sonner";

interface CoursesTableProps {
  courses: (ICourse & { departmentId?: IDepartment })[];
  departments: IDepartment[];
}

const courseTypeLabels: Record<string, string> = {
  diploma: "Diploma",
  ug: "UG",
  pg: "PG",
};

export function CoursesTable({ courses, departments }: CoursesTableProps) {
  const router = useRouter();
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    department: "",
    courseType: "",
    status: "",
  });

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name or code...",
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: departments.map((d) => ({
          label: `${d.code} - ${d.name}`,
          value: (d._id as unknown as { toString(): string }).toString(),
        })),
      },
      {
        key: "courseType",
        label: "Type",
        type: "select",
        options: [
          { label: "Diploma", value: "diploma" },
          { label: "Undergraduate", value: "ug" },
          { label: "Postgraduate", value: "pg" },
        ],
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
    [departments],
  );

  const filteredCourses = useMemo(() => {
    return courses.filter((course) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const department = filters.department as string;
      const courseType = filters.courseType as string;
      const status = filters.status as string;
      const dept = course.departmentId as unknown as IDepartment | undefined;

      if (search) {
        if (
          !course.name.toLowerCase().includes(search) &&
          !course.code.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (department && department !== "all") {
        const deptId = dept
          ? (dept._id as unknown as { toString(): string }).toString()
          : "";
        if (deptId !== department) return false;
      }

      if (courseType && courseType !== "all") {
        if (
          (course as unknown as { courseType?: string }).courseType !==
          courseType
        )
          return false;
      }

      if (status && status !== "all") {
        if (status === "active" && !course.isActive) return false;
        if (status === "inactive" && course.isActive) return false;
      }

      return true;
    });
  }, [courses, filters]);

  const handleDelete = async () => {
    if (!deleteId) return;
    setIsLoading(true);
    setError("");

    const result = await deleteCourse(deleteId);

    if (result.success) {
      toast.success("Course deleted successfully");
      setDeleteId(null);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete course");
      setError(result.error || "Failed to delete");
    }

    setIsLoading(false);
  };

  if (courses.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No courses found. Create your first course to get started.
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

        {filteredCourses.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No courses match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Duration</TableHead>
                <TableHead>Semesters</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCourses.map((course) => {
                const id = (
                  course._id as unknown as { toString(): string }
                ).toString();
                const dept = course.departmentId as unknown as
                  | IDepartment
                  | undefined;
                const courseData = course as unknown as {
                  courseType?: string;
                  totalSemesters?: number;
                };
                return (
                  <TableRow key={id}>
                    <TableCell className="font-mono font-medium">
                      {course.code}
                    </TableCell>
                    <TableCell>{course.name}</TableCell>
                    <TableCell>
                      {dept ? (
                        <Badge variant="outline">{dept.code}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {courseData.courseType ? (
                        <Badge variant="secondary">
                          {courseTypeLabels[courseData.courseType] ||
                            courseData.courseType}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {course.duration}{" "}
                      {course.duration === 1 ? "Year" : "Years"}
                    </TableCell>
                    <TableCell>{courseData.totalSemesters || "-"}</TableCell>
                    <TableCell>
                      <Badge
                        variant={course.isActive ? "default" : "secondary"}
                      >
                        {course.isActive ? "Active" : "Inactive"}
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
            <AlertDialogTitle>Delete Course</AlertDialogTitle>
            <AlertDialogDescription>
              {error ||
                "Are you sure? This will also delete all auto-generated semesters for this course. Courses with subjects cannot be deleted."}
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
