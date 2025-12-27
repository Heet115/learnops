'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { assignStudentToClass } from '@/lib/actions/user.actions';
import { toast } from 'sonner';

interface Student {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  classId?: {
    _id: string;
    name: string;
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

interface ChangeClassDialogProps {
  student: Student;
  classes: ClassItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ChangeClassDialog({
  student,
  classes,
  open,
  onOpenChange,
}: ChangeClassDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const classId = formData.get('classId') as string;

    const result = await assignStudentToClass(student._id, classId);

    if (result.success) {
      toast.success('Student class updated successfully');
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update student class');
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {student.classId ? 'Change Class' : 'Assign Class'}
            </DialogTitle>
            <DialogDescription>
              {student.classId
                ? `Change class for ${student.firstName} ${student.lastName}`
                : `Assign ${student.firstName} ${student.lastName} to a class`}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Student</Label>
              <p className="text-sm text-muted-foreground">
                {student.firstName} {student.lastName} ({student.email})
              </p>
            </div>

            {student.classId && (
              <div className="grid gap-2">
                <Label>Current Class</Label>
                <p className="text-sm text-muted-foreground">{student.classId.name}</p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="classId">New Class</Label>
              <Select name="classId" defaultValue={student.classId?._id} required>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {classes.map((classItem) => (
                    <SelectItem key={classItem._id} value={classItem._id}>
                      {classItem.semesterId?.courseId?.departmentId?.code} -{' '}
                      {classItem.semesterId?.courseId?.code} -{' '}
                      {classItem.semesterId?.name} - {classItem.name} ({classItem.academicYear})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
