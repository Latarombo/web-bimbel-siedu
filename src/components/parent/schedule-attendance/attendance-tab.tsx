"use client";

import React from "react";
import { AttendanceProvider, PresensiRecord } from "./attendance-context";
import { AttendanceSnapshot } from "./attendance-snapshot";
import { AttendanceHeatmap } from "./attendance-heatmap";
import { AttendanceHistory } from "./attendance-history";

export function AttendanceTab({ records }: { records: PresensiRecord[] }) {
  return (
    <AttendanceProvider records={records}>
      <div className="mt-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
        <AttendanceSnapshot />
        <AttendanceHeatmap />
        <AttendanceHistory />
      </div>
    </AttendanceProvider>
  );
}
