"use client";

/*
 * Chart tren pendaftaran — pola shadcn ChartContainer, data dari server page.
 * recharts v3 (shadcn chart juga pakai ini di balik layar).
 */
import { useTranslations } from "next-intl";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type TrendPoint = { label: string; n: number };

export function EnrollmentTrendChart({ data }: { data: TrendPoint[] }) {
  const t = useTranslations("adminForms");
  const config = {
    pendaftaran: { label: t("chart.enrollment"), color: "#2563eb" },
  } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-52 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} />
        <ChartTooltip
          cursor={{ fill: "var(--muted)", opacity: 0.4 }}
          content={
            <ChartTooltipContent
              indicator="line"
              // recharts me-render label bawaan; kita ganti label tooltip = "N pendaftaran".
              formatter={(value) => (
                <>
                  <span className="font-medium tabular-nums">{String(value)}</span>
                  <span className="text-muted-foreground">{t("chart.enrollmentUnit")}</span>
                </>
              )}
            />
          }
        />
        <Bar dataKey="n" fill="var(--color-pendaftaran)" radius={6} maxBarSize={40} />
      </BarChart>
    </ChartContainer>
  );
}
