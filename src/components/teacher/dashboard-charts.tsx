"use client";

/*
 * Grafik dashboard guru — pola shadcn ChartContainer + recharts v3, sama
 * seperti admin/enrollment-trend-chart dan parent/nilai-trend-chart. Data
 * dihitung di server (angka nyata dari DB), komponen ini hanya merender.
 */
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

export type RekapSlice = { key: string; label: string; value: number; color: string };
export type HariAktivitas = { label: string; hadir: number };

/** Donut rekap status presensi (hadir/izin/sakit/alpa). */
export function RekapPresensiDonut({ data, total }: { data: RekapSlice[]; total: number }) {
  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.key, { label: d.label, color: d.color }]),
  );
  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-44">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
        <Pie data={data} dataKey="value" nameKey="label" innerRadius={48} outerRadius={70} strokeWidth={2} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
        <text x="50%" y="46%" textAnchor="middle" dominantBaseline="middle" className="fill-slate-900 text-2xl font-extrabold tabular-nums">
          {total}
        </text>
      </PieChart>
    </ChartContainer>
  );
}

/** Bar jumlah presensi tercatat per hari, 7 hari terakhir. */
export function AktivitasMingguanBar({ data, label }: { data: HariAktivitas[]; label: string }) {
  const config = { hadir: { label, color: "#2563eb" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-44 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis tickLine={false} axisLine={false} fontSize={12} allowDecimals={false} width={28} />
        <ChartTooltip cursor={{ fill: "var(--muted)", opacity: 0.4 }} content={<ChartTooltipContent hideLabel />} />
        <Bar dataKey="hadir" fill="var(--color-hadir)" radius={6} maxBarSize={34} />
      </BarChart>
    </ChartContainer>
  );
}
