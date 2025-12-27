"use client";

import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
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

interface ProfessorActivityChartProps {
  data: { name: string; graded: number; pending: number }[];
}

const chartConfig = {
  graded: {
    label: "Graded",
    color: "var(--chart-2)",
  },
  pending: {
    label: "Pending",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig;

export function ProfessorActivityChart({ data }: ProfessorActivityChartProps) {
  const totalGraded = data.reduce((acc, curr) => acc + curr.graded, 0);
  const totalPending = data.reduce((acc, curr) => acc + curr.pending, 0);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Professor Activity</CardTitle>
          <CardDescription>Grading performance by professor</CardDescription>
        </CardHeader>
        <CardContent className="flex h-[300px] items-center justify-center">
          <p className="text-muted-foreground text-sm">
            No activity data available
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Professor Activity</CardTitle>
        <CardDescription>
          {totalGraded} graded, {totalPending} pending review
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px] w-full">
          <BarChart
            data={data.slice(0, 8)}
            layout="vertical"
            margin={{ left: 0, right: 12 }}
          >
            <CartesianGrid horizontal={false} />
            <YAxis
              dataKey="name"
              type="category"
              tickLine={false}
              axisLine={false}
              width={100}
              tickFormatter={(value) => {
                const parts = value.split(" ");
                return parts.length > 1 ? `${parts[0]} ${parts[1][0]}.` : value;
              }}
            />
            <XAxis type="number" hide />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent indicator="line" />}
            />
            <Bar
              dataKey="graded"
              fill="var(--color-graded)"
              radius={[0, 4, 4, 0]}
              stackId="a"
            />
            <Bar
              dataKey="pending"
              fill="var(--color-pending)"
              radius={[0, 4, 4, 0]}
              stackId="a"
            />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}
