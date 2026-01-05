"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  Bookmark,
  BookmarkPlus,
  ChevronDown,
  Trash2,
  Check,
  Star,
  StarOff,
} from "lucide-react";
import { toast } from "sonner";
import type { FilterValue } from "./data-table-filter";

// ============================================
// TYPES
// ============================================

export interface FilterPreset {
  id: string;
  name: string;
  filters: FilterValue;
  isDefault?: boolean;
  createdAt: string;
}

interface FilterPresetsStorage {
  presets: FilterPreset[];
  defaultPresetId?: string;
}

// ============================================
// LOCAL STORAGE HELPERS
// ============================================

function getStorageKey(tableId: string): string {
  return `filter-presets-${tableId}`;
}

function loadPresets(tableId: string): FilterPresetsStorage {
  if (typeof window === "undefined") {
    return { presets: [] };
  }

  try {
    const stored = localStorage.getItem(getStorageKey(tableId));
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error("Failed to load filter presets:", error);
  }

  return { presets: [] };
}

function savePresets(tableId: string, storage: FilterPresetsStorage): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem(getStorageKey(tableId), JSON.stringify(storage));
  } catch (error) {
    console.error("Failed to save filter presets:", error);
  }
}

// ============================================
// HOOK: useFilterPresets
// ============================================

export function useFilterPresets(tableId: string) {
  const [storage, setStorage] = React.useState<FilterPresetsStorage>({
    presets: [],
  });
  const [isLoaded, setIsLoaded] = React.useState(false);

  // Load presets on mount
  React.useEffect(() => {
    const loaded = loadPresets(tableId);
    setStorage(loaded);
    setIsLoaded(true);
  }, [tableId]);

  // Save presets when storage changes
  React.useEffect(() => {
    if (isLoaded) {
      savePresets(tableId, storage);
    }
  }, [tableId, storage, isLoaded]);

  const presets = storage.presets;
  const defaultPreset = presets.find((p) => p.id === storage.defaultPresetId);

  const addPreset = (name: string, filters: FilterValue): FilterPreset => {
    const newPreset: FilterPreset = {
      id: crypto.randomUUID(),
      name,
      filters,
      createdAt: new Date().toISOString(),
    };

    setStorage((prev) => ({
      ...prev,
      presets: [...prev.presets, newPreset],
    }));

    return newPreset;
  };

  const updatePreset = (id: string, updates: Partial<FilterPreset>): void => {
    setStorage((prev) => ({
      ...prev,
      presets: prev.presets.map((p) =>
        p.id === id ? { ...p, ...updates } : p,
      ),
    }));
  };

  const deletePreset = (id: string): void => {
    setStorage((prev) => ({
      ...prev,
      presets: prev.presets.filter((p) => p.id !== id),
      defaultPresetId:
        prev.defaultPresetId === id ? undefined : prev.defaultPresetId,
    }));
  };

  const setDefaultPreset = (id: string | undefined): void => {
    setStorage((prev) => ({
      ...prev,
      defaultPresetId: id,
    }));
  };

  const clearAllPresets = (): void => {
    setStorage({ presets: [] });
  };

  return {
    presets,
    defaultPreset,
    isLoaded,
    addPreset,
    updatePreset,
    deletePreset,
    setDefaultPreset,
    clearAllPresets,
  };
}

// ============================================
// SAVE PRESET DIALOG
// ============================================

interface SavePresetDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (name: string) => void;
  existingNames: string[];
}

function SavePresetDialog({
  open,
  onOpenChange,
  onSave,
  existingNames,
}: SavePresetDialogProps) {
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");

  const handleSave = () => {
    const trimmedName = name.trim();

    if (!trimmedName) {
      setError("Please enter a name");
      return;
    }

    if (existingNames.includes(trimmedName.toLowerCase())) {
      setError("A preset with this name already exists");
      return;
    }

    onSave(trimmedName);
    setName("");
    setError("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[400px]">
        <DialogHeader>
          <DialogTitle>Save Filter Preset</DialogTitle>
          <DialogDescription>
            Save your current filters as a preset for quick access later.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Input
              placeholder="Preset name..."
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleSave();
                }
              }}
              autoFocus
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save Preset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ============================================
// FILTER PRESETS DROPDOWN
// ============================================

interface FilterPresetsDropdownProps {
  tableId: string;
  currentFilters: FilterValue;
  onApplyPreset: (filters: FilterValue) => void;
  hasActiveFilters?: boolean;
  className?: string;
}

