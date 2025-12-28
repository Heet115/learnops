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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { reviewProfileUpdateRequest } from "@/lib/actions/student-profile.actions";
import { Check, X, Eye, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface RequestedChange {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string | null;
  requestedValue: string;
}

interface UpdateRequest {
  _id: string;
  requestedBy: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  requestedChanges: RequestedChange[];
  requestStatus: "pending" | "approved" | "rejected";
  reviewedBy?: {
    firstName: string;
    lastName: string;
  };
  reviewComment?: string;
  requestedAt: string;
  reviewedAt?: string;
}

interface ProfileRequestsTableProps {
  requests: UpdateRequest[];
}

const statusConfig = {
  pending: { label: "Pending", variant: "outline" as const },
  approved: { label: "Approved", variant: "default" as const },
  rejected: { label: "Rejected", variant: "destructive" as const },
};

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ProfileRequestsTable({ requests }: ProfileRequestsTableProps) {
  const router = useRouter();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedRequest, setSelectedRequest] = useState<UpdateRequest | null>(
    null,
  );
  const [reviewComment, setReviewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((r) => r.requestStatus === statusFilter);
  }, [requests, statusFilter]);

  const pendingCount = requests.filter(
    (r) => r.requestStatus === "pending",
  ).length;

  const handleReview = async (action: "approve" | "reject") => {
    if (!selectedRequest) return;
    setIsLoading(true);

    const result = await reviewProfileUpdateRequest({
      requestId: selectedRequest._id,
      action,
      reviewComment: reviewComment || undefined,
    });

    if (result.success) {
      toast.success(
        action === "approve"
          ? "Request approved and profile updated"
          : "Request rejected",
      );
      setSelectedRequest(null);
      setReviewComment("");
      router.refresh();
    } else {
      toast.error(result.error || "Failed to process request");
    }

    setIsLoading(false);
  };

  if (requests.length === 0) {
    return (
      <div className="text-muted-foreground rounded-lg border py-8 text-center">
        No profile update requests found.
      </div>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Requests</SelectItem>
                <SelectItem value="pending">
                  Pending ({pendingCount})
                </SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {pendingCount > 0 && (
            <Badge variant="secondary">{pendingCount} pending</Badge>
          )}
        </div>

        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Student</TableHead>
                <TableHead>Fields</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-[100px]">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRequests.map((request) => (
                <TableRow key={request._id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {request.requestedBy.firstName}{" "}
                        {request.requestedBy.lastName}
                      </p>
                      <p className="text-muted-foreground text-sm">
                        {request.requestedBy.email}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1">
                      {request.requestedChanges.map((change, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs">
                          {change.fieldLabel}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">
                    {formatDate(request.requestedAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={statusConfig[request.requestStatus].variant}
                    >
                      {statusConfig[request.requestStatus].label}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedRequest(request)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      View
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Review Dialog */}
      <Dialog
        open={!!selectedRequest}
        onOpenChange={() => {
          setSelectedRequest(null);
          setReviewComment("");
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Review Profile Update Request</DialogTitle>
            <DialogDescription>
              {selectedRequest?.requestedBy.firstName}{" "}
              {selectedRequest?.requestedBy.lastName} (
              {selectedRequest?.requestedBy.email})
            </DialogDescription>
          </DialogHeader>

          {selectedRequest && (
            <div className="space-y-4">
              {/* Requested Changes */}
              <div className="space-y-2">
                <Label>Requested Changes</Label>
                <div className="divide-y rounded-md border">
                  {selectedRequest.requestedChanges.map((change, idx) => (
                    <div key={idx} className="space-y-1 p-3">
                      <p className="text-sm font-medium">{change.fieldLabel}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground">
                          {change.currentValue || "(empty)"}
                        </span>
                        <span>→</span>
                        <span className="text-primary font-medium">
                          {change.requestedValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Info for reviewed requests */}
              {selectedRequest.requestStatus !== "pending" && (
                <div className="bg-muted space-y-1 rounded-md p-3 text-sm">
                  <p>
                    <span className="text-muted-foreground">Status: </span>
                    <Badge
                      variant={
                        statusConfig[selectedRequest.requestStatus].variant
                      }
                    >
                      {statusConfig[selectedRequest.requestStatus].label}
                    </Badge>
                  </p>
                  {selectedRequest.reviewedBy && (
                    <p>
                      <span className="text-muted-foreground">
                        Reviewed by:{" "}
                      </span>
                      {selectedRequest.reviewedBy.firstName}{" "}
                      {selectedRequest.reviewedBy.lastName}
                    </p>
                  )}
                  {selectedRequest.reviewedAt && (
                    <p>
                      <span className="text-muted-foreground">
                        Reviewed on:{" "}
                      </span>
                      {formatDate(selectedRequest.reviewedAt)}
                    </p>
                  )}
                  {selectedRequest.reviewComment && (
                    <p>
                      <span className="text-muted-foreground">Comment: </span>
                      {selectedRequest.reviewComment}
                    </p>
                  )}
                </div>
              )}

              {/* Review Form for pending requests */}
              {selectedRequest.requestStatus === "pending" && (
                <div className="space-y-2">
                  <Label htmlFor="comment">Comment (optional)</Label>
                  <Textarea
                    id="comment"
                    placeholder="Add a comment for the student..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {selectedRequest?.requestStatus === "pending" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReview("reject")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <X className="mr-1 h-4 w-4" />
                      Reject
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => handleReview("approve")}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="mr-1 h-4 w-4" />
                      Approve
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button
                variant="outline"
                onClick={() => setSelectedRequest(null)}
              >
                Close
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
