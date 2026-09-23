"use client";

import { useMemo, useState } from "react";
import { useSchedule } from "./schedule-context";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "next-intl";

const URUTAN_HARI = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function ScheduleHeader() {
  const { state, actions } = useSchedule();
  const tr = useTranslations("parent");

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
      <h3 className="text-sm font-bold text-slate-900">{tr("scheduleTitle")}</h3>
      <div className="inline-flex rounded-md shadow-sm" role="group">
        <button
          type="button"
          onClick={() => actions.setViewMode("daily")}
          className={`px-4 py-1.5 text-xs font-medium rounded-l-lg border ${
            state.viewMode === "daily"
              ? "z-10 bg-brand text-white border-brand hover:bg-brand/90"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-brand"
          }`}
        >
          {tr("dailyAgenda")}
        </button>
        <button
          type="button"
          onClick={() => actions.setViewMode("weekly")}
          className={`px-4 py-1.5 text-xs font-medium rounded-r-lg border-y border-r border-l-0 ${
            state.viewMode === "weekly"
              ? "z-10 bg-brand text-white border-brand hover:bg-brand/90"
              : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:text-brand"
          }`}
        >
          {tr("weeklyGrid")}
        </button>
      </div>
    </div>
  );
}

const HARI_LABEL_EN: Record<string, string> = {
  Senin: "Monday",
  Selasa: "Tuesday",
  Rabu: "Wednesday",
  Kamis: "Thursday",
  Jumat: "Friday",
  Sabtu: "Saturday",
  Minggu: "Sunday",
};

export function DailyAgenda() {
  const { state } = useSchedule();
  const tr = useTranslations("parent");
  const locale = useLocale();

  // Smart initial day: today if today has classes, else first day that has classes, else today
  const defaultHari = useMemo(() => {
    const dayNames = ["Minggu", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
    const nowDay = dayNames[new Date().getDay()];
    if (state.records.some((r) => r.hari === nowDay)) return nowDay;
    const firstWithRecord = URUTAN_HARI.find((h) => state.records.some((r) => r.hari === h));
    return firstWithRecord ?? nowDay;
  }, [state.records]);

  const [selectedHari, setSelectedHari] = useState<string>(defaultHari);

  // Sync when records change or first loaded
  const [prevDefaultHari, setPrevDefaultHari] = useState(defaultHari);
  if (defaultHari !== prevDefaultHari) {
    setPrevDefaultHari(defaultHari);
    setSelectedHari(defaultHari);
  }

  const recordsForHari = state.records.filter((r) => r.hari === selectedHari);

  // Pre-calculate count per day
  const countByDay = useMemo(() => {
    const map = new Map<string, number>();
    state.records.forEach((r) => {
      map.set(r.hari, (map.get(r.hari) ?? 0) + 1);
    });
    return map;
  }, [state.records]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
      {/* Day Selector */}
      <div className="flex overflow-x-auto pb-2 mb-6 scrollbar-hide gap-2 sm:gap-2.5">
        {URUTAN_HARI.map((hari) => {
          const count = countByDay.get(hari) ?? 0;
          const hasRecord = count > 0;
          const isSelected = selectedHari === hari;
          const labelHari = locale === "en" ? HARI_LABEL_EN[hari] ?? hari : hari;
          return (
            <button
              key={hari}
              type="button"
              onClick={() => setSelectedHari(hari)}
              className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-2 cursor-pointer ${
                isSelected
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600 ring-offset-2"
                  : hasRecord
                    ? "bg-white border border-slate-200/90 text-slate-800 hover:border-blue-300 hover:bg-blue-50/40 shadow-xs"
                    : "bg-slate-100/80 text-slate-400 opacity-60 border border-transparent hover:opacity-90"
              }`}
            >
              <span>{labelHari}</span>
              {hasRecord ? (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold tabular-nums ${
                    isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-blue-800"
                  }`}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      {recordsForHari.length === 0 ? (
        <Card className="mt-4 border-dashed border-slate-200 bg-slate-50/50">
          <CardPad className="py-12 text-center">
            <div className="mx-auto size-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
              📅
            </div>
            <p className="text-base font-bold text-slate-800">{tr("text171")}</p>
            <p className="mx-auto mt-1 max-w-sm text-xs sm:text-sm text-muted">
              {tr("noScheduleForDay", {
                day: locale === "en" ? HARI_LABEL_EN[selectedHari] ?? selectedHari : selectedHari,
              })}
            </p>
          </CardPad>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {recordsForHari.map((r) => (
            <li key={r.id}>
              <Card className="border-l-4 border-l-brand relative overflow-hidden">
                <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-slate-50 to-transparent pointer-events-none" />
                <CardPad className="flex flex-wrap items-center justify-between gap-3 relative z-10">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-xs font-bold text-brand bg-brand/10 px-2 py-0.5 rounded">
                        {r.jamMulai.slice(0,5)} - {r.jamSelesai.slice(0,5)}
                      </p>
                      {r.ruangan && (
                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-700 border border-blue-200/60">
                          🚪 {r.ruangan}
                        </span>
                      )}
                    </div>
                    <p className="font-bold text-slate-900 text-sm">
                      {r.mapel}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500 flex items-center gap-1.5">
                      <span className="font-medium text-slate-700">{r.anak}</span> 
                      <span>•</span> 
                      <span>{tr("text173")} {r.guru}</span>
                    </p>
                  </div>
                  <Badge tone="slate">{r.jenjang}</Badge>
                </CardPad>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function WeeklyGrid() {
  const { state } = useSchedule();
  const locale = useLocale();

  const recordsByDay = useMemo(() => {
    const map = new Map<string, typeof state.records>();
    URUTAN_HARI.forEach((h) => map.set(h, []));
    state.records.forEach((r) => {
      const arr = map.get(r.hari);
      if (arr) arr.push(r);
    });
    return map;
  }, [state.records]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 duration-500 overflow-x-auto pb-4">
      <div className="min-w-[700px] border border-slate-200 rounded-lg bg-white overflow-hidden">
        <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200 divide-x divide-slate-200">
          {URUTAN_HARI.map((hari) => (
            <div key={hari} className="p-3 text-center text-xs font-bold text-slate-700 uppercase tracking-wider">
              {locale === "en" ? HARI_LABEL_EN[hari] ?? hari : hari}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7 divide-x divide-slate-200 min-h-[300px] bg-slate-50/30">
          {URUTAN_HARI.map(hari => {
            const dayRecords = recordsByDay.get(hari) || [];
            return (
              <div key={hari} className="p-2 space-y-2">
                {dayRecords.map(r => (
                  <div key={r.id} className="bg-white border border-slate-200 shadow-sm rounded-md p-2 hover:border-brand/40 transition-colors">
                    <p className="text-[10px] font-bold text-brand mb-1">
                      {r.jamMulai.slice(0,5)}
                    </p>
                    <p className="text-xs font-semibold text-slate-800 leading-tight mb-1">
                      {r.mapel}
                    </p>
                    <p className="text-[10px] text-slate-500 line-clamp-1">
                      {r.anak}
                    </p>
                    {r.ruangan && (
                      <p className="text-[10px] text-slate-400 mt-1 line-clamp-1">
                        🚪 {r.ruangan}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
