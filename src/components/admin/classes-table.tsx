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
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    name: string;
  }>({
    open: false,
    id: "",
    name: "",
  });
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    semester: "",
    department: "",
    academicYear: "",
    status: "",
  });

  const { semesterOptions, departmentOptions, yearOptions } = useMemo(() => {
    const semOpts = semesters.map((s) => ({
      label: `${s.name} - ${s.courseId?.code || ""}`,
      value: s._id,
    }));
    const deptMap = new Map<string, { label: string; value: string }>();
    const yearSet = new Set<string>();
    classes.forEach((cls) => {
      const dept = cls.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
      if (cls.academicYear) yearSet.add(cls.academicYear);
    });
    const yearOpts = Array.from(yearSet)
      .sort()
      .reverse()
      .map((y) => ({ label: y, value: y }));
    return {
      semesterOptions: semOpts,
      departmentOptions: Array.from(deptMap.values()),
      yearOptions: yearOpts,
    };
  }, [semesters, classes]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name...",
      },
      {
        key: "semester",
        label: "Semester",
        type: "select",
        options: semesterOptions,
      },
      {
        key: "department",
        label: "Department",
        type: "select",
        options: departmentOptions,
      },
      {
        key: "academicYear",
        label: "Academic Year",
        type: "select",
        options: yearOptions,
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
    [semesterOptions, departmentOptions, yearOptions],
  );

  const filteredClasses = useMemo(() => {
    return classes.filter((classItem) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const semester = filters.semester as string;
      const department = filters.department as string;
      const academicYear = filters.academicYear as string;
      const status = filters.status as string;

      if (search && !classItem.name.toLowerCase().includes(search))
        return false;
      if (
        semester &&
        semester !== "all" &&
        classItem.semesterId?._id !== semester
      )
        return false;
      if (
        department &&
        department !== "all" &&
        classItem.semesterId?.courseId?.departmentId?.code !== department
      )
        return false;
      if (
        academicYear &&
        academicYear !== "all" &&
        classItem.academicYear !== academicYear
      )
        return false;

      if (status && status !== "all") {
        if (status === "active" && !classItem.isActive) return false;
        if (status === "inactive" && classItem.isActive) return false;
      }

      return true;
    });
  }, [classes, filters]);

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
      <div className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredClasses.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No classes match your filters.
          </div>
        ) : (
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
              {filteredClasses.map((classItem) => (
                <TableRow key={classItem._id}>
                  <TableCell className="font-medium">
                    {classItem.name}
                  </TableCell>
                  <TableCell>{classItem.semesterId?.name || "N/A"}</TableCell>
                  <TableCell>
                    {classItem.semesterId?.courseId?.name || "N/A"} (
                    {classItem.semesterId?.courseId?.code || ""})
                  </TableCell>
                  <TableCell>
                    {classItem.semesterId?.courseId?.departmentId?.code ||
                      "N/A"}
                  </TableCell>
                  <TableCell>{classItem.academicYear}</TableCell>
                  <TableCell>
                    <Badge
                      variant={classItem.isActive ? "default" : "secondary"}
                    >
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
        )}
      </div>

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
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "", name: "" })
        }
        title="Delete Class"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
