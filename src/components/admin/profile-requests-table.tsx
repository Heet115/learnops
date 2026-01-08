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
import { Separator } from "@/components/ui/separator";
import {
  useSimpleSort,
  useTablePagination,
  SimpleSortableHeader,
  PaginationControls,
} from "@/components/ui/enhanced-data-table";
import { reviewProfileUpdateRequest } from "@/lib/actions/student-profile.actions";
import {
  Check,
  X,
  Eye,
  Loader2,
  User,
  FileEdit,
  Clock,
  Calendar,
  MessageSquare,
  ArrowRight,
} from "lucide-react";
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
  pending: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    dotColor: "bg-amber-500",
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    dotColor: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    className: "border-red-500/30 bg-red-500/10 text-red-600",
    dotColor: "bg-red-500",
  },
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

  const { sortedData, sortKey, sortDirection, handleSort } = useSimpleSort(
    filteredRequests,
    "requestedAt" as keyof UpdateRequest,
    "desc",
  );

  const {
    paginatedData,
    currentPage,
    pageSize,
    totalPages,
    setCurrentPage,
    setPageSize,
  } = useTablePagination(sortedData);

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
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="bg-muted flex h-14 w-14 items-center justify-center rounded-full">
          <FileEdit className="text-muted-foreground h-7 w-7" />
        </div>
        <h3 className="mt-4 text-lg font-medium">No requests found</h3>
        <p className="text-muted-foreground mt-1 text-sm">
          Profile update requests will appear here.
        </p>
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
            <Badge
              variant="outline"
              className="border-amber-500/30 bg-amber-500/10 text-amber-600"
            >
              <Clock className="mr-1 h-3 w-3" />
              {pendingCount} pending
            </Badge>
          )}
        </div>

        {filteredRequests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <FileEdit className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No requests match your filter.
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead>Student</TableHead>
                    <TableHead>Fields</TableHead>
                    <SimpleSortableHeader<UpdateRequest>
                      label="Requested"
                      sortKey="requestedAt"
                      currentSortKey={sortKey}
                      sortDirection={sortDirection}
                      onSort={handleSort}
                    />
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((request) => (
                    <TableRow key={request._id} className="group">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-500/10">
                            <User className="h-4 w-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium">
                              {request.requestedBy.firstName}{" "}
                              {request.requestedBy.lastName}
                            </p>
                            <p className="text-muted-foreground text-xs">
                              {request.requestedBy.email}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {request.requestedChanges.map((change, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {change.fieldLabel}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-muted-foreground flex items-center gap-1.5 text-sm">
                          <Calendar className="h-3.5 w-3.5" />
                          {formatDate(request.requestedAt)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            statusConfig[request.requestStatus].className
                          }
                        >
                          <span
                            className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusConfig[request.requestStatus].dotColor}`}
                          />
                          {statusConfig[request.requestStatus].label}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedRequest(request)}
                          className="opacity-0 transition-opacity group-hover:opacity-100"
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
            <PaginationControls
              pageIndex={currentPage}
              pageSize={pageSize}
              pageCount={totalPages}
              totalItems={filteredRequests.length}
              canPreviousPage={currentPage > 0}
              canNextPage={currentPage < totalPages - 1}
              onPageChange={setCurrentPage}
              onPageSizeChange={setPageSize}
            />
          </>
        )}
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
            <div className="flex items-center gap-3">
              <div className="bg-primary/10 flex h-10 w-10 items-center justify-center rounded-full">
                <FileEdit className="text-primary h-5 w-5" />
              </div>
              <div>
                <DialogTitle>Review Profile Update Request</DialogTitle>
                <DialogDescription>
                  {selectedRequest?.requestedBy.firstName}{" "}
                  {selectedRequest?.requestedBy.lastName} (
                  {selectedRequest?.requestedBy.email})
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <Separator className="my-2" />

          {selectedRequest && (
            <div className="space-y-4">
              {/* Requested Changes */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <FileEdit className="text-muted-foreground h-3.5 w-3.5" />
                  Requested Changes
                </Label>
                <div className="divide-y rounded-lg border">
                  {selectedRequest.requestedChanges.map((change, idx) => (
                    <div key={idx} className="space-y-1 p-3">
                      <p className="text-sm font-medium">{change.fieldLabel}</p>
                      <div className="flex items-center gap-2 text-sm">
                        <span className="text-muted-foreground bg-muted rounded px-2 py-0.5">
                          {change.currentValue || "(empty)"}
                        </span>
                        <ArrowRight className="text-muted-foreground h-3.5 w-3.5" />
                        <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-medium text-emerald-600">
                          {change.requestedValue}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Status Info for reviewed requests */}
              {selectedRequest.requestStatus !== "pending" && (
                <div className="bg-muted/50 space-y-2 rounded-lg border p-3 text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Status:</span>
                    <Badge
                      variant="outline"
                      className={
                        statusConfig[selectedRequest.requestStatus].className
                      }
                    >
                      <span
                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${statusConfig[selectedRequest.requestStatus].dotColor}`}
                      />
                      {statusConfig[selectedRequest.requestStatus].label}
                    </Badge>
                  </div>
                  {selectedRequest.reviewedBy && (
                    <div className="flex items-center gap-2">
                      <User className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-muted-foreground">
                        Reviewed by:
                      </span>
                      {selectedRequest.reviewedBy.firstName}{" "}
                      {selectedRequest.reviewedBy.lastName}
                    </div>
                  )}
                  {selectedRequest.reviewedAt && (
                    <div className="flex items-center gap-2">
                      <Calendar className="text-muted-foreground h-3.5 w-3.5" />
                      <span className="text-muted-foreground">
                        Reviewed on:
                      </span>
                      {formatDate(selectedRequest.reviewedAt)}
                    </div>
                  )}
                  {selectedRequest.reviewComment && (
                    <div className="flex items-start gap-2">
                      <MessageSquare className="text-muted-foreground mt-0.5 h-3.5 w-3.5" />
                      <span className="text-muted-foreground">Comment:</span>
                      <span>{selectedRequest.reviewComment}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Review Form for pending requests */}
              {selectedRequest.requestStatus === "pending" && (
                <div className="space-y-2">
                  <Label htmlFor="comment" className="flex items-center gap-2">
                    <MessageSquare className="text-muted-foreground h-3.5 w-3.5" />
                    Comment (optional)
                  </Label>
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

          <Separator className="my-2" />
          <DialogFooter>
            {selectedRequest?.requestStatus === "pending" ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => handleReview("reject")}
                  disabled={isLoading}
                  className="border-red-500/30 text-red-600 hover:bg-red-500/10"
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
