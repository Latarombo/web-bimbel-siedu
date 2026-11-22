"use client";

import * as React from "react";
import { ChevronDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface FilterDropdownOption<T extends string = string> {
  value: T;
  label: string;
  icon?: React.ReactNode;
}

export interface FilterDropdownProps<T extends string = string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly FilterDropdownOption<T>[];
  placeholder?: string;
  triggerLabel?: string;
  prefixLabel?: string;
  icon?: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  ariaLabel?: string;
  enableSearch?: boolean; // Defaults to true if options.length >= 10
  portal?: boolean;
  container?: Element | DocumentFragment | null;
}

export function FilterDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Pilih…",
  triggerLabel,
  prefixLabel,
  icon,
  align = "start",
  className,
  triggerClassName,
  contentClassName,
  size = "md",
  disabled = false,
  ariaLabel,
  enableSearch,
  portal,
  container,
}: FilterDropdownProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const isSm = size === "sm";

  const shouldSearch = enableSearch ?? options.length >= 10;

  const filteredOptions = React.useMemo(() => {
    if (!shouldSearch || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter((opt) => opt.label.toLowerCase().includes(q));
  }, [options, searchQuery, shouldSearch]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = triggerLabel ?? selectedOption?.label ?? placeholder;

  return (
    <div className={cn("inline-block", className)}>
      <DropdownMenu onOpenChange={(open) => {
        if (!open) setSearchQuery("");
      }}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            aria-label={ariaLabel ?? (prefixLabel ? `${prefixLabel} ${displayLabel}` : displayLabel)}
            className={cn(
              "group inline-flex items-center justify-between gap-2 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 text-slate-800 dark:text-slate-200 font-semibold transition-colors select-none cursor-pointer shadow-2xs disabled:opacity-50 disabled:pointer-events-none",
              "hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/70 dark:hover:bg-slate-800/60",
              "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
              isSm
                ? "h-9 px-3 text-xs sm:text-sm rounded-lg"
                : "h-11 sm:h-10 px-3.5 text-base sm:text-sm rounded-lg",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-1.5 truncate">
              {icon && (
                <span className="text-slate-400 size-3.5 shrink-0 flex items-center justify-center" aria-hidden="true">
                  {icon}
                </span>
              )}
              {prefixLabel && (
                <span className="text-slate-500 dark:text-slate-400 font-normal shrink-0">
                  {prefixLabel}
                </span>
              )}
              <span className="truncate">{displayLabel}</span>
            </div>
            <ChevronDown
              className="size-3.5 text-slate-400 shrink-0 transition-transform duration-150 group-data-[state=open]:rotate-180 group-data-[state=open]:text-brand"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          sideOffset={6}
          portal={portal}
          container={container}
          className={cn("min-w-[180px] max-w-xs rounded-lg p-1.5 duration-150", contentClassName)}
        >
          {shouldSearch ? (
            <div
              className="relative mb-1.5 px-1 pt-0.5"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                autoFocus
                placeholder="Cari opsi…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-1.5 pl-8 pr-2.5 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand"
              />
            </div>
          ) : null}

          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(val) => onChange(val as T)}
            className="max-h-60 overflow-y-auto overscroll-contain space-y-0.5"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <DropdownMenuRadioItem key={opt.value} value={opt.value} className="rounded-md">
                  <div className="flex items-center gap-2 truncate">
                    {opt.icon && (
                      <span className="size-4 shrink-0 text-slate-400" aria-hidden="true">
                        {opt.icon}
                      </span>
                    )}
                    <span className="truncate">{opt.label}</span>
                  </div>
                </DropdownMenuRadioItem>
              ))
            ) : (
              <p className="px-3 py-3 text-center text-xs text-slate-400 dark:text-slate-500">
                Tidak ada opsi yang cocok.
              </p>
            )}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
