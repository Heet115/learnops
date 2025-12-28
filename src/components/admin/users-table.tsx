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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DataTableFilter,
  FilterConfig,
  FilterValue,
} from "@/components/ui/data-table-filter";
import {
  deactivateUser,
  reactivateUser,
  deleteUser,
} from "@/lib/actions/admin.actions";
import { MoreHorizontal, UserX, UserCheck, Trash2 } from "lucide-react";
import { IUser } from "@/lib/db";
import { toast } from "sonner";

interface UsersTableProps {
  users: IUser[];
}

const roleBadgeVariant = {
  admin: "default",
  hod: "secondary",
  professor: "outline",
  student: "outline",
} as const;

const filterConfigs: FilterConfig[] = [
  { key: "search", label: "Search", type: "text", placeholder: "Search by name or email..." },
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

export function UsersTable({ users }: UsersTableProps) {
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

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ""}${lastName[0] || ""}`.toUpperCase();
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
        <DataTableFilter
          filters={filterConfigs}
          values={filters}
          onChange={setFilters}
        />

        {filteredUsers.length === 0 ? (
          <div className="text-muted-foreground py-8 text-center">
            No users match your filters.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Created</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user) => (
                <TableRow
                  key={(user._id as unknown as { toString(): string }).toString()}
                >
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.profileImage} />
                        <AvatarFallback>
                          {getInitials(user.firstName, user.lastName)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="font-medium">
                        {user.firstName} {user.lastName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Badge variant={roleBadgeVariant[user.role]}>
                      {user.role.toUpperCase()}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isActive ? "default" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
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
                        {user.isActive ? (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
                              setActionType("deactivate");
                            }}
                          >
                            <UserX className="mr-2 h-4 w-4" />
                            Deactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedUser(user);
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
                            setSelectedUser(user);
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
    </>
  );
}
