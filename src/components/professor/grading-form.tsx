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
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Loader2,
  Award,
  MessageSquare,
  AlertTriangle,
} from "lucide-react";
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
      <Card className="border-emerald-500/30">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircle className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle className="text-emerald-600">Graded</CardTitle>
              <CardDescription>This submission has been graded</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-emerald-500/10">
              <Award className="h-8 w-8 text-emerald-600" />
            </div>
            <div>
              <p className="text-muted-foreground text-sm">Score</p>
              <p className="text-3xl font-bold text-emerald-600">
                {currentMarks}{" "}
                <span className="text-muted-foreground text-lg">
                  / {maxMarks}
                </span>
              </p>
            </div>
          </div>
          {currentFeedback && (
            <div className="bg-muted/30 rounded-lg border p-3">
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="text-muted-foreground h-4 w-4" />
                <p className="text-sm font-medium">Feedback</p>
              </div>
              <p className="text-muted-foreground text-sm">{currentFeedback}</p>
            </div>
          )}

          <Separator />

          <div>
            <p className="text-muted-foreground mb-3 text-sm">Update grade:</p>
            <form onSubmit={handleGrade} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="marks" className="flex items-center gap-2">
                    <Award className="text-muted-foreground h-4 w-4" />
                    Marks
                  </Label>
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
                <div className="flex items-end pb-2">
                  <span className="text-muted-foreground text-sm">
                    / {maxMarks}
                  </span>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="feedback" className="flex items-center gap-2">
                  <MessageSquare className="text-muted-foreground h-4 w-4" />
                  Feedback (optional)
                </Label>
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
      <Card className="border-red-500/30">
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-500/10">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-red-600">Rejected</CardTitle>
              <CardDescription>This submission was rejected</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-3">
            <div className="mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <p className="text-sm font-medium text-red-600">Reason</p>
            </div>
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
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <Award className="text-primary h-4 w-4" />
          </div>
          <div>
            <CardTitle>Grade Submission</CardTitle>
            <CardDescription>
              Review the work and provide a grade
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleGrade} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="marks" className="flex items-center gap-2">
                <Award className="text-muted-foreground h-4 w-4" />
                Marks
              </Label>
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
            <Label htmlFor="feedback" className="flex items-center gap-2">
              <MessageSquare className="text-muted-foreground h-4 w-4" />
              Feedback (optional)
            </Label>
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
                    <div className="flex items-center gap-2">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10">
                        <XCircle className="h-5 w-5 text-red-600" />
                      </div>
                      <div>
                        <DialogTitle>Reject Submission</DialogTitle>
                        <DialogDescription>
                          The student will be notified and can resubmit their
                          work.
                        </DialogDescription>
                      </div>
                    </div>
                  </DialogHeader>
                  <Separator className="my-4" />
                  <div className="grid gap-2">
                    <Label htmlFor="reason" className="flex items-center gap-2">
                      <AlertTriangle className="text-muted-foreground h-4 w-4" />
                      Reason for rejection
                    </Label>
                    <Textarea
                      id="reason"
                      name="reason"
                      placeholder="Explain why this submission is being rejected..."
                      rows={4}
                      required
                    />
                  </div>
                  <Separator className="my-4" />
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
