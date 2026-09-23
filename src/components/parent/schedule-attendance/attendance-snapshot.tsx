"use client";

import React from "react";
import { Pie, PieChart, Cell, ResponsiveContainer } from "recharts";
import { useAttendance } from "./attendance-context";
import { Card, CardPad } from "@/components/ui/card";
import { useTranslations } from "next-intl";

const COLORS = {
  hadir: "#10b981", // emerald-500
  izin: "#f59e0b", // amber-500
  sakit: "#f59e0b", // amber-500
  alpa: "#f43f5e", // rose-500
};

export function AttendanceSnapshot() {
  const { state } = useAttendance();
  const tr = useTranslations("parent");

  const data = [
    { name: tr("text116"), value: state.summary.hadir, color: COLORS.hadir },
    { name: tr("text117"), value: state.summary.izin, color: COLORS.izin },
    { name: tr("text118"), value: state.summary.sakit, color: COLORS.sakit },
    { name: tr("text119"), value: state.summary.alpa, color: COLORS.alpa },
  ].filter((d) => d.value > 0);

  const percentage = state.summary.total > 0
    ? Math.round((state.summary.hadir / state.summary.total) * 100)
    : 0;

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      {/* Donut Chart Card */}
      <Card className="sm:col-span-1">
        <CardPad className="flex flex-col items-center justify-center py-6 h-full">
          <div className="relative h-32 w-32">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={60}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-bold text-slate-900">{percentage}%</span>
              <span className="text-[10px] uppercase font-semibold text-slate-500">{tr("text116")}</span>
            </div>
          </div>
        </CardPad>
      </Card>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 gap-4 sm:col-span-2">
        {(["hadir", "izin", "sakit", "alpa"] as const).map((s) => (
          <Card
            key={s}
            className={`border-l-4 ${
              s === "hadir"
                ? "border-l-emerald-500"
                : s === "alpa"
                  ? "border-l-rose-500"
                  : "border-l-amber-500"
            }`}
          >
            <CardPad className="py-4">
              <p className="text-xs font-semibold uppercase text-muted">
                {s === "hadir" ? tr("text116") : s === "izin" ? tr("text117") : s === "sakit" ? tr("text118") : tr("text119")}
              </p>
              <p className="mt-1 text-2xl font-bold">{state.summary[s]}</p>
            </CardPad>
          </Card>
        ))}
      </div>
    </div>
  );
}
