'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { deactivateUser, reactivateUser, deleteUser } from '@/lib/actions/admin.actions';
import { MoreHorizontal, UserX, UserCheck, Trash2 } from 'lucide-react';
import { IUser } from '@/lib/db';

interface UsersTableProps {
  users: IUser[];
}

const roleBadgeVariant = {
  admin: 'default',
  hod: 'secondary',
  professor: 'outline',
  student: 'outline',
} as const;

export function UsersTable({ users }: UsersTableProps) {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState<IUser | null>(null);
  const [actionType, setActionType] = useState<'deactivate' | 'reactivate' | 'delete' | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleAction = async () => {
    if (!selectedUser || !actionType) return;
    
    setIsLoading(true);
    
    const userId = (selectedUser._id as unknown as { toString(): string }).toString();
    
    if (actionType === 'deactivate') {
      await deactivateUser(userId);
    } else if (actionType === 'reactivate') {
      await reactivateUser(userId);
    } else if (actionType === 'delete') {
      await deleteUser(userId);
    }
    
    setIsLoading(false);
    setSelectedUser(null);
    setActionType(null);
    router.refresh();
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
  };

  if (users.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No users found. Create your first user to get started.
      </div>
    );
  }

  return (
    <>
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
          {users.map((user) => (
            <TableRow key={(user._id as unknown as { toString(): string }).toString()}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profileImage} />
                    <AvatarFallback>{getInitials(user.firstName, user.lastName)}</AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{user.firstName} {user.lastName}</span>
                </div>
              </TableCell>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Badge variant={roleBadgeVariant[user.role]}>
                  {user.role.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'default' : 'destructive'}>
                  {user.isActive ? 'Active' : 'Inactive'}
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
                          setActionType('deactivate');
                        }}
                      >
                        <UserX className="mr-2 h-4 w-4" />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem
                        onClick={() => {
                          setSelectedUser(user);
                          setActionType('reactivate');
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
                        setActionType('delete');
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

      <AlertDialog open={!!actionType} onOpenChange={() => setActionType(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {actionType === 'delete' ? 'Delete User' : 
               actionType === 'deactivate' ? 'Deactivate User' : 'Reactivate User'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {actionType === 'delete' 
                ? 'This action cannot be undone. This will permanently delete the user from the system.'
                : actionType === 'deactivate'
                ? 'This will prevent the user from logging in. You can reactivate them later.'
                : 'This will allow the user to log in again.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleAction}
              disabled={isLoading}
              className={actionType === 'delete' ? 'bg-destructive hover:bg-destructive/90' : ''}
            >
              {isLoading ? 'Processing...' : 'Confirm'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
