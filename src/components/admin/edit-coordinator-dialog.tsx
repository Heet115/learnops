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
import { assignClassCoordinator } from '@/lib/actions/academic.actions';
import { toast } from 'sonner';

interface ClassCoordinator {
  _id: string;
  academicYear: string;
  classId: {
    _id: string;
    name: string;
    semesterId: {
      name: string;
      courseId: {
        code: string;
        departmentId: {
          code: string;
        };
      };
    };
  };
  professorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

interface Professor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface EditCoordinatorDialogProps {
  coordinator: ClassCoordinator;
  professors: Professor[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCoordinatorDialog({
  coordinator,
  professors,
  open,
  onOpenChange,
}: EditCoordinatorDialogProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      classId: coordinator.classId._id,
      professorId: formData.get('professorId') as string,
      academicYear: coordinator.academicYear,
    };

    const result = await assignClassCoordinator(data);

    if (result.success) {
      toast.success('Coordinator updated successfully');
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update coordinator');
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Change Class Coordinator</DialogTitle>
            <DialogDescription>
              Update the coordinator for this class
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Class</Label>
              <div className="rounded-md border px-3 py-2 text-sm bg-muted">
                {coordinator.classId?.semesterId?.courseId?.departmentId?.code} - {coordinator.classId?.semesterId?.courseId?.code} - {coordinator.classId?.semesterId?.name} - {coordinator.classId?.name}
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Academic Year</Label>
              <div className="rounded-md border px-3 py-2 text-sm bg-muted">
                {coordinator.academicYear}
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="professorId">New Coordinator</Label>
              <Select name="professorId" defaultValue={coordinator.professorId?._id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select professor" />
                </SelectTrigger>
                <SelectContent>
                  {professors.map((prof) => (
                    <SelectItem key={prof._id} value={prof._id}>
                      {prof.firstName} {prof.lastName} ({prof.email})
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
              {loading ? 'Updating...' : 'Update Coordinator'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
