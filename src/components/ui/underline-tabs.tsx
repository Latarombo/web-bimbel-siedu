"use client";

import { LayoutGroup, motion, useReducedMotion } from "motion/react";
import React, { useId } from "react";

export interface UnderlineTabItem<T extends string = string> {
  id: T;
  label: React.ReactNode;
  ariaLabel?: string;
  count?: number;
  badge?: React.ReactNode;
}

export interface UnderlineTabsProps<T extends string = string> {
  tabs: readonly UnderlineTabItem<T>[] | UnderlineTabItem<T>[];
  activeTab: T;
  onChange: (id: T) => void;
  ariaLabel?: string;
  layoutId?: string;
  className?: string;
  navClassName?: string;
  tabClassName?: string;
  indicatorClassName?: string;
}

export function UnderlineTabs<T extends string = string>({
  tabs,
  activeTab,
  onChange,
  ariaLabel = "Tabs",
  layoutId,
  className = "",
  navClassName = "",
  tabClassName = "",
  indicatorClassName = "",
}: UnderlineTabsProps<T>) {
  const autoId = useId();
  const groupId = layoutId ?? `underline-tabs-${autoId}`;
  const shouldReduceMotion = useReducedMotion();

  return (
    <div
      className={`border-b border-slate-200 dark:border-slate-800 overflow-x-auto scrollbar-none ${className}`}
    >
      <LayoutGroup id={groupId}>
        <nav
          className={`flex space-x-6 sm:space-x-8 min-w-max ${navClassName}`}
          aria-label={ariaLabel}
          role="tablist"
        >
          {tabs.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                aria-label={tab.ariaLabel}
                onClick={() => onChange(tab.id)}
                className={`relative pb-3 text-xs sm:text-sm font-semibold transition-colors cursor-pointer select-none whitespace-nowrap focus-visible:outline-none focus-visible:text-blue-600 dark:focus-visible:text-blue-400 ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-700 dark:text-slate-400 hover:text-slate-950 dark:hover:text-slate-100"
                } ${tabClassName}`}
              >
                <span className="flex items-center gap-2">
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span
                      className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                        isActive
                          ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                          : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      }`}
                    >
                      {tab.count}
                    </span>
                  )}
                  {tab.badge}
                </span>

                {isActive && (
                  <motion.div
                    layoutId={`${groupId}-active-indicator`}
                    className={`absolute -bottom-px left-0 right-0 h-[3px] bg-blue-600 dark:bg-blue-400 z-10 rounded-full ${indicatorClassName}`}
                    transition={
                      shouldReduceMotion
                        ? { duration: 0 }
                        : { type: "spring", stiffness: 400, damping: 32 }
                    }
                  />
                )}
              </button>
            );
          })}
        </nav>
      </LayoutGroup>
    </div>
  );
}
