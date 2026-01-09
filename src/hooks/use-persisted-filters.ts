"use client";

import { useState, useCallback } from "react";
import { FilterValue } from "@/components/ui/data-table-filter";
import { toast } from "sonner";

interface UsePersistedFiltersOptions {
  storageKey: string;
  defaultFilters: FilterValue;
}

export function usePersistedFilters({
  storageKey,
  defaultFilters,
}: UsePersistedFiltersOptions) {
  const [filters, setFilters] = useState<FilterValue>(() => {
    if (typeof window === "undefined") {
      return defaultFilters;
    }
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch {
      // Ignore parse errors
    }
    return defaultFilters;
  });

  const [hasSavedFilters, setHasSavedFilters] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(storageKey) !== null;
  });

  const saveFilters = useCallback(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(filters));
      setHasSavedFilters(true);
      toast.success("Filters saved");
    } catch {
      toast.error("Failed to save filters");
    }
  }, [storageKey, filters]);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
    localStorage.removeItem(storageKey);
    setHasSavedFilters(false);
    toast.success("Filters reset");
  }, [storageKey, defaultFilters]);

  const hasActiveFilters = Object.values(filters).some(
    (value) => value !== "" && value !== undefined && value !== null,
  );

  return {
    filters,
    setFilters,
    saveFilters,
    resetFilters,
    hasActiveFilters,
    hasSavedFilters,
  };
}
