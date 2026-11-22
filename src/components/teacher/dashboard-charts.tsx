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
import { cn } from "@/lib/utils";

export type RekapSlice = { key: string; label: string; value: number; color: string };
export type HariAktivitas = {
  label: string;
  hadir: number;
  izin?: number;
  sakit?: number;
  alpa?: number;
  total?: number;
  rate?: number;
  fill?: string;
  fullLabel?: string;
};

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
    <ChartContainer config={config} className="h-[192px] w-full">
      <BarChart
        data={data}
        margin={{ top: 8, right: 8, left: -20, bottom: 0 }}
        barCategoryGap="20%"
      >
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
              formatter={(value, _, item) => {
                const p = item.payload as HariAktivitas | undefined;
                const hadirVal = Number(value);
                const izinVal = Number(p?.izin ?? 0);
                const sakitVal = Number(p?.sakit ?? 0);
                const alpaVal = Number(p?.alpa ?? 0);
                const totalVal = Number(p?.total ?? hadirVal);
                const rateVal = p?.rate !== undefined ? Number(p.rate) : (totalVal > 0 ? Math.round((hadirVal / totalVal) * 100) : 100);

                return (
                  <div className="flex flex-col gap-1.5 text-xs min-w-36">
                    <div className="flex items-center justify-between gap-4">
                      <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                        <span className="size-2 rounded-full shrink-0 bg-blue-600" />
                        Hadir:
                      </span>
                      <span className="font-bold text-slate-950 dark:text-slate-50 tabular-nums">
                        {hadirVal} siswa
                      </span>
                    </div>

                    {izinVal > 0 || sakitVal > 0 ? (
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="size-2 rounded-full shrink-0 bg-amber-500" />
                          Izin/Sakit:
                        </span>
                        <span className="font-medium text-amber-700 dark:text-amber-400 tabular-nums">
                          {izinVal + sakitVal} siswa
                        </span>
                      </div>
                    ) : null}

                    {alpaVal > 0 ? (
                      <div className="flex items-center justify-between gap-4">
                        <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                          <span className="size-2 rounded-full shrink-0 bg-rose-500" />
                          Alpa:
                        </span>
                        <span className="font-medium text-rose-700 dark:text-rose-400 tabular-nums">
                          {alpaVal} siswa
                        </span>
                      </div>
                    ) : null}

                    {totalVal > 0 ? (
                      <div className="pt-1.5 mt-0.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                        <span>Tingkat Hadir:</span>
                        <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">{rateVal}%</span>
                      </div>
                    ) : null}
                  </div>
                );
              }}
            />
          }
        />
        <Bar dataKey="hadir" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={48}>
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

export interface TrenKehadiranCardProps {
  aktivitasData: HariAktivitas[];
  title: string;
  subtitle: string;
  overallAttendanceRate?: number;
  totalAktivitasHadir?: number;
  totalAktivitasIzinSakit?: number;
  totalAktivitasAlpa?: number;
  totalPresensi7Hari?: number;
  emptyTitle?: string;
  emptyDesc?: string;
  className?: string;
}

