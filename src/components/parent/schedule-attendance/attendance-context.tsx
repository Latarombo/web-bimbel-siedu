"use client";

import React, { createContext, use } from "react";

export interface PresensiRecord {
  id: string; // s.id
  tanggal: string; // ISO string
  status: "hadir" | "izin" | "sakit" | "alpa";
  mapel: string;
  anak: string;
  catatan?: string | null;
  materi?: string | null;
  pr?: string | null;
}

interface AttendanceState {
  records: PresensiRecord[];
  summary: {
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
    total: number;
  };
}

interface AttendanceContextValue {
  state: AttendanceState;
}

const AttendanceContext = createContext<AttendanceContextValue | null>(null);

export function AttendanceProvider({
  children,
  records,
}: {
  children: React.ReactNode;
  records: PresensiRecord[];
}) {
  const summary = React.useMemo(() => {
    const s = { hadir: 0, izin: 0, sakit: 0, alpa: 0, total: records.length };
    records.forEach((r) => {
      if (s[r.status] !== undefined) {
        s[r.status]++;
      }
    });
    return s;
  }, [records]);

  return (
    <AttendanceContext value={{ state: { records, summary } }}>
      {children}
    </AttendanceContext>
  );
}

export function useAttendance() {
  const context = use(AttendanceContext);
  if (!context) {
    throw new Error("useAttendance must be used within AttendanceProvider");
  }
  return context;
}
