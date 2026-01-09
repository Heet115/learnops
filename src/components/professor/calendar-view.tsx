"use client";

import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import {
  getProfessorCalendarEvents,
  type CalendarEvent,
} from "@/lib/actions/calendar.actions";
import Link from "next/link";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function ProfessorCalendarView() {
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

      const data = await getProfessorCalendarEvents(
        startDate.toISOString(),
        endDate.toISOString(),
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
  const eventsByDate = events.reduce(
    (acc, event) => {
      const dateKey = event.date.split("T")[0];
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    },
    {} as Record<string, CalendarEvent[]>,
  );

  const selectedEvents = selectedDate ? eventsByDate[selectedDate] || [] : [];

  const renderCalendarDays = () => {
    const days = [];

    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push(<div key={`empty-${i}`} className="bg-muted/30 h-24" />);
    }

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
            "border-border/50 hover:bg-accent/50 h-24 border p-1 text-left transition-colors",
            isToday && "bg-primary/10",
            isSelected && "ring-primary ring-2",
          )}
        >
          <div
            className={cn(
              "mb-1 text-sm font-medium",
              isToday && "text-primary font-bold",
            )}
          >
            {day}
          </div>
          <div className="space-y-0.5 overflow-hidden">
            {dayEvents.slice(0, 3).map((event) => (
              <div
                key={event.id}
                className={cn(
                  "truncate rounded px-1 py-0.5 text-xs text-white",
                  event.type === "late_deadline"
                    ? "bg-orange-500"
                    : "bg-primary",
                )}
                title={`${event.title} - ${event.className}`}
              >
                {event.title}
              </div>
            ))}
            {dayEvents.length > 3 && (
              <div className="text-muted-foreground px-1 text-xs">
                +{dayEvents.length - 3} more
              </div>
            )}
          </div>
        </button>,
      );
    }

    return days;
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
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
          <div className="mb-1 grid grid-cols-7">
            {DAYS.map((day) => (
              <div
                key={day}
                className="text-muted-foreground py-2 text-center text-sm font-medium"
              >
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {loading
              ? Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="bg-muted/30 border-border/50 h-24 animate-pulse border"
                  />
                ))
              : renderCalendarDays()}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {selectedDate
              ? new Date(selectedDate + "T00:00:00").toLocaleDateString(
                  "en-US",
                  {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  },
                )
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
                  href={`/professor/alas/${event.alaId}`}
                  className="block"
                >
                  <div className="hover:bg-accent/50 rounded-lg border p-3 transition-colors">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-medium">{event.title}</p>
                        <p className="text-muted-foreground text-sm">
                          {event.subjectCode} - {event.subjectName}
                        </p>
                        <p className="text-muted-foreground text-xs">
                          {event.className}
                        </p>
                        <p className="text-muted-foreground mt-1 text-xs">
                          <Clock className="mr-1 inline h-3 w-3" />
                          {new Date(event.date).toLocaleTimeString("en-US", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          event.type === "late_deadline" ? "outline" : "default"
                        }
                        className={cn(
                          "text-xs",
                          event.type === "late_deadline" &&
                            "border-orange-500 text-orange-500",
                        )}
                      >
                        {event.type === "late_deadline" ? "Late" : "Deadline"}
                      </Badge>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="mt-6 border-t pt-4">
            <p className="mb-2 text-sm font-medium">Legend</p>
            <div className="flex gap-4 text-xs">
              <div className="flex items-center gap-2">
                <div className="bg-primary h-3 w-3 rounded" />
                <span>Deadline</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded bg-orange-500" />
                <span>Late Deadline</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
