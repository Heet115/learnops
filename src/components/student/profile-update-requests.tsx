"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, CheckCircle, XCircle, FileEdit } from "lucide-react";

interface RequestedChange {
  fieldKey: string;
  fieldLabel: string;
  currentValue: string | null;
  requestedValue: string;
}

interface UpdateRequest {
  _id: string;
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

interface ProfileUpdateRequestsProps {
  requests: UpdateRequest[];
}

const statusConfig = {
  pending: {
    label: "Pending",
    className: "border-amber-500/30 bg-amber-500/10 text-amber-600",
    dotColor: "bg-amber-500",
    icon: Clock,
  },
  approved: {
    label: "Approved",
    className: "border-emerald-500/30 bg-emerald-500/10 text-emerald-600",
    dotColor: "bg-emerald-500",
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    className: "border-rose-500/30 bg-rose-500/10 text-rose-600",
    dotColor: "bg-rose-500",
    icon: XCircle,
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

export function ProfileUpdateRequests({
  requests,
}: ProfileUpdateRequestsProps) {
  if (requests.length === 0) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <FileEdit className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium">No update requests</p>
            <p className="text-muted-foreground text-sm">
              Click &quot;Request Update&quot; on your profile to submit a
              change request.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 flex h-8 w-8 items-center justify-center rounded-lg">
            <FileEdit className="text-primary h-4 w-4" />
          </div>
          <div>
            <CardTitle>Your Update Requests</CardTitle>
            <CardDescription>{requests.length} request(s)</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        <Accordion type="single" collapsible className="w-full">
          {requests.map((request) => {
            const status = statusConfig[request.requestStatus];
            const StatusIcon = status.icon;

            return (
              <AccordionItem key={request._id} value={request._id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${status.className.split(" ").slice(0, 2).join(" ")}`}
                    >
                      <StatusIcon className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <span className="font-medium">
                        {request.requestedChanges.length} field
                        {request.requestedChanges.length > 1 ? "s" : ""}{" "}
                        requested
                      </span>
                      <span className="text-muted-foreground ml-2 text-sm">
                        {formatDate(request.requestedAt)}
                      </span>
                    </div>
                    <Badge variant="outline" className={status.className}>
                      <span
                        className={`mr-1.5 inline-block h-1.5 w-1.5 rounded-full ${status.dotColor}`}
                      />
                      {status.label}
                    </Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Requested Changes */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Requested Changes:
                      </h4>
                      <div className="rounded-lg border">
                        {request.requestedChanges.map((change, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col gap-1 border-b p-3 last:border-b-0 sm:flex-row sm:items-center sm:gap-4"
                          >
                            <span className="min-w-[140px] text-sm font-medium">
                              {change.fieldLabel}
                            </span>
                            <div className="flex items-center gap-2 text-sm">
                              <span className="text-muted-foreground line-through">
                                {change.currentValue || "(empty)"}
                              </span>
                              <span>→</span>
                              <span className="font-medium text-emerald-600">
                                {change.requestedValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Info */}
                    {request.requestStatus !== "pending" && (
                      <div className="bg-muted/30 space-y-2 rounded-lg border p-3">
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-muted-foreground">
                            Reviewed by:
                          </span>
                          <span className="font-medium">
                            {request.reviewedBy
                              ? `${request.reviewedBy.firstName} ${request.reviewedBy.lastName}`
                              : "Admin"}
                          </span>
                        </div>
                        {request.reviewedAt && (
                          <div className="flex items-center gap-2 text-sm">
                            <span className="text-muted-foreground">
                              Reviewed on:
                            </span>
                            <span>{formatDate(request.reviewedAt)}</span>
                          </div>
                        )}
                        {request.reviewComment && (
                          <div className="text-sm">
                            <span className="text-muted-foreground">
                              Comment:{" "}
                            </span>
                            <span>{request.reviewComment}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </CardContent>
    </Card>
  );
}
