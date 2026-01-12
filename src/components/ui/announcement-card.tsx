"use client";

import { useState } from "react";
import { format, formatDistanceToNow } from "date-fns";
import {
  Eye,
  EyeOff,
  Trash2,
  MoreHorizontal,
  Pencil,
  Clock,
  User,
  Target,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

export interface AnnouncementData {
  _id: string;
  title: string;
  message: string;
  priority: "low" | "normal" | "high" | "urgent";
  isPublished: boolean;
  isActive: boolean;
  targetType: string;
  targetId?: string;
  targetName?: string;
  createdBy: {
    _id?: string;
    firstName: string;
    lastName: string;
    role: string;
    email?: string;
  };
  createdByRole: string;
  createdAt: string;
  expiresAt?: string;
  publishAt?: string;
}

interface AnnouncementCardProps {
  announcement: AnnouncementData;
  canEdit?: boolean;
  canDelete?: boolean;
  canTogglePublish?: boolean;
  onEdit?: (announcement: AnnouncementData) => void;
  onDelete?: (id: string) => void;
  onTogglePublish?: (id: string) => void;
  showAuthor?: boolean;
}

const priorityConfig = {
  low: {
    color: "bg-slate-500/10 text-slate-600 border-slate-500/30",
    bgColor: "bg-slate-500",
    icon: null,
  },
  normal: {
    color: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    bgColor: "bg-blue-500",
    icon: null,
  },
  high: {
    color: "bg-amber-500/10 text-amber-600 border-amber-500/30",
    bgColor: "bg-amber-500",
    icon: AlertTriangle,
  },
  urgent: {
    color: "bg-rose-500/10 text-rose-600 border-rose-500/30",
    bgColor: "bg-rose-500",
    icon: AlertTriangle,
  },
};

export function AnnouncementCard({
  announcement,
  canEdit = false,
  canDelete = false,
  canTogglePublish = false,
  onEdit,
  onDelete,
  onTogglePublish,
  showAuthor = true,
}: AnnouncementCardProps) {
  const [viewOpen, setViewOpen] = useState(false);
  const priority = priorityConfig[announcement.priority];
  const PriorityIcon = priority.icon;

  const isExpired =
    announcement.expiresAt && new Date(announcement.expiresAt) < new Date();

  return (
    <>
      <Card
        className={cn(
          "relative transition-all hover:shadow-md",
          !announcement.isActive && "opacity-60",
          !announcement.isPublished &&
            "border-muted-foreground/30 border-dashed",
          announcement.priority === "urgent" && "border-rose-500/30",
          announcement.priority === "high" && "border-amber-500/30",
        )}
      >
        {/* Priority indicator bar */}
        <div
          className={cn(
            "absolute top-0 bottom-0 left-0 w-1 rounded-l-lg",
            priority.bgColor,
          )}
        />

        <CardHeader className="pb-2 pl-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                {!announcement.isPublished && (
                  <Badge variant="secondary" className="gap-1">
                    <EyeOff className="h-3 w-3" />
                    Draft
                  </Badge>
                )}
                <Badge variant="outline" className={priority.color}>
                  {PriorityIcon && <PriorityIcon className="mr-1 h-3 w-3" />}
                  {announcement.priority}
                </Badge>
                <Badge
                  variant="outline"
                  className="border-violet-500/30 bg-violet-500/10 text-violet-600"
                >
                  <Target className="mr-1 h-3 w-3" />
                  {announcement.targetName || announcement.targetType}
                </Badge>
                {!announcement.isActive && (
                  <Badge variant="secondary">Inactive</Badge>
                )}
                {isExpired && (
                  <Badge
                    variant="outline"
                    className="border-rose-500/30 bg-rose-500/10 text-rose-600"
                  >
                    Expired
                  </Badge>
                )}
              </div>
              <h3 className="text-lg leading-tight font-semibold">
                {announcement.title}
              </h3>
            </div>

            {(canEdit || canDelete || canTogglePublish) && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setViewOpen(true)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  {canTogglePublish && onTogglePublish && (
                    <DropdownMenuItem
                      onClick={() => onTogglePublish(announcement._id)}
                    >
                      {announcement.isPublished ? (
                        <>
                          <EyeOff className="mr-2 h-4 w-4" />
                          Unpublish
                        </>
                      ) : (
                        <>
                          <Eye className="mr-2 h-4 w-4" />
                          Publish
                        </>
                      )}
                    </DropdownMenuItem>
                  )}
                  {canEdit && onEdit && (
                    <DropdownMenuItem onClick={() => onEdit(announcement)}>
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </DropdownMenuItem>
                  )}
                  {(canEdit || canDelete) && <DropdownMenuSeparator />}
                  {canDelete && onDelete && (
                    <DropdownMenuItem
                      className="text-destructive focus:text-destructive"
                      onClick={() => onDelete(announcement._id)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </CardHeader>

        <CardContent className="pl-5">
          <p className="text-muted-foreground line-clamp-2 text-sm whitespace-pre-wrap">
            {announcement.message}
          </p>

          <div className="text-muted-foreground mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
            {showAuthor && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {announcement.createdBy.firstName}{" "}
                {announcement.createdBy.lastName}
                <Badge
                  variant="outline"
                  className="ml-1 px-1.5 py-0 text-[10px]"
                >
                  {announcement.createdByRole}
                </Badge>
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {formatDistanceToNow(new Date(announcement.createdAt), {
                addSuffix: true,
              })}
            </span>
            {announcement.expiresAt && (
              <span
                className={cn(
                  "flex items-center gap-1",
                  isExpired && "text-rose-500",
                )}
              >
                Expires:{" "}
                {format(new Date(announcement.expiresAt), "MMM d, yyyy")}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {/* View Details Dialog */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[80vh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <div className="mb-2 flex items-center gap-2">
              {!announcement.isPublished && (
                <Badge variant="secondary" className="gap-1">
                  <EyeOff className="h-3 w-3" />
                  Draft
                </Badge>
              )}
              <Badge variant="outline" className={priority.color}>
                {announcement.priority}
              </Badge>
              <Badge
                variant="outline"
                className="border-violet-500/30 bg-violet-500/10 text-violet-600"
              >
                {announcement.targetName || announcement.targetType}
              </Badge>
            </div>
            <DialogTitle className="text-xl">{announcement.title}</DialogTitle>
            <DialogDescription asChild>
              <div className="flex items-center gap-3 text-sm">
                <span>
                  By {announcement.createdBy.firstName}{" "}
                  {announcement.createdBy.lastName}
                </span>
                <span>•</span>
                <span>
                  {format(
                    new Date(announcement.createdAt),
                    "MMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </div>
            </DialogDescription>
          </DialogHeader>

          <Separator />

          <div className="py-4">
            <p className="text-sm leading-relaxed whitespace-pre-wrap">
              {announcement.message}
            </p>
          </div>

          {announcement.expiresAt && (
            <>
              <Separator />
              <div className="text-muted-foreground flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4" />
                <span>
                  {isExpired ? "Expired on" : "Expires on"}{" "}
                  {format(
                    new Date(announcement.expiresAt),
                    "MMMM d, yyyy 'at' h:mm a",
                  )}
                </span>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
