"use client";

/*
 * Grafik dashboard guru: pola shadcn ChartContainer + recharts v3, sama
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
import { PieChart as PieChartIcon, BarChart3, TrendingUp, CalendarDays } from "lucide-react";

export type RekapSlice = { key: string; label: string; value: number; color: string };
export type HariAktivitas = { label: string; hadir: number };

/** Donut rekap status presensi (hadir/izin/sakit/alpa). */
export function RekapPresensiDonut({ data, total }: { data: RekapSlice[]; total: number }) {
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
    <ChartContainer config={config} className="mx-auto aspect-square h-44">
      <PieChart>
        <ChartTooltip content={<ChartTooltipContent nameKey="label" hideLabel />} />
        <Pie
          data={data}
          dataKey="value"
          nameKey="label"
          innerRadius={48}
          outerRadius={70}
          strokeWidth={2}
          paddingAngle={2}
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
          className="fill-slate-900 dark:fill-slate-100 text-2xl font-black tabular-nums"
        >
          {total}
        </text>
        <text
          x="50%"
          y="60%"
          textAnchor="middle"
          dominantBaseline="middle"
          className="fill-slate-500 dark:fill-slate-400 text-[10px] font-semibold uppercase tracking-wider"
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
    <ChartContainer config={config} className="h-44 w-full">
      <BarChart data={data} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
        <CartesianGrid vertical={false} strokeDasharray="3 3" stroke="#e2e8f0" />
        <XAxis
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tickMargin={8}
          fontSize={11}
          stroke="#64748b"
        />
        <YAxis
          tickLine={false}
          axisLine={false}
          fontSize={11}
          allowDecimals={false}
          width={28}
          stroke="#64748b"
        />
        <ChartTooltip
          cursor={{ fill: "rgba(226, 232, 240, 0.4)" }}
          content={<ChartTooltipContent hideLabel />}
        />
        <Bar dataKey="hadir" fill="#2563eb" radius={[6, 6, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ChartContainer>
  );
}

export interface TeacherAnalyticsSectionProps {
  rekapData: RekapSlice[];
  totalPresensi: number;
  aktivitasData: HariAktivitas[];
  totalAktivitasHadir: number;
  overallAttendanceRate: number;
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
  totalAktivitasHadir,
  overallAttendanceRate,
  labels,
}: TeacherAnalyticsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* 1. Donut Distribusi Presensi Siswa */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <PieChartIcon className="size-4 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {labels.distributionTitle}
              </h3>
            </div>
            {totalPresensi > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                <TrendingUp className="size-3" />
                <span>{overallAttendanceRate}% Hadir</span>
              </span>
            )}
          </div>

          <div className="mt-4">
            {totalPresensi > 0 ? (
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="w-full sm:w-1/2 flex justify-center">
                  <RekapPresensiDonut data={rekapData} total={totalPresensi} />
                </div>
                <div className="w-full sm:w-1/2 space-y-2">
                  {rekapData.map((item) => {
                    const pct = totalPresensi > 0 ? Math.round((item.value / totalPresensi) * 100) : 0;
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-xl bg-slate-50/70 dark:bg-slate-800/60 px-3 py-2 text-xs"
                      >
                        <div className="flex items-center gap-2">
                          <span
                            className="size-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: item.color }}
                          />
                          <span className="font-semibold text-slate-700 dark:text-slate-300">{item.label}</span>
                        </div>
                        <div className="flex items-center gap-2 font-bold tabular-nums">
                          <span className="text-slate-900 dark:text-slate-100">{item.value}</span>
                          <span className="text-slate-500 dark:text-slate-400 text-[11px]">({pct}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="py-6 text-center">
                <div className="grid size-11 place-items-center rounded-2xl bg-slate-50 dark:bg-slate-800 text-slate-400 mx-auto mb-2">
                  <PieChartIcon className="size-5 stroke-[1.5]" />
                </div>
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{labels.noAttendanceYet}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-xs mx-auto mt-1">
                  {labels.noAttendanceDesc}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>{labels.totalAttendance}</span>
          <span className="font-bold text-slate-800 dark:text-slate-200 tabular-nums">{totalPresensi} data</span>
        </div>
      </div>

      {/* 2. Bar Aktivitas 7 Hari Terakhir */}
      <div className="flex flex-col justify-between rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-[0_2px_8px_rgba(0,0,0,0.02)]">
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="grid size-7 place-items-center rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <BarChart3 className="size-4 stroke-[2]" />
              </div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                {labels.weeklyTrendTitle}
              </h3>
            </div>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 px-2.5 py-0.5 text-[11px] font-bold text-blue-700 dark:text-blue-300">
              <CalendarDays className="size-3" />
              <span>7 Hari</span>
            </span>
          </div>

          <div className="mt-3">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2">{labels.weeklyTrendSubtitle}</p>
            <AktivitasMingguanBar data={aktivitasData} label="Siswa Hadir" />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
          <span>Total Siswa Hadir (7 Hari)</span>
          <span className="font-bold text-blue-600 dark:text-blue-400 tabular-nums">{totalAktivitasHadir} kehadiran</span>
        </div>
      </div>
    </div>
  );
}
