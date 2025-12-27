"use client";

import * as React from "react";
import { ChevronDownIcon, CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  id?: string;
  name?: string;
  label?: string;
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function DatePicker({
  id,
  name,
  label,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  className,
  placeholder = "Select date",
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    value || defaultValue,
  );

  const date = value !== undefined ? value : internalDate;

  const handleSelect = (selectedDate: Date | undefined) => {
    setInternalDate(selectedDate);
    onChange?.(selectedDate);
    setOpen(false);
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !date && "text-muted-foreground",
            )}
          >
            {date ? date.toLocaleDateString() : placeholder}
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleSelect}
          />
        </PopoverContent>
      </Popover>
      {name && (
        <input
          type="hidden"
          name={name}
          value={date ? date.toISOString().split("T")[0] : ""}
          required={required}
        />
      )}
    </div>
  );
}

interface DateTimePickerProps {
  id?: string;
  name?: string;
  label?: string;
  value?: Date;
  defaultValue?: Date;
  onChange?: (date: Date | undefined) => void;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  placeholder?: string;
}

export function DateTimePicker({
  id,
  name,
  label,
  value,
  defaultValue,
  onChange,
  disabled,
  required,
  className,
  placeholder = "Select date and time",
}: DateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [internalDate, setInternalDate] = React.useState<Date | undefined>(
    value || defaultValue,
  );

  const date = value !== undefined ? value : internalDate;

  const handleDateSelect = (selectedDate: Date | undefined) => {
    if (!selectedDate) {
      setInternalDate(undefined);
      onChange?.(undefined);
      return;
    }

    // Preserve existing time if date already set
    const newDate = new Date(selectedDate);
    if (date) {
      newDate.setHours(date.getHours(), date.getMinutes());
    } else {
      // Default to current time
      const now = new Date();
      newDate.setHours(now.getHours(), now.getMinutes());
    }
    setInternalDate(newDate);
    onChange?.(newDate);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(":").map(Number);
    const newDate = date ? new Date(date) : new Date();
    newDate.setHours(hours, minutes);
    setInternalDate(newDate);
    onChange?.(newDate);
  };

  const formatDateTime = (d: Date) => {
    return d.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  const formatTimeValue = (d: Date) => {
    return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
  };

  return (
    <div className={cn("flex flex-col gap-2", className)}>
      {label && (
        <Label htmlFor={id} className="px-1">
          {label}
        </Label>
      )}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={id}
            disabled={disabled}
            className={cn(
              "w-full justify-between font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <span className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              {date ? formatDateTime(date) : placeholder}
            </span>
            <ChevronDownIcon className="h-4 w-4 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={handleDateSelect}
          />
          <div className="border-t p-3">
            <div className="flex items-center gap-2">
              <Clock className="text-muted-foreground h-4 w-4" />
              <Input
                type="time"
                value={date ? formatTimeValue(date) : ""}
                onChange={handleTimeChange}
                className="w-auto"
              />
              <Button type="button" size="sm" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      {name && (
        <input
          type="hidden"
          name={name}
          value={date ? date.toISOString() : ""}
          required={required}
        />
      )}
    </div>
  );
}
