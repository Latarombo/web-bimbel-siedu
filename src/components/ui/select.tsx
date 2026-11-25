"use client";

import * as React from "react";
import { ChevronDown, Search, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface SelectProps<T extends string = string> {
  id?: string;
  name?: string;
  value: T;
  onChange: (value: T) => void;
  options: readonly SelectOption<T>[];
  placeholder?: string;
  prefixLabel?: string;
  ariaLabel?: string;
  disabled?: boolean;
  required?: boolean;
  size?: "sm" | "md";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: "start" | "end" | "center";
  enableSearch?: boolean; // Defaults to true if options.length >= 10
  portal?: boolean; // Defaults to true (or false inside NativeDialog)
  container?: Element | DocumentFragment | null;
}

export function Select<T extends string = string>({
  id,
  name,
  value,
  onChange,
  options,
  placeholder = "Pilih opsi…",
  prefixLabel,
  ariaLabel,
  disabled = false,
  required = false,
  size = "md",
  className,
  triggerClassName,
  contentClassName,
  align = "start",
  enableSearch,
  portal,
  container,
}: SelectProps<T>) {
  const [searchQuery, setSearchQuery] = React.useState("");
  const isSm = size === "sm";

  // Auto-enable search if 10+ items unless explicitly overridden
  const shouldSearch = enableSearch ?? options.length >= 10;

  const filteredOptions = React.useMemo(() => {
    if (!shouldSearch || !searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchQuery, shouldSearch]);

  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = selectedOption?.label ?? placeholder;

  return (
    <div className={cn("relative inline-block w-full", className)}>
      {/* Hidden input for form submission compatibility */}
      {name ? (
        <input
          type="hidden"
          name={name}
          value={value}
          required={required}
        />
      ) : null}

      <DropdownMenu onOpenChange={(open) => {
        if (!open) setSearchQuery("");
      }}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            id={id}
            type="button"
            aria-label={ariaLabel ?? (prefixLabel ? `${prefixLabel} ${displayLabel}` : displayLabel)}
            className={cn(
              "group flex w-full items-center justify-between gap-2 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-900 text-left font-medium text-slate-900 dark:text-slate-100 transition-colors select-none cursor-pointer",
              "hover:border-slate-400 dark:hover:border-slate-500 hover:bg-slate-50/70 dark:hover:bg-slate-800/60",
              "focus-visible:outline-none focus-visible:border-brand focus-visible:ring-2 focus-visible:ring-brand/20",
              "disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed",
              isSm
                ? "h-9 px-3 text-xs sm:text-sm"
                : "h-11 sm:h-10 px-3 sm:px-4 text-base sm:text-sm",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-2 truncate min-w-0">
              {prefixLabel && (
                <span className="text-slate-500 dark:text-slate-400 font-normal shrink-0">
                  {prefixLabel}
                </span>
              )}
              <span
                className={cn(
                  "truncate",
                  !selectedOption && "text-slate-400 dark:text-slate-500 font-normal"
                )}
              >
                {displayLabel}
              </span>
            </div>
            <ChevronDown
              className="size-4 shrink-0 text-slate-400 transition-transform duration-150 group-data-[state=open]:rotate-180 group-data-[state=open]:text-brand"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          sideOffset={8}
          portal={portal}
          container={container}
          className={cn(
            "min-w-[12rem] w-[var(--radix-dropdown-menu-trigger-width)] max-w-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-2 shadow-xl duration-150",
            contentClassName
          )}
        >
          {/* Integrated search filter when options >= 10 */}
          {shouldSearch ? (
            <div
              className="relative mb-2 px-1 pt-0.5"
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => e.stopPropagation()}
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400 pointer-events-none" aria-hidden="true" />
              <input
                type="text"
                autoFocus
                placeholder="Cari opsi…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.stopPropagation()} // Prevent closing/navigating Radix menu while typing in search
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80 py-2 pl-8 pr-3 text-xs sm:text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus-visible:outline-none focus-visible:border-brand focus-visible:ring-1 focus-visible:ring-brand"
              />
            </div>
          ) : null}

          {/* Option List */}
          <DropdownMenuRadioGroup
            data-lenis-prevent
            value={value}
            onValueChange={(val) => onChange(val as T)}
            className="max-h-60 overflow-y-auto overscroll-contain space-y-0.5"
          >
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <DropdownMenuRadioItem
                  key={opt.value}
                  value={opt.value}
                  disabled={opt.disabled}
                  className="rounded-md px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-950 dark:hover:white cursor-pointer focus:bg-slate-100 dark:focus:bg-slate-800"
                >
                  <div className="flex flex-col gap-0.5 truncate min-w-0 pr-2">
                    <div className="flex items-center gap-2 truncate">
                      {opt.icon && <span className="size-4 shrink-0 text-slate-400">{opt.icon}</span>}
                      <span className="truncate font-medium">{opt.label}</span>
                    </div>
                    {opt.description && (
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {opt.description}
                      </span>
                    )}
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
