"use client";

import { Button } from "@/components/ui/button";
import { Save, RotateCcw } from "lucide-react";

interface SaveFiltersButtonProps {
  hasActiveFilters: boolean;
  hasSavedFilters: boolean;
  onSave: () => void;
  onReset: () => void;
}

export function SaveFiltersButton({
  hasActiveFilters,
  hasSavedFilters,
  onSave,
  onReset,
}: SaveFiltersButtonProps) {
  if (!hasActiveFilters && !hasSavedFilters) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {hasActiveFilters && (
        <>
          <Button
            variant="outline"
            size="sm"
            onClick={onSave}
            className="gap-1.5"
          >
            <Save className="h-3.5 w-3.5" />
            Save Filters
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground gap-1.5"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </Button>
        </>
      )}
      {!hasActiveFilters && hasSavedFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onReset}
          className="text-muted-foreground gap-1.5"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Clear Saved
        </Button>
      )}
    </div>
  );
}
