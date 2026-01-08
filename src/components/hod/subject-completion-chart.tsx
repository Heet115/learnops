"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart } from "recharts";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { BookMarked } from "lucide-react";

interface SubjectCompletionChartProps {
  data: { name: string; code: string; alas: number; completionRate: number }[];
}

const chartConfig = {
  completionRate: {
    label: "Completion %",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function SubjectCompletionChart({ data }: SubjectCompletionChartProps) {
  const avgCompletion =
    data.length > 0
      ? Math.round(
          data.reduce((acc, curr) => acc + curr.completionRate, 0) /
            data.length,
        )
      : 0;

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader className="border-b">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
              <BookMarked className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <CardTitle>Subject Completion</CardTitle>
              <CardDescription>Completion rates by subject</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="bg-muted flex h-12 w-12 items-center justify-center rounded-full">
              <BookMarked className="text-muted-foreground h-6 w-6" />
            </div>
            <p className="text-muted-foreground mt-3 text-sm">
              No subject data available
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Take top 6 subjects for radar chart
  const chartData = data.slice(0, 6).map((s) => ({
    subject: s.code,
    completionRate: s.completionRate,
  }));

  return (
    <Card>
      <CardHeader className="border-b">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10">
            <BookMarked className="h-4 w-4 text-emerald-600" />
          </div>
          <div>
            <CardTitle>Subject Completion</CardTitle>
            <CardDescription>
              Average: {avgCompletion}% completion rate
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4 pb-0">
        <ChartContainer
          config={chartConfig}
          className="mx-auto aspect-square max-h-[300px]"
        >
          <RadarChart data={chartData}>
            <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
            <PolarAngleAxis dataKey="subject" />
            <PolarGrid />
            <Radar
              dataKey="completionRate"
              fill="var(--color-completionRate)"
              fillOpacity={0.6}
              dot={{ r: 4, fillOpacity: 1 }}
            />
          </RadarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
