"use client";

/*
 * Chart tren pendaftaran — pola shadcn ChartContainer, data dari server page.
 * recharts v3 (shadcn chart juga pakai ini di balik layar).
 */
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type TrendPoint = { label: string; n: number };

const config = {
  pendaftaran: { label: "Pendaftaran", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function EnrollmentTrendChart({ data }: { data: TrendPoint[] }) {
  return (
    <ChartContainer config={config} className="h-44 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
        <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
        <Bar dataKey="n" fill="var(--color-pendaftaran)" radius={6} />
      </BarChart>
    </ChartContainer>
  );
}
