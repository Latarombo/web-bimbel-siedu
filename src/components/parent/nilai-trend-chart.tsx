"use client";

/*
 * Grafik tren nilai anak (NilaiProgres.nilaiKuantitatif) — pola shadcn
 * ChartContainer + recharts v3, sama seperti admin/enrollment-trend-chart.
 * Dipakai hanya kalau ada >=2 titik data; di bawah itu halaman tampil teks.
 */
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";

const config = {
  nilai: { label: "Nilai", color: "var(--chart-1)" },
} satisfies ChartConfig;

export function NilaiTrendChart({ data }: { data: { tanggal: string; nilai: number }[] }) {
  const titik = data.map((d) => ({
    ...d,
    label: new Date(d.tanggal).toLocaleDateString("id-ID", { day: "numeric", month: "short" }),
  }));
  return (
    <ChartContainer config={config} className="h-40 w-full">
      <LineChart data={titik} margin={{ top: 8, right: 8, left: -28, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tickMargin={8} fontSize={12} />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={12}
          domain={[0, 100]}
          allowDecimals={false}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <Line
          type="monotone"
          dataKey="nilai"
          stroke="var(--color-nilai)"
          strokeWidth={2}
          dot={{ r: 3 }}
        />
      </LineChart>
    </ChartContainer>
  );
}
