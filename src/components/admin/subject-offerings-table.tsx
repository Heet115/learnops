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
import {
  BulkActionsBar,
  SelectAllCheckbox,
  SelectRowCheckbox,
  useRowSelection,
} from "@/components/ui/bulk-actions";
import { MoreHorizontal, Pencil, Trash2, Power, PowerOff } from "lucide-react";
import {
  deleteSubjectOffering,
  bulkDeleteSubjectOfferings,
  bulkToggleSubjectOfferingStatus,
} from "@/lib/actions/academic.actions";
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
  const [deleteConfirm, setDeleteConfirm] = useState<{
    open: boolean;
    id: string;
  }>({
    open: false,
    id: "",
  });
  const router = useRouter();
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    professor: "",
    department: "",
    academicYear: "",
    status: "",
  });

  const { professorOptions, departmentOptions, yearOptions } = useMemo(() => {
    const profOpts = professors.map((p) => ({
      label: `${p.firstName} ${p.lastName}`,
      value: p._id,
    }));
    const deptMap = new Map<string, { label: string; value: string }>();
    const yearSet = new Set<string>();
    offerings.forEach((off) => {
      const dept = off.semesterId?.courseId?.departmentId;
      if (dept) {
        deptMap.set(dept.code, {
          label: `${dept.code} - ${dept.name}`,
          value: dept.code,
        });
      }
      if (off.academicYear) yearSet.add(off.academicYear);
    });
    const yearOpts = Array.from(yearSet)
      .sort()
      .reverse()
      .map((y) => ({ label: y, value: y }));
    return {
      professorOptions: profOpts,
      departmentOptions: Array.from(deptMap.values()),
      yearOptions: yearOpts,
    };
  }, [professors, offerings]);

  const filterConfigs: FilterConfig[] = useMemo(
    () => [
      {
        key: "search",
        label: "Search",
        type: "text",
        placeholder: "Search by subject...",
      },
      {
        key: "professor",
        label: "Professor",
        type: "select",
        options: professorOptions,
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
    [professorOptions, departmentOptions, yearOptions],
  );

  const filteredOfferings = useMemo(() => {
    return offerings.filter((offering) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const professor = filters.professor as string;
      const department = filters.department as string;
      const academicYear = filters.academicYear as string;
      const status = filters.status as string;

      if (search) {
        const subjectName = offering.subjectId?.name?.toLowerCase() || "";
        const subjectCode = offering.subjectId?.code?.toLowerCase() || "";
        if (!subjectName.includes(search) && !subjectCode.includes(search))
          return false;
      }

      if (
        professor &&
        professor !== "all" &&
        offering.professorId?._id !== professor
      )
        return false;
      if (
        department &&
        department !== "all" &&
        offering.semesterId?.courseId?.departmentId?.code !== department
      )
        return false;
      if (
        academicYear &&
        academicYear !== "all" &&
        offering.academicYear !== academicYear
      )
        return false;

      if (status && status !== "all") {
        if (status === "active" && !offering.isActive) return false;
        if (status === "inactive" && offering.isActive) return false;
      }

      return true;
    });
  }, [offerings, filters]);

  const {
    selectedItems,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    toggleAll,
    toggleRow,
    clearSelection,
    isSelected,
  } = useRowSelection(filteredOfferings);

  const bulkActions = useMemo(
    () => [
      {
        label: "Activate",
        icon: <Power className="h-4 w-4" />,
        onClick: async (items: SubjectOffering[]) => {
          const ids = items.map((o) => o._id);
          const result = await bulkToggleSubjectOfferingStatus(ids, true);
          if (result.success) {
            toast.success(`${result.count} offerings activated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to activate offerings");
          }
        },
      },
      {
        label: "Deactivate",
        icon: <PowerOff className="h-4 w-4" />,
        onClick: async (items: SubjectOffering[]) => {
          const ids = items.map((o) => o._id);
          const result = await bulkToggleSubjectOfferingStatus(ids, false);
          if (result.success) {
            toast.success(`${result.count} offerings deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate offerings");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: SubjectOffering[]) => {
          const ids = items.map((o) => o._id);
          const result = await bulkDeleteSubjectOfferings(ids);
          if (result.success) {
            toast.success(`${result.count} offerings deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete offerings");
          }
        },
      },
    ],
    [clearSelection, router]
  );

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
      <div className="space-y-4">
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={filteredOfferings.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {filteredOfferings.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No subject offerings match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <SelectAllCheckbox
                    checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                    onCheckedChange={toggleAll}
                  />
                </TableHead>
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
              {filteredOfferings.map((offering) => (
                <TableRow
                  key={offering._id}
                  data-state={isSelected(offering._id) ? "selected" : undefined}
                >
                  <TableCell>
                    <SelectRowCheckbox
                      checked={isSelected(offering._id)}
                      onCheckedChange={(checked) => toggleRow(offering._id, checked)}
                    />
                  </TableCell>
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
                    <Badge
                      variant={offering.isActive ? "default" : "secondary"}
                    >
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
        )}
      </div>

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
        onOpenChange={(open) =>
          !open && setDeleteConfirm({ open: false, id: "" })
        }
        title="Delete Subject Offering"
        description="Are you sure you want to delete this subject offering? This action cannot be undone."
        confirmText="Delete"
        variant="destructive"
        onConfirm={handleDeleteConfirm}
      />
    </>
  );
}
