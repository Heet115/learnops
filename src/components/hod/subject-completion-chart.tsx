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
        <CardHeader className="items-center">
          <CardTitle>Subject Completion</CardTitle>
          <CardDescription>Completion rates by subject</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No subject data available
          </p>
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
      <CardHeader className="items-center">
        <CardTitle>Subject Completion</CardTitle>
        <CardDescription>
          Average: {avgCompletion}% completion rate
        </CardDescription>
      </CardHeader>
      <CardContent className="pb-0">
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
