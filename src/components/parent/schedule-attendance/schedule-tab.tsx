"use client";

import React from "react";
import { ScheduleProvider, JadwalRecord } from "./schedule-context";
import { ScheduleHeader, DailyAgenda, WeeklyGrid } from "./schedule-views";
import { useSchedule } from "./schedule-context";

// Inner component so it can consume the context.
function ScheduleContent() {
  const { state } = useSchedule();
  return (
    <div className="mt-6">
      <ScheduleHeader />
      {state.viewMode === "daily" ? <DailyAgenda /> : <WeeklyGrid />}
    </div>
  );
}

export function ScheduleTab({ records }: { records: JadwalRecord[] }) {
  return (
    <ScheduleProvider records={records}>
      <ScheduleContent />
    </ScheduleProvider>
  );
}
