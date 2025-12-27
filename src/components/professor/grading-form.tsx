"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import {
  gradeSubmission,
  rejectSubmission,
} from "@/lib/actions/grading.actions";
import { toast } from "sonner";

interface GradingFormProps {
  submissionId: string;
  currentStatus: string;
  currentMarks?: number;
  currentFeedback?: string;
  currentRejectionReason?: string;
  maxMarks: number;
}

export function GradingForm({
  submissionId,
  currentStatus,
  currentMarks,
  currentFeedback,
  currentRejectionReason,
  maxMarks,
}: GradingFormProps) {
  const [grading, setGrading] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const router = useRouter();

  const handleGrade = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setGrading(true);

    const formData = new FormData(e.currentTarget);
    const marks = Number(formData.get("marks"));
    const feedback = formData.get("feedback") as string;

    if (marks < 0 || marks > maxMarks) {
      toast.error(`Marks must be between 0 and ${maxMarks}`);
      setGrading(false);
      return;
    }

    const result = await gradeSubmission(submissionId, { marks, feedback });

    if (result.success) {
      toast.success("Submission graded successfully");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to grade submission");
    }

    setGrading(false);
  };

  const handleReject = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setRejecting(true);

    const formData = new FormData(e.currentTarget);
    const reason = formData.get("reason") as string;

    if (!reason.trim()) {
      toast.error("Please provide a reason for rejection");
      setRejecting(false);
      return;
    }

    const result = await rejectSubmission(submissionId, reason);

    if (result.success) {
      toast.success("Submission rejected");
      setRejectDialogOpen(false);
      router.refresh();
    } else {
      toast.error(result.error || "Failed to reject submission");
    }

    setRejecting(false);
  };

  // Show current grade if already graded
  if (currentStatus === "graded") {
    return (
      <Card className="border-green-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-green-700">
            <CheckCircle className="h-5 w-5" />
            Graded
          </CardTitle>
          <CardDescription>This submission has been graded</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm font-medium">Score</p>
            <p className="text-3xl font-bold text-green-600">
              {currentMarks} / {maxMarks}
            </p>
          </div>
          {currentFeedback && (
            <div>
              <p className="text-sm font-medium">Feedback</p>
              <p className="text-muted-foreground text-sm">{currentFeedback}</p>
            </div>
          )}

          <div className="border-t pt-4">
            <p className="text-muted-foreground mb-3 text-sm">Update grade:</p>
            <form onSubmit={handleGrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="marks">Marks</Label>
                  <Input
                    id="marks"
                    name="marks"
                    type="number"
                    min={0}
                    max={maxMarks}
                    defaultValue={currentMarks}
                    required
                  />
                </div>
                <div className="flex items-end">
                  <span className="text-muted-foreground text-sm">
                    / {maxMarks}
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback">Feedback (optional)</Label>
                <Textarea
                  id="feedback"
                  name="feedback"
                  defaultValue={currentFeedback}
                  placeholder="Provide feedback to the student..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={grading}>
                {grading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  "Update Grade"
                )}
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show rejection reason if rejected
  if (currentStatus === "rejected") {
    return (
      <Card className="border-red-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-700">
            <XCircle className="h-5 w-5" />
            Rejected
          </CardTitle>
          <CardDescription>This submission was rejected</CardDescription>
        </CardHeader>
        <CardContent>
          <div>
            <p className="text-sm font-medium">Reason</p>
            <p className="text-muted-foreground text-sm">
              {currentRejectionReason}
            </p>
          </div>
          <p className="text-muted-foreground mt-4 text-sm">
            The student can resubmit their work.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Show grading form for pending submissions
  return (
    <Card>
      <CardHeader>
        <CardTitle>Grade Submission</CardTitle>
        <CardDescription>Review the work and provide a grade</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGrade} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="marks">Marks</Label>
              <Input
                id="marks"
                name="marks"
                type="number"
                min={0}
                max={maxMarks}
                placeholder="0"
                required
              />
            </div>
            <div className="flex items-end pb-2">
              <span className="text-muted-foreground text-sm">
                / {maxMarks}
              </span>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="feedback">Feedback (optional)</Label>
            <Textarea
              id="feedback"
              name="feedback"
              placeholder="Provide feedback to the student..."
              rows={3}
            />
          </div>

          <div className="flex gap-3">
            <Button type="submit" disabled={grading} className="flex-1">
              {grading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Grading...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Grade Submission
                </>
              )}
            </Button>

            <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
              <DialogTrigger asChild>
                <Button type="button" variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Reject
                </Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleReject}>
                  <DialogHeader>
                    <DialogTitle>Reject Submission</DialogTitle>
                    <DialogDescription>
                      The student will be notified and can resubmit their work.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="py-4">
                    <Label htmlFor="reason">Reason for rejection</Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Explain why this submission is being rejected..."
                      rows={4}
                      required
                      className="mt-2"
                    />
                  </div>
                  <DialogFooter>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setRejectDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="destructive"
                      disabled={rejecting}
                    >
                      {rejecting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Rejecting...
                        </>
                      ) : (
                        "Reject Submission"
                      )}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
