"use client";

/*
 * Donut status pembayaran — pola shadcn ChartContainer + recharts v3 Pie.
 * Angka absolut + persen tampil di daftar legenda di bawah chart (kaidah a11y
 * chart: jangan andalkan warna saja), warna ikut token --chart-*.
 */
import { useTranslations } from "next-intl";
import { Cell, Pie, PieChart } from "recharts";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";

export type StatusSlice = { key: string; label: string; n: number; color: string };

export function PaymentStatusChart({
  slices,
  total,
}: {
  slices: StatusSlice[];
  total: number;
}) {
  const t = useTranslations("adminForms");
  const label = (s: StatusSlice) => t.has(`chart.${s.key}`) ? t(`chart.${s.key}`) : s.label;
  const config = Object.fromEntries(
    slices.map((s) => [s.key, { label: label(s), color: s.color }]),
  ) satisfies ChartConfig;
  const data = slices.map((s) => ({ key: s.key, name: label(s), n: s.n }));

  return (
    <div>
      <ChartContainer config={config} className="mx-auto h-44 w-full max-w-[220px]">
        <PieChart>
          <ChartTooltip
            cursor={false}
            content={
              <ChartTooltipContent
                indicator="line"
                nameKey="name"
                formatter={(value, name) => (
                  <>
                    <span className="font-medium tabular-nums">{String(value)}</span>
                    <span className="text-muted-foreground">{String(name)}</span>
                  </>
                )}
              />
            }
          />
          <Pie
            data={data}
            dataKey="n"
            nameKey="name"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            strokeWidth={0}
          >
            {data.map((d) => (
              <Cell key={d.key} fill={`var(--color-${d.key})`} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="mt-4 space-y-2">
        {slices.map((s) => (
          <li key={s.key} className="flex items-center gap-2.5 text-sm">
            <span
              aria-hidden="true"
              className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
              style={{ backgroundColor: s.color }}
            />
            <span className="min-w-0 flex-1 truncate text-body">{label(s)}</span>
            <span className="font-semibold tabular-nums text-foreground">{s.n}</span>
            <span className="w-12 text-right text-xs tabular-nums text-muted">
              {total > 0 ? `${Math.round((s.n / total) * 100)}%` : "0%"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
