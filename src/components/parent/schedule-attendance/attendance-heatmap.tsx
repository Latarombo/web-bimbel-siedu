"use client";

import React from "react";
import { useAttendance, type PresensiRecord } from "./attendance-context";
import { Card, CardPad } from "@/components/ui/card";
import { useTranslations, useLocale } from "next-intl";

export function AttendanceHeatmap() {
  const { state } = useAttendance();
  const tr = useTranslations("parent");
  const locale = useLocale();

  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(currentYear, currentMonth, i + 1);
    return {
      date: d,
      dateString: d.toISOString().split("T")[0],
      dayOfWeek: d.getDay(),
    };
  });

  const recordMap = new Map<string, PresensiRecord[]>();
  state.records.forEach((r) => {
    const dateStr = r.tanggal.split("T")[0];
    if (!recordMap.has(dateStr)) {
      recordMap.set(dateStr, []);
    }
    recordMap.get(dateStr)?.push(r);
  });

  const getStatusColor = (records: PresensiRecord[] | undefined) => {
    if (!records || records.length === 0) return "bg-slate-100";
    if (records.some((r) => r.status === "alpa")) return "bg-rose-500";
    if (records.some((r) => r.status === "sakit" || r.status === "izin")) return "bg-amber-400";
    return "bg-emerald-500";
  };

  const dayHeaders = locale === "en"
    ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
    : ["Min", "Sen", "Sel", "Rab", "Kam", "Jum", "Sab"];

  const monthLabel = today.toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });

  return (
    <Card className="mt-4">
      <CardPad className="py-4">
        <h3 className="text-sm font-semibold mb-4 text-slate-800">
          {tr("attendanceHeatmap")} ({monthLabel})
        </h3>
        <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-slate-400 mb-2">
          {dayHeaders.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {/* Empty slots for first week */}
          {Array.from({ length: days[0].dayOfWeek }).map((_, i) => (
            <div key={`empty-${i}`} className="aspect-square rounded-md bg-transparent" />
          ))}

          {days.map((day) => {
            const records = recordMap.get(day.dateString);
            const colorClass = getStatusColor(records);
            const hasData = records && records.length > 0;

            return (
              <div
                key={day.dateString}
                title={hasData ? `${day.dateString}: ${records.length} sesi` : day.dateString}
                className={`aspect-square rounded-md flex items-center justify-center text-[10px] font-semibold transition-colors ${colorClass} ${
                  hasData ? "text-white cursor-pointer hover:opacity-80" : "text-slate-400"
                }`}
              >
                {day.date.getDate()}
              </div>
            );
          })}
        </div>

        <div className="mt-4 flex items-center justify-center gap-4 text-[10px] text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></span> {tr("text116")}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-amber-400"></span> {tr("text117")}/{tr("text118")}
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-500"></span> {tr("text119")}
          </div>
        </div>
      </CardPad>
    </Card>
  );
}
