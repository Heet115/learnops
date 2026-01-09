"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock, CheckCircle2, AlertCircle, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getStudentCalendarEvents,
  type CalendarEvent,
} from "@/lib/actions/calendar.actions";
import Link from "next/link";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    async function fetchEvents() {
      setLoading(true);
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const data = await getStudentCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString()
      );
      setEvents(data);
      setLoading(false);
    }
    fetchEvents();
  }, [year, month]);

  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setSelectedDate(null);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(todayStr);
  };

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = event.date.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(event);
    return acc;
  }, {} as Record<string, CalendarEvent[]>);

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const getStatusColor = (status?: string) => {
    switch (status) {
      case "submitted":
        return "bg-blue-500";
      case "graded":
        return "bg-green-500";
      case "overdue":
        return "bg-red-500";
      case "late":
        return "bg-orange-500";
      default:
        return "bg-yellow-500";
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case "submitted":
        return <Clock className="h-4 w-4" />;
      case "graded":
        return <CheckCircle2 className="h-4 w-4" />;
      case "overdue":
        return <XCircle className="h-4 w-4" />;
      case "late":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="h-24 bg-muted/30" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const dayEvents = eventsByDate[dateStr] || [];
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      days.push(
        <button
          key={day}
          onClick={() => setSelectedDate(dateStr)}
          className={cn(
            "h-24 p-1 text-left border border-border/50 transition-colors hover:bg-accent/50",
            isToday && "bg-primary/10",
            isSelected && "ring-2 ring-primary"
          )}
        >
          <div className={cn(
            "text-sm font-medium mb-1",
            isToday && "text-primary font-bold"
          )}>
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "text-xs px-1 py-0.5 rounded truncate text-white",
                  event.type === "late_deadline" ? "bg-orange-500" : getStatusColor(event.status)
                )}
                title={event.title}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-xs text-muted-foreground px-1">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </button>
      );
    }

    return days;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
      {/* Calendar Grid */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <CardTitle className="text-xl">
            {MONTHS[month]} {year}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="icon" onClick={prevMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Day headers */}
          <div className="grid grid-cols-7 mb-1">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-2"
              >
                {day}
              </div>
            ))}
          </div>
          {/* Calendar grid */}
          <div className="grid grid-cols-7">
            {loading ? (
              Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="h-24 bg-muted/30 animate-pulse border border-border/50" />
              ))
            ) : (
              renderCalendarDays()
            )}
          </div>
        </CardContent>
      </Card>

      {/* Selected Date Events */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate
              ? new Date(selectedDate + "T00:00:00").toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })
              : "Select a date"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {!selectedDate ? (
            <p className="text-muted-foreground text-sm">
              Click on a date to view deadlines
            </p>
          ) : selectedEvents.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No deadlines on this date
            </p>
          ) : (
            <div className="space-y-3">
              {selectedEvents.map((event) => (
                <Link
                  key={event.id}
                  href={`/student/alas/${event.alaId}`}
                  className="block"
                >
                  <div className="p-3 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{event.title}</p>
                        <p className="text-sm text-muted-foreground">
                          {event.subjectCode} - {event.subjectName}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {new Date(event.date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={event.type === "late_deadline" ? "outline" : "default"}
                          className={cn(
                            "text-xs",
                            event.type === "late_deadline"
                              ? "border-orange-500 text-orange-500"
                              : event.status === "graded"
                              ? "bg-green-500"
                              : event.status === "submitted"
                              ? "bg-blue-500"
                              : event.status === "overdue"
                              ? "bg-red-500"
                              : "bg-yellow-500"
                          )}
                        >
                          <span className="flex items-center gap-1">
                            {getStatusIcon(event.status)}
                            {event.type === "late_deadline"
                              ? "Late Deadline"
                              : event.status || "Pending"}
                          </span>
                        </Badge>
                        {event.marks !== undefined && (
                          <span className="text-xs text-muted-foreground">
                            {event.marks}/{event.maxMarks}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 pt-4 border-t">
            <p className="text-sm font-medium mb-2">Legend</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-yellow-500" />
                <span>Pending</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span>Submitted</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-green-500" />
                <span>Graded</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-red-500" />
                <span>Overdue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-orange-500" />
                <span>Late Deadline</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