/** Kartu grafik tren kehadiran 7 hari terakhir. */
export function TrenKehadiranCard({
  aktivitasData,
  title,
  subtitle,
  overallAttendanceRate = 100,
  totalAktivitasHadir = 0,
  totalAktivitasIzinSakit = 0,
  totalAktivitasAlpa = 0,
  totalPresensi7Hari = 0,
  emptyTitle = "Belum ada presensi 7 hari terakhir",
  emptyDesc = "Presensi yang Anda catat saat sesi mengajar akan langsung terangkum dalam grafik tren ini.",
  className,
}: TrenKehadiranCardProps) {
  const hasData = totalPresensi7Hari > 0 || totalAktivitasHadir > 0;

  return (
    <div
      className={cn(
        "flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs w-full h-full",
        className,
      )}
    >
      <div>
        {/* Header: Judul & Persentase Tingkat Kehadiran */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="font-display text-sm sm:text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
              {title}
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block uppercase tracking-wider">
              Tingkat Hadir
            </span>
            <div className="flex items-baseline justify-end gap-1 mt-0.5">
              <span
                className={`text-2xl sm:text-3xl font-extrabold tracking-tight tabular-nums ${
                  overallAttendanceRate >= 90
                    ? "text-emerald-700 dark:text-emerald-400"
                    : overallAttendanceRate >= 75
                    ? "text-amber-700 dark:text-amber-400"
                    : "text-rose-700 dark:text-rose-400"
                }`}
              >
                {overallAttendanceRate}%
              </span>
            </div>
          </div>
        </div>

        {/* Stat Strip Ringkasan 7 Hari (Multi-status) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4">
          <div className="flex flex-col rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Hadir</span>
            <span className="mt-1 text-base sm:text-lg font-bold text-slate-950 dark:text-slate-50 tabular-nums">
              {totalAktivitasHadir} <span className="text-xs font-normal text-slate-500">siswa</span>
            </span>
          </div>

          <div className="flex flex-col rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Izin / Sakit</span>
            <span className={`mt-1 text-base sm:text-lg font-bold tabular-nums ${totalAktivitasIzinSakit > 0 ? "text-amber-700 dark:text-amber-400" : "text-slate-950 dark:text-slate-50"}`}>
              {totalAktivitasIzinSakit} <span className="text-xs font-normal text-slate-500">siswa</span>
            </span>
          </div>

          <div className="flex flex-col rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Alpa</span>
            <span className={`mt-1 text-base sm:text-lg font-bold tabular-nums ${totalAktivitasAlpa > 0 ? "text-rose-700 dark:text-rose-400" : "text-slate-950 dark:text-slate-50"}`}>
              {totalAktivitasAlpa} <span className="text-xs font-normal text-slate-500">siswa</span>
            </span>
          </div>

          <div className="flex flex-col rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Total Presensi</span>
            <span className="mt-1 text-base sm:text-lg font-bold text-slate-950 dark:text-slate-50 tabular-nums">
              {totalPresensi7Hari} <span className="text-xs font-normal text-slate-500">catatan</span>
            </span>
          </div>
        </div>
      </div>

      {/* Visualisasi Grafik atau State Kosong */}
      <div className="pt-4 mt-auto">
        {hasData ? (
          <AktivitasMingguanBar data={aktivitasData} label="Siswa Hadir" />
        ) : (
          <div className="flex h-[192px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 dark:border-slate-800 p-6 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
              {emptyTitle}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
              {emptyDesc}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export interface RekapPresensiCardProps {
  rekapData: RekapSlice[];
  totalPresensi: number;
  title: string;
  subtitle?: string;
  noAttendanceYet: string;
  noAttendanceDesc: string;
}

/** Kartu ringkasan distribusi status presensi siswa. */
export function RekapPresensiCard({
  rekapData,
  totalPresensi,
  title,
  subtitle,
  noAttendanceYet,
  noAttendanceDesc,
}: RekapPresensiCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 sm:p-6 shadow-2xs">
      <div>
        <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-display text-sm sm:text-base font-bold text-slate-950 dark:text-slate-50 tracking-tight">
            {title}
          </h3>
          {subtitle ? (
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
              {subtitle}
            </p>
          ) : null}
        </div>

        <div className="mt-4">
          {totalPresensi > 0 ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-full flex justify-center">
                <RekapPresensiDonut data={rekapData} total={totalPresensi} />
              </div>

              {/* Status metrik diletakkan di bawah chart donut (Jumlah Saja) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full pt-2">
                {rekapData.map((item) => (
                  <div
                    key={item.key}
                    className="flex flex-col rounded-lg border border-slate-100 dark:border-slate-800/80 bg-slate-50/70 dark:bg-slate-800/40 p-2 text-center"
                  >
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-600 dark:text-slate-400">
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
            <div className="py-8 text-center">
              <div className="grid size-12 place-items-center rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400 mx-auto mb-2">
                <PieChartIcon className="size-6 stroke-[1.5]" />
              </div>
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100">{noAttendanceYet}</p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 max-w-xs mx-auto mt-1">
                {noAttendanceDesc}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
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
  totalAktivitasHadir,
  overallAttendanceRate,
  labels,
}: TeacherAnalyticsSectionProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <RekapPresensiCard
        rekapData={rekapData}
        totalPresensi={totalPresensi}
        title={labels.distributionTitle}
        subtitle="Proporsi status kehadiran siswa semester ini."
        noAttendanceYet={labels.noAttendanceYet}
        noAttendanceDesc={labels.noAttendanceDesc}
      />
      <TrenKehadiranCard
        aktivitasData={aktivitasData}
        title={labels.weeklyTrendTitle}
        subtitle={labels.weeklyTrendSubtitle}
        totalAktivitasHadir={totalAktivitasHadir}
        overallAttendanceRate={overallAttendanceRate}
      />
    </div>
  );
}
