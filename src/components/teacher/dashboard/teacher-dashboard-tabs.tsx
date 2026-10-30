"use client";

import { useState, type ReactNode } from "react";
import { CalendarDays, BookOpen, BarChart3 } from "lucide-react";

interface TeacherDashboardTabsProps {
  agendaContent: ReactNode;
  classesContent: ReactNode;
  analyticsContent: ReactNode;
  todaySessionsCount: number;
  pendingGradingCount: number;
  activeClassesCount: number;
  labels: {
    agendaTab: string;
    classesTab: string;
    analyticsTab: string;
  };
}

export function TeacherDashboardTabs({
  agendaContent,
  classesContent,
  analyticsContent,
  todaySessionsCount,
  pendingGradingCount,
  activeClassesCount,
  labels,
}: TeacherDashboardTabsProps) {
  const [activeTab, setActiveTab] = useState<"agenda" | "classes" | "analytics">("agenda");

  return (
    <div className="space-y-6">
      {/* Tab Navigation Header */}
      <div className="border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-lg px-2 sm:px-4">
        <nav
          className="flex space-x-1 sm:space-x-6 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Navigasi Bagian Dashboard"
        >
          {/* Tab 1: Agenda & Tugas */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "agenda"}
            aria-controls="panel-agenda"
            id="tab-agenda"
            onClick={() => setActiveTab("agenda")}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === "agenda"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-700"
            }`}
          >
            <CalendarDays className="size-4 shrink-0" />
            <span>{labels.agendaTab}</span>
            {pendingGradingCount > 0 ? (
              <span className="ml-1 inline-flex items-center justify-center rounded-md bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 text-xs font-bold px-1.5 py-0.5">
                {pendingGradingCount}
              </span>
            ) : todaySessionsCount > 0 ? (
              <span className="ml-1 inline-flex items-center justify-center rounded-md bg-blue-100 dark:bg-blue-950/60 text-blue-800 dark:text-blue-300 text-xs font-bold px-1.5 py-0.5">
                {todaySessionsCount}
              </span>
            ) : null}
          </button>

          {/* Tab 2: Daftar Kelas */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "classes"}
            aria-controls="panel-classes"
            id="tab-classes"
            onClick={() => setActiveTab("classes")}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === "classes"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-700"
            }`}
          >
            <BookOpen className="size-4 shrink-0" />
            <span>{labels.classesTab}</span>
            <span className="ml-1 inline-flex items-center justify-center rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-medium px-1.5 py-0.5">
              {activeClassesCount}
            </span>
          </button>

          {/* Tab 3: Analitik Kehadiran */}
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === "analytics"}
            aria-controls="panel-analytics"
            id="tab-analytics"
            onClick={() => setActiveTab("analytics")}
            className={`flex items-center gap-2 py-3.5 px-3 border-b-2 text-sm font-semibold whitespace-nowrap transition-colors cursor-pointer min-h-[44px] ${
              activeTab === "analytics"
                ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500"
                : "border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-100 dark:hover:border-slate-700"
            }`}
          >
            <BarChart3 className="size-4 shrink-0" />
            <span>{labels.analyticsTab}</span>
          </button>
        </nav>
      </div>

      {/* Tab Panels */}
      <div className="tab-content">
        {activeTab === "agenda" && (
          <div
            id="panel-agenda"
            role="tabpanel"
            aria-labelledby="tab-agenda"
            className="space-y-6 focus:outline-hidden"
          >
            {agendaContent}
          </div>
        )}

        {activeTab === "classes" && (
          <div
            id="panel-classes"
            role="tabpanel"
            aria-labelledby="tab-classes"
            className="space-y-6 focus:outline-hidden"
          >
            {classesContent}
          </div>
        )}

        {activeTab === "analytics" && (
          <div
            id="panel-analytics"
            role="tabpanel"
            aria-labelledby="tab-analytics"
            className="space-y-6 focus:outline-hidden"
          >
            {analyticsContent}
          </div>
        )}
      </div>
    </div>
  );
}
