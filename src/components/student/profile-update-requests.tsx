"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Clock, CheckCircle, XCircle } from "lucide-react";

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
    variant: "outline" as const,
    icon: Clock,
  },
  approved: {
    label: "Approved",
    variant: "default" as const,
    icon: CheckCircle,
  },
  rejected: {
    label: "Rejected",
    variant: "destructive" as const,
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
        <CardContent className="py-8 text-center">
          <p className="text-muted-foreground">
            No update requests yet. Click &quot;Request Update&quot; on your
            profile to submit a change request.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Update Requests</CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          {requests.map((request) => {
            const status = statusConfig[request.requestStatus];
            const StatusIcon = status.icon;

            return (
              <AccordionItem key={request._id} value={request._id}>
                <AccordionTrigger className="hover:no-underline">
                  <div className="flex items-center gap-3 text-left">
                    <StatusIcon className="h-4 w-4 shrink-0" />
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
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </div>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-4 pt-2">
                    {/* Requested Changes */}
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium">
                        Requested Changes:
                      </h4>
                      <div className="rounded-md border">
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
                              <span className="text-primary font-medium">
                                {change.requestedValue}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Review Info */}
                    {request.requestStatus !== "pending" && (
                      <div className="bg-muted space-y-2 rounded-md p-3">
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
