"use client";

import * as React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import {
  Search,
  Filter,
  X,
  CalendarIcon,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import { format } from "date-fns";

export type FilterType = "text" | "select" | "date" | "dateRange" | "multiSelect";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterConfig {
  key: string;
  label: string;
  type: FilterType;
  placeholder?: string;
  options?: FilterOption[];
}

export interface FilterValue {
  [key: string]: string | string[] | Date | { from?: Date; to?: Date } | undefined;
}

interface DataTableFilterProps {
  filters: FilterConfig[];
  values: FilterValue;
  onChange: (values: FilterValue) => void;
  searchPlaceholder?: string;
  className?: string;
}

export function DataTableFilter({
  filters,
  values,
  onChange,
  searchPlaceholder = "Search...",
  className,
}: DataTableFilterProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const activeFilterCount = Object.entries(values).filter(([, v]) => {
    if (v === undefined || v === "" || v === "all") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === "object" && "from" in v && !v.from && !v.to) return false;
    return true;
  }).length;

  const handleChange = (key: string, value: FilterValue[string]) => {
    onChange({ ...values, [key]: value });
  };

  const handleReset = () => {
    const resetValues: FilterValue = {};
    filters.forEach((f) => {
      if (f.type === "multiSelect") resetValues[f.key] = [];
      else if (f.type === "dateRange") resetValues[f.key] = { from: undefined, to: undefined };
      else resetValues[f.key] = "";
    });
    onChange(resetValues);
  };

  const searchFilter = filters.find((f) => f.type === "text" && f.key === "search");
  const otherFilters = filters.filter((f) => !(f.type === "text" && f.key === "search"));

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:items-center", className)}>
      {searchFilter && (
        <div className="relative flex-1 max-w-sm">
          <Search className="text-muted-foreground absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" />
          <Input
            placeholder={searchFilter.placeholder || searchPlaceholder}
            value={(values[searchFilter.key] as string) || ""}
            onChange={(e) => handleChange(searchFilter.key, e.target.value)}
            className="pl-9"
          />
        </div>
      )}

      {otherFilters.length > 0 && (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filters
              {activeFilterCount > 0 && (
                <Badge variant="secondary" className="ml-1 h-5 px-1.5">
                  {activeFilterCount}
                </Badge>
              )}
              <ChevronDown className="h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Filters</h4>
                {activeFilterCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-8 gap-1 px-2 text-xs"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset
                  </Button>
                )}
              </div>

              {otherFilters.map((filter) => (
                <FilterField
                  key={filter.key}
                  filter={filter}
                  value={values[filter.key]}
                  onChange={(v) => handleChange(filter.key, v)}
                />
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {activeFilterCount > 0 && (
        <div className="flex flex-wrap gap-2">
          {otherFilters.map((filter) => {
            const value = values[filter.key];
            if (!value || value === "all") return null;
            if (Array.isArray(value) && value.length === 0) return null;

            let displayValue = "";
            if (filter.type === "select" && filter.options) {
              const opt = filter.options.find((o) => o.value === value);
              displayValue = opt?.label || String(value);
            } else if (filter.type === "multiSelect" && Array.isArray(value)) {
              displayValue = `${value.length} selected`;
            } else if (filter.type === "date" && value instanceof Date) {
              displayValue = format(value, "MMM d, yyyy");
            } else if (filter.type === "dateRange" && typeof value === "object" && "from" in value) {
              const { from, to } = value;
              if (from && to) displayValue = `${format(from, "MMM d")} - ${format(to, "MMM d")}`;
              else if (from) displayValue = `From ${format(from, "MMM d")}`;
              else if (to) displayValue = `Until ${format(to, "MMM d")}`;
              else return null;
            } else {
              displayValue = String(value);
            }

            return (
              <Badge key={filter.key} variant="secondary" className="gap-1 pr-1">
                {filter.label}: {displayValue}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => {
                    if (filter.type === "multiSelect") handleChange(filter.key, []);
                    else if (filter.type === "dateRange") handleChange(filter.key, { from: undefined, to: undefined });
                    else handleChange(filter.key, "");
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            );
          })}
        </div>
      )}
    </div>
  );
}


interface FilterFieldProps {
  filter: FilterConfig;
  value: FilterValue[string];
  onChange: (value: FilterValue[string]) => void;
}

function FilterField({ filter, value, onChange }: FilterFieldProps) {
  if (filter.type === "text") {
    return (
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-sm">{filter.label}</label>
        <Input
          placeholder={filter.placeholder}
          value={(value as string) || ""}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    );
  }

  if (filter.type === "select" && filter.options) {
    return (
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-sm">{filter.label}</label>
        <Select value={(value as string) || "all"} onValueChange={onChange}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={filter.placeholder || "Select..."} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All</SelectItem>
            {filter.options.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    );
  }

  if (filter.type === "multiSelect" && filter.options) {
    const selectedValues = (value as string[]) || [];
    return (
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-sm">{filter.label}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full justify-between">
              {selectedValues.length > 0
                ? `${selectedValues.length} selected`
                : filter.placeholder || "Select..."}
              <ChevronDown className="ml-2 h-4 w-4 opacity-50" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-full p-2" align="start">
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {filter.options.map((opt) => {
                const isSelected = selectedValues.includes(opt.value);
                return (
                  <Button
                    key={opt.value}
                    variant={isSelected ? "secondary" : "ghost"}
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => {
                      if (isSelected) {
                        onChange(selectedValues.filter((v) => v !== opt.value));
                      } else {
                        onChange([...selectedValues, opt.value]);
                      }
                    }}
                  >
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (filter.type === "date") {
    return (
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-sm">{filter.label}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !value && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {value instanceof Date ? format(value, "PPP") : filter.placeholder || "Pick a date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value as Date | undefined}
              onSelect={(date) => onChange(date)}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  if (filter.type === "dateRange") {
    const dateRange = (value as { from?: Date; to?: Date }) || {};
    return (
      <div className="space-y-1.5">
        <label className="text-muted-foreground text-sm">{filter.label}</label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                "w-full justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd")} - {format(dateRange.to, "LLL dd")}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y")
                )
              ) : (
                filter.placeholder || "Pick date range"
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={{ from: dateRange.from, to: dateRange.to }}
              onSelect={(range) => onChange({ from: range?.from, to: range?.to })}
              numberOfMonths={2}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    );
  }

  return null;
}

export { FilterField };
