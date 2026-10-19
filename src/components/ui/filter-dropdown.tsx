"use client";

import * as React from "react";
import { ChevronDown } from "lucide-react";
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
  /** Custom label displayed on the trigger (defaults to selected option's label or placeholder) */
  triggerLabel?: string;
  /** Prefix label shown before the value, e.g. "Status: " or "Urutkan: " */
  prefixLabel?: string;
  icon?: React.ReactNode;
  align?: "start" | "end" | "center";
  className?: string;
  triggerClassName?: string;
  contentClassName?: string;
  size?: "sm" | "md";
  disabled?: boolean;
  ariaLabel?: string;
}

export function FilterDropdown<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Pilih...",
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
}: FilterDropdownProps<T>) {
  const selectedOption = options.find((opt) => opt.value === value);
  const displayLabel = triggerLabel ?? selectedOption?.label ?? placeholder;

  return (
    <div className={cn("inline-block", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            aria-label={ariaLabel ?? displayLabel}
            className={cn(
              "group inline-flex items-center justify-between gap-2 bg-white border border-slate-200 text-slate-700 font-semibold transition-all hover:border-slate-300 hover:bg-slate-50/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/20 focus-visible:border-brand cursor-pointer shadow-2xs select-none disabled:opacity-50 disabled:pointer-events-none",
              size === "sm"
                ? "h-8.5 px-3 text-xs rounded-xl"
                : "h-11 px-3.5 text-base sm:text-sm rounded-xl",
              triggerClassName
            )}
          >
            <div className="flex items-center gap-1.5 truncate">
              {icon && (
                <span className="text-slate-400 size-3.5 shrink-0 flex items-center justify-center">
                  {icon}
                </span>
              )}
              {prefixLabel && (
                <span className="text-slate-400 font-normal shrink-0">
                  {prefixLabel}
                </span>
              )}
              <span className="truncate">{displayLabel}</span>
            </div>
            <ChevronDown
              className="size-3.5 text-slate-400 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180 group-data-[state=open]:text-brand"
              aria-hidden="true"
            />
          </button>
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align={align}
          className={cn("min-w-[180px] p-1.5", contentClassName)}
        >
          <DropdownMenuRadioGroup
            value={value}
            onValueChange={(val) => onChange(val as T)}
          >
            {options.map((opt) => (
              <DropdownMenuRadioItem key={opt.value} value={opt.value}>
                <div className="flex items-center gap-2 truncate">
                  {opt.icon && (
                    <span className="size-4 shrink-0 text-slate-400">
                      {opt.icon}
                    </span>
                  )}
                  <span className="truncate">{opt.label}</span>
                </div>
              </DropdownMenuRadioItem>
            ))}
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