export function FilterPresetsDropdown({
  tableId,
  currentFilters,
  onApplyPreset,
  hasActiveFilters = false,
  className,
}: FilterPresetsDropdownProps) {
  const { presets, defaultPreset, addPreset, deletePreset, setDefaultPreset } =
    useFilterPresets(tableId);

  const [saveDialogOpen, setSaveDialogOpen] = React.useState(false);
  const [activePresetId, setActivePresetId] = React.useState<string | null>(
    null,
  );

  // Apply default preset on mount
  React.useEffect(() => {
    if (defaultPreset && !hasActiveFilters) {
      onApplyPreset(defaultPreset.filters);
      setActivePresetId(defaultPreset.id);
    }
  }, [defaultPreset?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSavePreset = (name: string) => {
    const preset = addPreset(name, currentFilters);
    setActivePresetId(preset.id);
    toast.success(`Preset "${name}" saved`);
  };

  const handleApplyPreset = (preset: FilterPreset) => {
    onApplyPreset(preset.filters);
    setActivePresetId(preset.id);
    toast.success(`Applied "${preset.name}" preset`);
  };

  const handleDeletePreset = (preset: FilterPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    deletePreset(preset.id);
    if (activePresetId === preset.id) {
      setActivePresetId(null);
    }
    toast.success(`Deleted "${preset.name}" preset`);
  };

  const handleToggleDefault = (preset: FilterPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    const isCurrentDefault = defaultPreset?.id === preset.id;
    setDefaultPreset(isCurrentDefault ? undefined : preset.id);
    toast.success(
      isCurrentDefault
        ? `Removed "${preset.name}" as default`
        : `Set "${preset.name}" as default`,
    );
  };

  const existingNames = presets.map((p) => p.name.toLowerCase());

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={cn("gap-2", className)}
          >
            <Bookmark className="h-4 w-4" />
            Presets
            {presets.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                {presets.length}
              </Badge>
            )}
            <ChevronDown className="h-4 w-4 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-64">
          {/* Save current filters */}
          <DropdownMenuItem
            onClick={() => setSaveDialogOpen(true)}
            disabled={!hasActiveFilters}
          >
            <BookmarkPlus className="mr-2 h-4 w-4" />
            Save current filters
          </DropdownMenuItem>

          {presets.length > 0 && (
            <>
              <DropdownMenuSeparator />

              {/* Preset list */}
              {presets.map((preset) => {
                const isActive = activePresetId === preset.id;
                const isDefault = defaultPreset?.id === preset.id;

                return (
                  <DropdownMenuItem
                    key={preset.id}
                    className="group flex items-center justify-between"
                    onClick={() => handleApplyPreset(preset)}
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-2">
                      {isActive && (
                        <Check className="text-primary h-4 w-4 shrink-0" />
                      )}
                      <span className={cn("truncate", !isActive && "ml-6")}>
                        {preset.name}
                      </span>
                      {isDefault && (
                        <Badge
                          variant="outline"
                          className="px-1 py-0 text-[10px]"
                        >
                          Default
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={(e) => handleToggleDefault(preset, e)}
                      >
                        {isDefault ? (
                          <StarOff className="h-3 w-3" />
                        ) : (
                          <Star className="h-3 w-3" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive h-6 w-6"
                        onClick={(e) => handleDeletePreset(preset, e)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </DropdownMenuItem>
                );
              })}
            </>
          )}

          {presets.length === 0 && (
            <div className="text-muted-foreground px-2 py-4 text-center text-sm">
              No saved presets yet.
              <br />
              Apply filters and save them for quick access.
            </div>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <SavePresetDialog
        open={saveDialogOpen}
        onOpenChange={setSaveDialogOpen}
        onSave={handleSavePreset}
        existingNames={existingNames}
      />
    </>
  );
}

// ============================================
// QUICK PRESET PILLS
// ============================================

interface QuickPresetPillsProps {
  tableId: string;
  onApplyPreset: (filters: FilterValue) => void;
  activePresetId?: string | null;
  className?: string;
}

export function QuickPresetPills({
  tableId,
  onApplyPreset,
  activePresetId,
  className,
}: QuickPresetPillsProps) {
  const { presets } = useFilterPresets(tableId);

  if (presets.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {presets.slice(0, 5).map((preset) => (
        <Button
          key={preset.id}
          variant={activePresetId === preset.id ? "secondary" : "outline"}
          size="sm"
          className="h-7 text-xs"
          onClick={() => onApplyPreset(preset.filters)}
        >
          {preset.name}
        </Button>
      ))}
    </div>
  );
}
