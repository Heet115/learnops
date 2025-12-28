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
import { deleteSubject } from "@/lib/actions/academic.actions";
import { toast } from "sonner";
import { EditSubjectDialog } from "./edit-subject-dialog";

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
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

interface SubjectsTableProps {
  subjects: Subject[];
  semesters: Semester[];
}

export function SubjectsTable({ subjects, semesters }: SubjectsTableProps) {
  const [editingSubject, setEditingSubject] = useState<Subject | null>(null);
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
    status: "",
  });

  const { semesterOptions, departmentOptions } = useMemo(() => {
    const semOpts = semesters.map((s) => ({
      label: `${s.name} - ${s.courseId?.code || ""}`,
      value: s._id,
    }));
    const deptMap = new Map<string, { label: string; value: string }>();
    subjects.forEach((sub) => {
      const dept = sub.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
    });
    return {
      semesterOptions: semOpts,
      departmentOptions: Array.from(deptMap.values()),
    };
  }, [semesters, subjects]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by name or code...",
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
        key: "status",
        label: "Status",
        type: "select",
        options: [
          { label: "Active", value: "active" },
          { label: "Inactive", value: "inactive" },
        ],
      },
    ],
    [semesterOptions, departmentOptions],
  );

  const filteredSubjects = useMemo(() => {
    return subjects.filter((subject) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const semester = filters.semester as string;
      const department = filters.department as string;
      const status = filters.status as string;

      if (search) {
        if (
          !subject.name.toLowerCase().includes(search) &&
          !subject.code.toLowerCase().includes(search)
        ) {
          return false;
        }
      }

      if (
        semester &&
        semester !== "all" &&
        subject.semesterId?._id !== semester
      )
        return false;
      if (
        department &&
        department !== "all" &&
        subject.semesterId?.courseId?.departmentId?.code !== department
      )
        return false;

      if (status && status !== "all") {
        if (status === "active" && !subject.isActive) return false;
        if (status === "inactive" && subject.isActive) return false;
      }

      return true;
    });
  }, [subjects, filters]);

  const handleDeleteClick = (id: string, name: string) => {
    setDeleteConfirm({ open: true, id, name });
  };

  const handleDeleteConfirm = async () => {
    const { id } = deleteConfirm;
    setDeleteConfirm({ open: false, id: "", name: "" });

    const result = await deleteSubject(id);
    if (result.success) {
      toast.success("Subject deleted successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to delete subject");
    }
  };

  if (subjects.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No subjects found. Create your first subject to get started.
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

        {filteredSubjects.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No subjects match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Semester</TableHead>
                <TableHead>Course</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Credits</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[70px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubjects.map((subject) => (
                <TableRow key={subject._id}>
                  <TableCell className="font-medium">{subject.code}</TableCell>
                  <TableCell>{subject.name}</TableCell>
                  <TableCell>{subject.semesterId?.name || "N/A"}</TableCell>
                  <TableCell>
                    {subject.semesterId?.courseId?.name || "N/A"} (
                    {subject.semesterId?.courseId?.code || ""})
                  </TableCell>
                  <TableCell>
                    {subject.semesterId?.courseId?.departmentId?.code || "N/A"}
                  </TableCell>
                  <TableCell>{subject.credits}</TableCell>
                  <TableCell>
                    <Badge variant={subject.isActive ? "default" : "secondary"}>
                      {subject.isActive ? "Active" : "Inactive"}
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
                          onClick={() => setEditingSubject(subject)}
                        >
                          <Pencil className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          className="text-destructive"
                          onClick={() =>
                            handleDeleteClick(subject._id, subject.name)
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

      {editingSubject && (
        <EditSubjectDialog
          subject={editingSubject}
          semesters={semesters}
          open={!!editingSubject}
          onOpenChange={(open) => !open && setEditingSubject(null)}
        />
      )}

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "", name: "" })
        }
        title="Delete Subject"
        description={`Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
