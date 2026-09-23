"use client";

import React, { createContext, use, useState } from "react";

export interface JadwalRecord {
  id: string; // pendaftaranId-jadwalId
  hari: string; // Senin, Selasa, dst
  jamMulai: string; // HH:mm
  jamSelesai: string; // HH:mm
  mapel: string;
  guru: string;
  ruangan?: string | null;
  anak: string;
  jenjang: string;
}

interface ScheduleState {
  records: JadwalRecord[];
  viewMode: "daily" | "weekly";
}

interface ScheduleActions {
  setViewMode: (mode: "daily" | "weekly") => void;
}

interface ScheduleContextValue {
  state: ScheduleState;
  actions: ScheduleActions;
}

const ScheduleContext = createContext<ScheduleContextValue | null>(null);

export function ScheduleProvider({
  children,
  records,
}: {
  children: React.ReactNode;
  records: JadwalRecord[];
}) {
  const [viewMode, setViewMode] = useState<"daily" | "weekly">("daily");

  return (
    <ScheduleContext value={{ state: { records, viewMode }, actions: { setViewMode } }}>
      {children}
    </ScheduleContext>
  );
}

export function useSchedule() {
  const context = use(ScheduleContext);
  if (!context) {
    throw new Error("useSchedule must be used within ScheduleProvider");
  }
  return context;
}
