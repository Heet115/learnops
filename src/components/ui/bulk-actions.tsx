"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronDown, X } from "lucide-react";

export interface BulkAction<T> {
  label: string;
  icon?: React.ReactNode;
  onClick: (selectedItems: T[]) => void | Promise<void>;
  variant?: "default" | "destructive";
  disabled?: boolean;
}

interface BulkActionsBarProps<T> {
  selectedCount: number;
  totalCount: number;
  actions: BulkAction<T>[];
  selectedItems: T[];
  onClearSelection: () => void;
  className?: string;
}

export function BulkActionsBar<T>({
  selectedCount,
  totalCount,
  actions,
  selectedItems,
  onClearSelection,
  className,
}: BulkActionsBarProps<T>) {
  const [isLoading, setIsLoading] = React.useState(false);

  if (selectedCount === 0) return null;

  const handleAction = async (action: BulkAction<T>) => {
    if (action.disabled) return;
    setIsLoading(true);
    try {
      await action.onClick(selectedItems);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={cn(
        "bg-muted/50 flex items-center justify-between rounded-lg border px-4 py-2",
        className
      )}
    >
      <div className="flex items-center gap-3">
        <Badge variant="secondary" className="gap-1">
          {selectedCount} of {totalCount} selected
        </Badge>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-7 gap-1 px-2 text-xs"
        >
          <X className="h-3 w-3" />
          Clear
        </Button>
      </div>

      <div className="flex items-center gap-2">
        {actions.length <= 3 ? (
          actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              size="sm"
              onClick={() => handleAction(action)}
              disabled={isLoading || action.disabled}
              className="gap-1"
            >
              {action.icon}
              {action.label}
            </Button>
          ))
        ) : (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" disabled={isLoading}>
                Actions
                <ChevronDown className="ml-1 h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => (
                <React.Fragment key={index}>
                  {action.variant === "destructive" && index > 0 && (
                    <DropdownMenuSeparator />
                  )}
                  <DropdownMenuItem
                    onClick={() => handleAction(action)}
                    disabled={action.disabled}
                    className={action.variant === "destructive" ? "text-destructive" : ""}
                  >
                    {action.icon}
                    <span className="ml-2">{action.label}</span>
                  </DropdownMenuItem>
                </React.Fragment>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}


interface SelectAllCheckboxProps {
  checked: boolean | "indeterminate";
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SelectAllCheckbox({
  checked,
  onCheckedChange,
  disabled,
}: SelectAllCheckboxProps) {
  return (
    <Checkbox
      checked={checked === "indeterminate" ? "indeterminate" : checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label="Select all"
    />
  );
}

interface SelectRowCheckboxProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SelectRowCheckbox({
  checked,
  onCheckedChange,
  disabled,
}: SelectRowCheckboxProps) {
  return (
    <Checkbox
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      aria-label="Select row"
    />
  );
}

// Hook for managing selection state
export function useRowSelection<T extends { _id: string }>(items: T[]) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());

  const selectedItems = React.useMemo(
    () => items.filter((item) => selectedIds.has(item._id)),
    [items, selectedIds]
  );

  const isAllSelected = items.length > 0 && selectedIds.size === items.length;
  const isIndeterminate = selectedIds.size > 0 && selectedIds.size < items.length;

  const toggleAll = React.useCallback(
    (checked: boolean) => {
      if (checked) {
        setSelectedIds(new Set(items.map((item) => item._id)));
      } else {
        setSelectedIds(new Set());
      }
    },
    [items]
  );

  const toggleRow = React.useCallback((id: string, checked: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  }, []);

  const clearSelection = React.useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = React.useCallback(
    (id: string) => selectedIds.has(id),
    [selectedIds]
  );

  return {
    selectedIds,
    selectedItems,
    selectedCount: selectedIds.size,
    isAllSelected,
    isIndeterminate,
    toggleAll,
    toggleRow,
    clearSelection,
    isSelected,
  };
}
