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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { updateSubject } from '@/lib/actions/academic.actions';
import { toast } from 'sonner';

interface Subject {
  _id: string;
  name: string;
  code: string;
  credits: number;
  isActive: boolean;
  semesterId: {
    _id: string;
    name: string;
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

interface EditSubjectDialogProps {
  subject: Subject;
  semesters: Semester[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditSubjectDialog({
  subject,
  semesters,
  open,
  onOpenChange,
}: EditSubjectDialogProps) {
  const [loading, setLoading] = useState(false);
  const [isActive, setIsActive] = useState(subject.isActive);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      semesterId: formData.get('semesterId') as string,
      credits: parseInt(formData.get('credits') as string, 10),
      isActive,
    };

    const result = await updateSubject(subject._id, data);

    if (result.success) {
      toast.success('Subject updated successfully');
      onOpenChange(false);
      router.refresh();
    } else {
      toast.error(result.error || 'Failed to update subject');
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Edit Subject</DialogTitle>
            <DialogDescription>
              Update subject details
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Subject Name</Label>
              <Input
                id="name"
                name="name"
                defaultValue={subject.name}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="code">Subject Code</Label>
              <Input
                id="code"
                name="code"
                defaultValue={subject.code}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="semesterId">Semester</Label>
              <Select name="semesterId" defaultValue={subject.semesterId._id}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  {semesters.map((semester) => (
                    <SelectItem key={semester._id} value={semester._id}>
                      {semester.courseId.departmentId.code} - {semester.courseId.code} - {semester.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="credits">Credits</Label>
              <Select name="credits" defaultValue={subject.credits.toString()}>
                <SelectTrigger>
                  <SelectValue placeholder="Select credits" />
                </SelectTrigger>
                <SelectContent>
                  {[1, 2, 3, 4, 5, 6].map((credit) => (
                    <SelectItem key={credit} value={credit.toString()}>
                      {credit} {credit === 1 ? 'Credit' : 'Credits'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="isActive">Active</Label>
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
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
