"use client";

/*
 * Grafik dashboard guru: pola shadcn ChartContainer + recharts v3, sama
 * seperti admin/enrollment-trend-chart dan parent/nilai-trend-chart. Data
 * dihitung di server (angka nyata dari DB), komponen ini hanya merender.
 */
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, XAxis, YAxis } from "recharts";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart";
import { PieChart as PieChartIcon } from "lucide-react";

export type RekapSlice = { key: string; label: string; value: number; color: string };
export type HariAktivitas = { label: string; hadir: number; fill?: string; fullLabel?: string };

/** Donut rekap status presensi (hadir/izin/sakit/alpa). */
export function RekapPresensiDonut({ data, total }: { data: RekapSlice[]; total: number }) {
  const [pos, setPos] = useState<{ x: number; y: number } | undefined>(undefined);

  const config: ChartConfig = Object.fromEntries(
    data.map((d) => [d.key, { label: d.label, color: d.color }]),
  );

  if (total === 0) {
    return (
      <div className="flex aspect-square h-44 w-full flex-col items-center justify-center rounded-xl bg-slate-50/60 p-4 text-center">
        <div className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-400 mb-2">
          <PieChartIcon className="size-5" />
        </div>
        <p className="text-xs font-semibold text-slate-600">Belum ada presensi</p>
      </div>
    );
  }

  return (
    <ChartContainer config={config} className="mx-auto aspect-square h-44 sm:h-48">
      <PieChart
        onMouseMove={(_state, event) => {
          if (event && "clientX" in event && event.currentTarget) {
            const rect = event.currentTarget.getBoundingClientRect();
            setPos({
              x: event.clientX - rect.left + 12,
              y: event.clientY - rect.top + 12,
            });
          }
        }}
        onMouseLeave={() => setPos(undefined)}
      >
        <ChartTooltip
          isAnimationActive={false}
          position={pos}
          wrapperStyle={{ pointerEvents: "none", zIndex: 50 }}
          content={
            <ChartTooltipContent
              hideLabel
              formatter={(value, name, item) => {
                const val = Number(value);
                const pct = total > 0 ? Math.round((val / total) * 100) : 0;
                const itemColor = item.payload?.color ?? item.payload?.fill ?? "#10b981";
                const labelText = item.payload?.label ?? name;
                return (
                  <div className="flex items-center gap-2 text-xs">
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: itemColor }}
                    />
                    <span className="text-slate-600 dark:text-slate-400">{labelText}:</span>
                    <span className="font-bold text-slate-950 dark:text-slate-50 tabular-nums">
                      {val} presensi ({pct}%)
                    </span>
                  </div>
                );
              }}
            />
          }
        />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={50}
          outerRadius={74}
          strokeWidth={2}
          paddingAngle={2}
          className="cursor-pointer"
        >
          {data.map((d) => (
            <Cell key={d.key} fill={d.color} />
          ))}
        </Pie>
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-950 dark:fill-slate-50 text-2xl font-black tabular-nums pointer-events-none select-none"
        >
          {total}
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-600 dark:fill-slate-400 text-xs font-medium pointer-events-none select-none"
        >
          Presensi
        </text>
      </PieChart>
    </ChartContainer>
  );
}

/** Bar jumlah presensi tercatat per hari, 7 hari terakhir. */
export function AktivitasMingguanBar({ data, label }: { data: HariAktivitas[]; label: string }) {
  const config = { hadir: { label, color: "#2563eb" } } satisfies ChartConfig;
  return (
    <ChartContainer config={config} className="h-[226px] w-full">
      <BarChart data={data} margin={{ top: 12, right: 12, left: 4, bottom: 24 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="var(--border)" opacity={0.5} />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          interval={0}
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={11}
          allowDecimals={false}
          width={28}
        />
        <ChartTooltip
          cursor={false}
          isAnimationActive={false}
          offset={12}
          wrapperStyle={{ pointerEvents: "none", zIndex: 50 }}
          content={
            <ChartTooltipContent
              labelFormatter={(_, payload) => payload?.[0]?.payload?.fullLabel ?? ""}
              formatter={(value, _, item) => (
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className="size-2 rounded-full shrink-0"
                    style={{ backgroundColor: item.payload?.fill ?? "#2563eb" }}
                  />
                  <span className="text-slate-600 dark:text-slate-400">{label}:</span>
                  <span className="font-bold text-slate-950 dark:text-slate-50 tabular-nums">
                    {value} siswa
                  </span>
                </div>
              )}
            />
          }
        />
        <Bar dataKey="hadir" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36}>
          {data.map((item, index) => (
            <Cell
              key={`cell-${index}`}
              fill={item.fill ?? (index === data.length - 1 ? "#2563eb" : "#94a3b8")}
            />
          ))}
        </Bar>
      </BarChart>
    </ChartContainer>
  );
}

export interface TeacherAnalyticsSectionProps {
  rekapData: RekapSlice[];
  totalPresensi: number;
  aktivitasData: HariAktivitas[];
  totalAktivitasHadir?: number;
  overallAttendanceRate?: number;
  labels: {
    distributionTitle: string;
    weeklyTrendTitle: string;
    weeklyTrendSubtitle: string;
    totalAttendance: string;
    noAttendanceYet: string;
    noAttendanceDesc: string;
    overallAttendanceRate: string;
  };
}

export function TeacherAnalyticsSection({
  rekapData,
  totalPresensi,
  aktivitasData,
  labels,
}: TeacherAnalyticsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Donut Distribusi Presensi Siswa */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
        <div>
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-950 dark:text-slate-50 tracking-tight">
              {labels.distributionTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Proporsi status kehadiran siswa semester ini.
            </p>
          </div>

          <div className="mt-4">
            {totalPresensi > 0 ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-full flex justify-center">
                  <RekapPresensiDonut data={rekapData} total={totalPresensi} />
                </div>

                {/* Status metrik diletakkan di bawah chart donut (Jumlah Saja) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-1">
                  {rekapData.map((item) => (
                    <div
                      key={item.key}
                      className="flex flex-col rounded-md border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center"
                    >
                      <div className="flex items-center justify-center gap-1.5 text-xs text-slate-600 dark:text-slate-400">
                        <span
                          className="size-2 rounded-full shrink-0"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="font-medium truncate text-[11px]">{item.label}</span>
                      </div>
                      <div className="mt-1 flex items-baseline justify-center">
                        <span className="text-base sm:text-lg font-bold text-slate-950 dark:text-slate-50 tabular-nums">
                          {item.value}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="grid size-11 place-items-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 mx-auto mb-2">
                  <PieChartIcon className="size-5 stroke-[1.5]" />
                </div>
                <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{labels.noAttendanceYet}</p>
                <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs mx-auto mt-1">
                  {labels.noAttendanceDesc}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Bar Aktivitas 7 Hari Terakhir */}
      <div className="flex flex-col justify-between rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-5 shadow-xs">
        <div>
          <div className="pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-display text-sm font-bold text-slate-950 dark:text-slate-50 tracking-tight">
              {labels.weeklyTrendTitle}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              {labels.weeklyTrendSubtitle}
            </p>
          </div>

          <div className="mt-4">
            <AktivitasMingguanBar data={aktivitasData} label="Siswa Hadir" />
          </div>
        </div>
      </div>
    </div>
  );
}
