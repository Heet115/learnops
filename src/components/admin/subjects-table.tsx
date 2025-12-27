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
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { deleteSubject } from '@/lib/actions/academic.actions';
import { toast } from 'sonner';
import { EditSubjectDialog } from './edit-subject-dialog';

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
  const router = useRouter();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}"?`)) return;

    const result = await deleteSubject(id);
    if (result.success) {
      toast.success('Subject deleted successfully');
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to delete subject');
    }
  };

  if (subjects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No subjects found. Create your first subject to get started.
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
            <TableHead>Semester</TableHead>
            <TableHead>Course</TableHead>
            <TableHead>Department</TableHead>
            <TableHead>Credits</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-[70px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {subjects.map((subject) => (
            <TableRow key={subject._id}>
              <TableCell className="font-medium">{subject.code}</TableCell>
              <TableCell>{subject.name}</TableCell>
              <TableCell>{subject.semesterId?.name || 'N/A'}</TableCell>
              <TableCell>
                {subject.semesterId?.courseId?.name || 'N/A'} ({subject.semesterId?.courseId?.code || ''})
              </TableCell>
              <TableCell>{subject.semesterId?.courseId?.departmentId?.code || 'N/A'}</TableCell>
              <TableCell>{subject.credits}</TableCell>
              <TableCell>
                <Badge variant={subject.isActive ? 'default' : 'secondary'}>
                  {subject.isActive ? 'Active' : 'Inactive'}
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
                    <DropdownMenuItem onClick={() => setEditingSubject(subject)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      className="text-destructive"
                      onClick={() => handleDelete(subject._id, subject.name)}
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

      {editingSubject && (
        <EditSubjectDialog
          subject={editingSubject}
          semesters={semesters}
          open={!!editingSubject}
          onOpenChange={(open) => !open && setEditingSubject(null)}
        />
      )}
    </>
  );
}
