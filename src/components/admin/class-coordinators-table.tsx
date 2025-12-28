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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
    className: string;
  }>({
    open: false,
    id: "",
    className: "",
  });
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    department: "",
    academicYear: "",
  });

  const { departmentOptions, yearOptions } = useMemo(() => {
    const deptMap = new Map<string, { label: string; value: string }>();
    const yearSet = new Set<string>();
    coordinators.forEach((c) => {
      const dept = c.classId?.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, { label: `${dept.code} - ${dept.name}`, value: dept.code });
      }
      if (c.academicYear) yearSet.add(c.academicYear);
    });
    const yearOpts = Array.from(yearSet).sort().reverse().map((y) => ({ label: y, value: y }));
    return { departmentOptions: Array.from(deptMap.values()), yearOptions: yearOpts };
  }, [coordinators]);

  const filterConfigs: FilterConfig[] = useMemo(() => [
    { key: "search", label: "Search", type: "text", placeholder: "Search by class or professor..." },
    { key: "department", label: "Department", type: "select", options: departmentOptions },
    { key: "academicYear", label: "Academic Year", type: "select", options: yearOptions },
  ], [departmentOptions, yearOptions]);

  const filteredCoordinators = useMemo(() => {
    return coordinators.filter((coordinator) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const department = filters.department as string;
      const academicYear = filters.academicYear as string;

      if (search) {
        const className = coordinator.classId?.name?.toLowerCase() || "";
        const profName = `${coordinator.professorId?.firstName} ${coordinator.professorId?.lastName}`.toLowerCase();
        if (!className.includes(search) && !profName.includes(search)) return false;
      }

      if (department && department !== "all" && coordinator.classId?.semesterId?.courseId?.departmentId?.code !== department) return false;
      if (academicYear && academicYear !== "all" && coordinator.academicYear !== academicYear) return false;

      return true;
    });
  }, [coordinators, filters]);

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
      <div className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredCoordinators.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No coordinators match your filters.
          </div>
        ) : (
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
              {filteredCoordinators.map((coordinator) => (
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
        )}
      </div>

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
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "", className: "" })
        }
        title="Remove Coordinator"
        description={`Are you sure you want to remove the coordinator for "${deleteConfirm.className}"?`}
        confirmText="Remove"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
