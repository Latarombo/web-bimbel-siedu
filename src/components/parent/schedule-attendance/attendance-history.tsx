"use client";

import React, { useState } from "react";
import { useAttendance } from "./attendance-context";
import { Card, CardPad } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useTranslations, useLocale } from "next-intl";

import { FilterDropdown } from "@/components/ui/filter-dropdown";

export function AttendanceHistory() {
  const { state } = useAttendance();
  const tr = useTranslations("parent");
  const locale = useLocale();
  const [filter, setFilter] = useState<"semua" | "hadir" | "izin" | "sakit" | "alpa">("semua");

  const filteredRecords = filter === "semua" 
    ? state.records 
    : state.records.filter((r) => r.status === filter);

  const statusLabels: Record<string, string> = {
    hadir: tr("text116"),
    izin: tr("text117"),
    sakit: tr("text118"),
    alpa: tr("text119"),
  };

  const filterOptions = [
    { value: "semua" as const, label: tr("allStatuses") },
    { value: "hadir" as const, label: tr("text116") },
    { value: "izin" as const, label: tr("text117") },
    { value: "sakit" as const, label: tr("text118") },
    { value: "alpa" as const, label: tr("text119") },
  ];

  return (
    <div className="mt-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-bold text-slate-900">{tr("attendanceHistory")}</h3>
        <FilterDropdown
          value={filter}
          onChange={(val) => setFilter(val)}
          options={filterOptions}
          size="sm"
          align="end"
        />
      </div>

      {filteredRecords.length === 0 ? (
        <Card>
          <CardPad className="py-10 text-center">
            <p className="text-sm text-muted">{tr("text177")}</p>
          </CardPad>
        </Card>
      ) : (
        <ul className="grid gap-3">
          {filteredRecords.map((r) => {
            const tone = r.status === "hadir" ? "emerald" : r.status === "alpa" ? "red" : "amber";
            return (
              <li key={r.id}>
                <Card>
                  <CardPad className="py-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">
                          {new Date(r.tanggal).toLocaleDateString(
                            locale === "en" ? "en-GB" : "id-ID",
                            { weekday: "long", day: "numeric", month: "long" }
                          )}
                        </p>
                        <p className="text-xs text-muted mt-0.5">
                          {r.mapel} — {r.anak}
                        </p>
                      </div>
                      <Badge tone={tone}>{statusLabels[r.status]}</Badge>
                    </div>

                    {/* Feed-style Teacher Notes & Materials (Directly visible) */}
                    {(r.catatan || r.materi || r.pr) && (
                      <div className="mt-3.5 space-y-2">
                        {r.catatan && (
                          <div className="rounded-lg border border-slate-200/70 bg-slate-50 px-3 py-2.5 text-xs text-slate-700">
                            <span className="font-semibold text-slate-600 block mb-0.5">💬 {tr("teacherNote")}</span>
                            <span className="leading-relaxed">{r.catatan}</span>
                          </div>
                        )}
                        {(r.materi || r.pr) && (
                          <div className="rounded-lg border border-blue-100 bg-blue-50/50 px-3 py-2.5 text-xs text-slate-700 space-y-2">
                            {r.materi && (
                              <div>
                                <span className="font-semibold text-blue-900 block mb-0.5">📚 {tr("sessionMaterials")}</span>
                                <span className="leading-relaxed">{r.materi}</span>
                              </div>
                            )}
                            {r.pr && (
                              <div className={r.materi ? "border-t border-blue-100/70 pt-2" : ""}>
                                <span className="font-semibold text-blue-900 block mb-0.5">📝 {tr("sessionHomework")}</span>
                                <span className="leading-relaxed">{r.pr}</span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}
                  </CardPad>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
