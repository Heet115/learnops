"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface HeatmapData {
  day: string;
  hour: number;
  count: number;
}

interface SubmissionHeatmapProps {
  data: HeatmapData[];
}

const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const hours = Array.from({ length: 24 }, (_, i) => i);

export function SubmissionHeatmap({ data }: SubmissionHeatmapProps) {
  // Create a map for quick lookup
  const dataMap = new Map<string, number>();
  data.forEach((d) => {
    dataMap.set(`${d.day}-${d.hour}`, d.count);
  });

  // Find max for color scaling
  const maxCount = Math.max(...data.map((d) => d.count), 1);

  const getColor = (count: number) => {
    if (count === 0) return "bg-muted";
    const intensity = count / maxCount;
    if (intensity < 0.25) return "bg-green-200 dark:bg-green-900";
    if (intensity < 0.5) return "bg-green-400 dark:bg-green-700";
    if (intensity < 0.75) return "bg-green-500 dark:bg-green-600";
    return "bg-green-600 dark:bg-green-500";
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return "12am";
    if (hour === 12) return "12pm";
    return hour < 12 ? `${hour}am` : `${hour - 12}pm`;
  };

  const totalSubmissions = data.reduce((acc, curr) => acc + curr.count, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Submission Heatmap</CardTitle>
        <CardDescription>
          When students submit their work ({totalSubmissions} total)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[600px]">
            {/* Hour labels */}
            <div className="mb-1 flex">
              <div className="w-10" />
              {hours
                .filter((h) => h % 3 === 0)
                .map((hour) => (
                  <div
                    key={hour}
                    className="text-muted-foreground text-xs"
                    style={{ width: "calc((100% - 40px) / 8)" }}
                  >
                    {formatHour(hour)}
                  </div>
                ))}
            </div>

            {/* Heatmap grid */}
            <TooltipProvider>
              {days.map((day) => (
                <div key={day} className="mb-1 flex items-center">
                  <div className="text-muted-foreground w-10 text-xs">
                    {day}
                  </div>
                  <div className="flex flex-1 gap-0.5">
                    {hours.map((hour) => {
                      const count = dataMap.get(`${day}-${hour}`) || 0;
                      return (
                        <Tooltip key={hour}>
                          <TooltipTrigger asChild>
                            <div
                              className={`h-4 flex-1 rounded-sm ${getColor(count)} cursor-default transition-colors hover:opacity-80`}
                            />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p className="text-xs">
                              {day} {formatHour(hour)}: {count} submission
                              {count !== 1 ? "s" : ""}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      );
                    })}
                  </div>
                </div>
              ))}
            </TooltipProvider>

            {/* Legend */}
            <div className="mt-4 flex items-center justify-end gap-2">
              <span className="text-muted-foreground text-xs">Less</span>
              <div className="bg-muted h-3 w-3 rounded-sm" />
              <div className="h-3 w-3 rounded-sm bg-green-200 dark:bg-green-900" />
              <div className="h-3 w-3 rounded-sm bg-green-400 dark:bg-green-700" />
              <div className="h-3 w-3 rounded-sm bg-green-500 dark:bg-green-600" />
              <div className="h-3 w-3 rounded-sm bg-green-600 dark:bg-green-500" />
              <span className="text-muted-foreground text-xs">More</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
