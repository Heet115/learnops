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
  DropdownMenuSeparator,
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
import {
  BulkActionsBar,
  SelectAllCheckbox,
  SelectRowCheckbox,
  useRowSelection,
} from "@/components/ui/bulk-actions";
import { UserAvatar } from "@/components/ui/user-avatar";
import { RoleBadge } from "@/components/ui/role-badge";
import { DataExportButton, type ExportColumn } from "@/components/ui/data-export";
import { FilterPresetsDropdown } from "@/components/ui/filter-presets";
import {
  useTableSort,
  useTablePagination,
  PaginationControls,
  type ColumnDef,
} from "@/components/ui/enhanced-data-table";
import { Badge } from "@/components/ui/badge";
import {
  deactivateUser,
  reactivateUser,
  deleteUser,
  bulkDeactivateUsers,
  bulkReactivateUsers,
  bulkDeleteUsers,
} from "@/lib/actions/admin.actions";
import {
  MoreHorizontal,
  UserX,
  UserCheck,
  Trash2,
  UserCog,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { IUser, ICourse } from "@/lib/db";
import { toast } from "sonner";
import { StudentProfileDialog } from "./student-profile-dialog";

interface UsersTableProps {
  users: IUser[];
  courses?: ICourse[];
}

type UserWithStringId = IUser & { _id: string };

const filterConfigs: FilterConfig[] = [
  {
    key: "search",
    label: "Search",
    type: "text",
    placeholder: "Search by name or email...",
  },
  {
    key: "role",
    label: "Role",
    type: "select",
    options: [
      { label: "Admin", value: "admin" },
      { label: "HOD", value: "hod" },
      { label: "Professor", value: "professor" },
      { label: "Student", value: "student" },
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
];

// Export columns configuration
const exportColumns: ExportColumn<UserWithStringId>[] = [
  { key: "name", header: "Name", accessor: (row) => `${row.firstName} ${row.lastName}` },
  { key: "email", header: "Email", accessor: (row) => row.email },
  { key: "role", header: "Role", accessor: (row) => row.role.toUpperCase() },
  { key: "status", header: "Status", accessor: (row) => row.isActive ? "Active" : "Inactive" },
  { key: "createdAt", header: "Created", accessor: (row) => new Date(row.createdAt).toLocaleDateString() },
];

// Table columns for sorting
const tableColumns: ColumnDef<UserWithStringId>[] = [
  { id: "name", header: "User", sortable: true, accessorFn: (row) => `${row.firstName} ${row.lastName}` },
  { id: "email", header: "Email", sortable: true, accessorKey: "email" as keyof UserWithStringId },
  { id: "role", header: "Role", sortable: true, accessorKey: "role" as keyof UserWithStringId },
  { id: "status", header: "Status", sortable: true, accessorFn: (row) => row.isActive ? "Active" : "Inactive" },
  { id: "createdAt", header: "Created", sortable: true, accessorKey: "createdAt" as keyof UserWithStringId },
];

export function UsersTable({ users, courses = [] }: UsersTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [actionType, setActionType] = useState<
    "deactivate" | "reactivate" | "delete" | null
  >(null);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState<FilterValue>({
    search: "",
    role: "",
    status: "",
  });
  const [profileDialogUser, setProfileDialogUser] = useState<IUser | null>(null);

  // Check if any filters are active
  const hasActiveFilters = useMemo(() => {
    return Object.entries(filters).some(([, v]) => v && v !== "" && v !== "all");
  }, [filters]);

  // Filter users
  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const search = (filters.search as string)?.toLowerCase() || "";
      const role = filters.role as string;
      const status = filters.status as string;

      if (search) {
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        if (!fullName.includes(search) && !email.includes(search)) return false;
      }

      if (role && role !== "all" && user.role !== role) return false;
      if (status && status !== "all") {
        if (status === "active" && !user.isActive) return false;
        if (status === "inactive" && user.isActive) return false;
      }

      return true;
    });
  }, [users, filters]);

  // Transform users to have string _id
  const usersWithStringId = useMemo(
    () =>
      filteredUsers.map((u) => ({
        ...u,
        _id: (u._id as unknown as { toString(): string }).toString(),
      })) as UserWithStringId[],
    [filteredUsers]
  );

  // Sorting
  const { sortedData, sortState, toggleSort } = useTableSort(usersWithStringId, tableColumns);

  // Pagination
  const {
    paginatedData,
    pagination,
    pageCount,
    canPreviousPage,
    canNextPage,
    goToPage,
    setPageSize,
  } = useTablePagination(sortedData, 10);

  // Selection
  const {
    selectedItems,
    selectedCount,
    isAllSelected,
    isIndeterminate,
    toggleAll,
    toggleRow,
    clearSelection,
    isSelected,
  } = useRowSelection(paginatedData);

  const bulkActions = useMemo(
    () => [
      {
        label: "Deactivate",
        icon: <UserX className="h-4 w-4" />,
        onClick: async (items: UserWithStringId[]) => {
          const ids = items.map((u) => u._id);
          const result = await bulkDeactivateUsers(ids);
          if (result.success) {
            toast.success(`${result.count} users deactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to deactivate users");
          }
        },
      },
      {
        label: "Reactivate",
        icon: <UserCheck className="h-4 w-4" />,
        onClick: async (items: UserWithStringId[]) => {
          const ids = items.map((u) => u._id);
          const result = await bulkReactivateUsers(ids);
          if (result.success) {
            toast.success(`${result.count} users reactivated`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to reactivate users");
          }
        },
      },
      {
        label: "Delete",
        icon: <Trash2 className="h-4 w-4" />,
        variant: "destructive" as const,
        onClick: async (items: UserWithStringId[]) => {
          const ids = items.map((u) => u._id);
          const result = await bulkDeleteUsers(ids);
          if (result.success) {
            toast.success(`${result.count} users deleted`);
            clearSelection();
            router.refresh();
          } else {
            toast.error(result.error || "Failed to delete users");
          }
        },
      },
    ],
    [clearSelection, router]
  );

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;

    setIsLoading(true);

    const userId = (
      selectedUser._id as unknown as { toString(): string }
    ).toString();

    let result;
    if (actionType === "deactivate") {
      result = await deactivateUser(userId);
    } else if (actionType === "reactivate") {
      result = await reactivateUser(userId);
    } else if (actionType === "delete") {
      result = await deleteUser(userId);
    }

    if (result?.success) {
      const messages = {
        deactivate: "User deactivated successfully",
        reactivate: "User reactivated successfully",
        delete: "User deleted successfully",
      };
      toast.success(messages[actionType]);
      router.refresh();
    } else {
      toast.error(result?.error || `Failed to ${actionType} user`);
    }

    setIsLoading(false);
    setSelectedUser(null);
    setActionType(null);
  };

  // Sortable header renderer
  const renderSortableHeader = (columnId: string, label: string) => {
    const column = tableColumns.find((c) => c.id === columnId);
    if (!column?.sortable) return label;

    const isSorted = sortState.column === columnId;
    const direction = isSorted ? sortState.direction : null;

    return (
      <Button
        variant="ghost"
        size="sm"
        className="-ml-3 h-8"
        onClick={() => toggleSort(columnId)}
      >
        {label}
        {direction === "asc" ? (
          <ArrowUp className="ml-2 h-4 w-4" />
        ) : direction === "desc" ? (
          <ArrowDown className="ml-2 h-4 w-4" />
        ) : (
          <ArrowUpDown className="ml-2 h-4 w-4 opacity-50" />
        )}
      </Button>
    );
  };

  if (users.length === 0) {
    return (
      <div className="text-muted-foreground py-8 text-center">
        No users found. Create your first user to get started.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <DataTableFilter
            filters={filterConfigs}
            values={filters}
            onChange={setFilters}
          />
          <div className="flex items-center gap-2">
            <FilterPresetsDropdown
              tableId="admin-users"
              currentFilters={filters}
              onApplyPreset={setFilters}
              hasActiveFilters={hasActiveFilters}
            />
            <DataExportButton
              data={sortedData}
              columns={exportColumns}
              filename="users"
              formats={["csv", "excel"]}
            />
          </div>
        </div>

        <BulkActionsBar
          selectedCount={selectedCount}
          totalCount={paginatedData.length}
          actions={bulkActions}
          selectedItems={selectedItems}
          onClearSelection={clearSelection}
        />

        {sortedData.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No users match your filters.
          </div>
        ) : (
          <>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">
                      <SelectAllCheckbox
                        checked={isAllSelected ? true : isIndeterminate ? "indeterminate" : false}
                        onCheckedChange={toggleAll}
                      />
                    </TableHead>
                    <TableHead>{renderSortableHeader("name", "User")}</TableHead>
                    <TableHead>{renderSortableHeader("email", "Email")}</TableHead>
                    <TableHead>{renderSortableHeader("role", "Role")}</TableHead>
                    <TableHead>{renderSortableHeader("status", "Status")}</TableHead>
                    <TableHead>{renderSortableHeader("createdAt", "Created")}</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((user) => (
                    <TableRow
                      key={user._id}
                      data-state={isSelected(user._id) ? "selected" : undefined}
                      className="transition-colors"
                    >
                      <TableCell>
                        <SelectRowCheckbox
                          checked={isSelected(user._id)}
                          onCheckedChange={(checked) => toggleRow(user._id, checked)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <UserAvatar
                            name={`${user.firstName} ${user.lastName}`}
                            image={user.profileImage}
                            size="sm"
                          />
                          <span className="font-medium">
                            {user.firstName} {user.lastName}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <RoleBadge
                          role={user.role as "admin" | "hod" | "professor" | "student"}
                          size="sm"
                        />
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.isActive ? "default" : "destructive"}>
                          {user.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground tabular-nums">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {user.role === "student" && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => setProfileDialogUser(user as unknown as IUser)}
                                >
                                  <UserCog className="mr-2 h-4 w-4" />
                                  Manage Profile
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {user.isActive ? (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user as unknown as IUser);
                                  setActionType("deactivate");
                                }}
                              >
                                <UserX className="mr-2 h-4 w-4" />
                                Deactivate
                              </DropdownMenuItem>
                            ) : (
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user as unknown as IUser);
                                  setActionType("reactivate");
                                }}
                              >
                                <UserCheck className="mr-2 h-4 w-4" />
                                Reactivate
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => {
                                setSelectedUser(user as unknown as IUser);
                                setActionType("delete");
                              }}
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
            </div>

            <PaginationControls
              pageIndex={pagination.pageIndex}
              pageSize={pagination.pageSize}
              pageCount={pageCount}
              totalItems={sortedData.length}
              canPreviousPage={canPreviousPage}
              canNextPage={canNextPage}
              onPageChange={goToPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
      </div>

      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === "delete"
                ? "Delete User"
                : actionType === "deactivate"
                  ? "Deactivate User"
                  : "Reactivate User"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === "delete"
                ? "This action cannot be undone. This will permanently delete the user from the system."
                : actionType === "deactivate"
                  ? "This will prevent the user from logging in. You can reactivate them later."
                  : "This will allow the user to log in again."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isLoading}
              className={
                actionType === "delete"
                  ? "bg-destructive hover:bg-destructive/90"
                  : ""
              }
            >
              {isLoading ? "Processing..." : "Confirm"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {profileDialogUser && (
        <StudentProfileDialog
          open={!!profileDialogUser}
          onOpenChange={(open) => !open && setProfileDialogUser(null)}
          userId={(
            profileDialogUser._id as unknown as { toString(): string }
          ).toString()}
          userName={`${profileDialogUser.firstName} ${profileDialogUser.lastName}`}
          courses={courses.map((c) => ({
            _id: (c._id as unknown as { toString(): string }).toString(),
            name: c.name,
            code: c.code,
          }))}
        />
      )}
    </>
  );
}
