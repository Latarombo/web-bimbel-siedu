"use client";

import React, { useState, useRef, useEffect, useId, useMemo } from "react";
import { useTranslations } from "next-intl";
import { ChevronsUpDown, Check, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface CardSelectOption {
  value: string;
  label: string;
  description?: string;
  badge?: string;
  disabled?: boolean;
}

export interface CardSelectProps {
  id?: string;
  name?: string;
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  options: readonly CardSelectOption[];
  placeholder?: string;
  icon?: React.ReactNode;
  disabled?: boolean;
  required?: boolean;
  ariaInvalid?: boolean;
  ariaDescribedby?: string;
  className?: string;
  modalTitle?: string;
  searchable?: boolean;
  size?: "sm" | "md";
}

export function CardSelect({
  id,
  name,
  value: controlledValue,
  defaultValue,
  onChange,
  options,
  placeholder = "Pilih salah satu...",
  icon,
  disabled = false,
  required = false,
  ariaInvalid,
  ariaDescribedby,
  className,
  modalTitle = "Pilih Opsi",
  searchable,
  size = "md",
}: CardSelectProps) {
  const t = useTranslations('common');
  const generatedId = useId();
  const inputId = id || generatedId;
  const isControlled = controlledValue !== undefined;

  const [internalValue, setInternalValue] = useState<string>(
    controlledValue ?? defaultValue ?? ""
  );
  const selectedValue = isControlled ? (controlledValue ?? "") : internalValue;

  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Selected option details
  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === selectedValue),
    [options, selectedValue]
  );

  // Auto-detect searchability: enabled if explicitly true or if options > 8
  const isSearchable = searchable ?? options.length > 8;

  // Filtered options based on query
  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.description && opt.description.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle wheel scrolling over the entire popover so that whenever cursor is over
  // the popover (including search bar, headers, padding), it scrolls the option list
  useEffect(() => {
    const popoverEl = popoverRef.current;
    const listEl = listRef.current;
    if (!isOpen || !popoverEl || !listEl) return;

    const onWheel = (e: WheelEvent) => {
      const canScrollUp = listEl.scrollTop > 0;
      const canScrollDown =
        listEl.scrollTop < listEl.scrollHeight - listEl.clientHeight - 1;

      // If cursor is outside the list container (e.g. over search input, header, padding),
      // forward the scroll to listEl
      if (!listEl.contains(e.target as Node) || e.target === listEl) {
        if ((e.deltaY < 0 && canScrollUp) || (e.deltaY > 0 && canScrollDown)) {
          listEl.scrollTop += e.deltaY;
          e.preventDefault();
        }
      } else {
        // Cursor is over an option item inside listEl:
        // Prevent default if it would chain scroll to background window at boundaries
        if ((e.deltaY < 0 && !canScrollUp) || (e.deltaY > 0 && !canScrollDown)) {
          e.preventDefault();
        }
      }
      e.stopPropagation();
    };

    popoverEl.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      popoverEl.removeEventListener("wheel", onWheel);
    };
  }, [isOpen]);

  // Focus search input on open
  const [prevIsOpen, setPrevIsOpen] = useState(isOpen);
  if (isOpen !== prevIsOpen) {
    setPrevIsOpen(isOpen);
    if (isOpen) {
      setSearchQuery("");
      setActiveIndex(options.findIndex((opt) => opt.value === selectedValue));
    }
  }

  useEffect(() => {
    if (!isOpen || !isSearchable) return;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 50);
    return () => clearTimeout(timer);
  }, [isOpen, isSearchable]);

  // Handle select option
  const handleSelect = (option: CardSelectOption) => {
    if (option.disabled) return;
    if (!isControlled) {
      setInternalValue(option.value);
    }
    onChange?.(option.value);
    setIsOpen(false);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (!isOpen) {
      if (e.key === "Enter" || e.key === " " || e.key === "ArrowDown") {
        e.preventDefault();
        setIsOpen(true);
      }
      return;
    }

    switch (e.key) {
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "ArrowDown":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev < filteredOptions.length - 1 ? prev + 1 : 0
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setActiveIndex((prev) =>
          prev > 0 ? prev - 1 : filteredOptions.length - 1
        );
        break;
      case "Enter":
        e.preventDefault();
        if (activeIndex >= 0 && activeIndex < filteredOptions.length) {
          handleSelect(filteredOptions[activeIndex]);
        }
        break;
      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={cn("relative w-full", className)}
      onKeyDown={handleKeyDown}
    >
      {/* Hidden input untuk integrasi form native / Server Actions */}
      {name && (
        <input
          type="hidden"
          name={name}
          value={selectedValue}
          required={required}
        />
      )}

      {/* Input Trigger Button (Desain Card seragam persis DatePicker) */}
      <button
        id={inputId}
        type="button"
        disabled={disabled}
        onClick={() => {
          if (!disabled) setIsOpen((prev) => !prev);
        }}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        aria-invalid={ariaInvalid}
        aria-describedby={ariaDescribedby}
        className={cn(
          "w-full flex items-center justify-between text-left rounded-xl transition-all duration-200 cursor-pointer select-none bg-white",
          size === "sm" ? "px-3.5 py-2.5 text-sm" : "px-3.5 py-3 text-base",
          "border border-slate-200 hover:border-slate-300",
          isOpen
            ? "border-blue-400 ring-4 ring-blue-100 shadow-xs"
            : "focus:outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100",
          disabled && "bg-slate-50 opacity-60 cursor-not-allowed pointer-events-none",
          ariaInvalid && "border-rose-400 focus:ring-rose-100"
        )}
      >
        <div className="flex items-center gap-3 overflow-hidden min-w-0">
          {icon && (
            <span className="shrink-0 text-slate-400 grid place-items-center">
              {icon}
            </span>
          )}
          <span
            className={cn(
              "truncate",
              size === "sm" ? "text-sm" : "text-sm sm:text-base",
              selectedOption
                ? size === "sm"
                  ? "text-slate-800"
                  : "text-slate-800 font-medium"
                : "text-slate-400"
            )}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </div>
        <ChevronsUpDown
          className="w-4 h-4 text-slate-400 shrink-0 ml-2"
          aria-hidden="true"
        />
      </button>

      {/* Popover Card & Mobile Bottom Sheet */}
      {isOpen && (
        <>
          {/* Mobile Backdrop (< 640px) */}
          <div
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 sm:hidden transition-opacity"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Popover / Bottom Sheet Content */}
          <div
            ref={popoverRef}
            role="listbox"
            aria-label={modalTitle}
            className={cn(
              // Base styling
              "bg-white z-50 transition-all flex flex-col",
              // Mobile (<640px): Bottom Sheet Modal
              "fixed inset-x-0 bottom-0 rounded-t-3xl p-5 max-h-[85vh] overflow-y-auto sm:max-h-none sm:overflow-visible shadow-2xl",
              // Desktop (>=640px): Popover Floating Card
              "sm:absolute sm:inset-auto sm:top-full sm:left-0 sm:mt-2 sm:w-full sm:rounded-2xl sm:p-2 sm:border sm:border-slate-200 sm:shadow-xl sm:shadow-slate-950/20"
            )}
          >
            {/* Mobile Handle & Close Bar */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-slate-100 sm:hidden">
              <span className="font-bold text-slate-800 text-base">
                {modalTitle}
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                aria-label={t('close')}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Kotak Pencarian Cepat (jika opsi > 8 atau searchable=true) */}
            {isSearchable && (
              <div className="relative mb-2 shrink-0">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                  <Search className="size-4 text-slate-400" />
                </div>
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setActiveIndex(0);
                  }}
                  placeholder={t('searchOptions')}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:border-blue-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-100"
                />
              </div>
            )}

            {/* List Daftar Opsi */}
            <div
              ref={listRef}
              className="overflow-y-auto max-h-60 sm:max-h-64 space-y-1 pr-1 overscroll-contain [scrollbar-width:thin] [scrollbar-color:#cbd5e1_transparent] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-slate-300 hover:[&::-webkit-scrollbar-thumb]:bg-slate-400"
            >
              {filteredOptions.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-400">
                  {t('noMatchingOptions')}
                </div>
              ) : (
                filteredOptions.map((opt, idx) => {
                  const isSelected = opt.value === selectedValue;
                  const isActive = idx === activeIndex;

                  return (
                    <div
                      key={opt.value}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => handleSelect(opt)}
                      onMouseEnter={() => {
                        if (activeIndex !== idx) setActiveIndex(idx);
                      }}
                      className={cn(
                        "flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm transition-colors cursor-pointer select-none",
                        opt.disabled
                          ? "opacity-40 cursor-not-allowed pointer-events-none"
                          : isSelected
                            ? "bg-blue-50/90 text-blue-700 font-bold border border-blue-200/80 shadow-2xs"
                            : isActive
                              ? "bg-slate-100/80 text-slate-900 font-medium"
                              : "hover:bg-slate-50 text-slate-700 font-medium"
                      )}
                    >
                      <div className="min-w-0 flex-1 pr-2">
                        <div className="flex items-center gap-2">
                          <span className="truncate">{opt.label}</span>
                          {opt.badge && (
                            <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                              {opt.badge}
                            </span>
                          )}
                        </div>
                        {opt.description && (
                          <p className="text-xs text-slate-400 font-normal truncate mt-0.5">
                            {opt.description}
                          </p>
                        )}
                      </div>

                      {isSelected && (
                        <Check
                          className="size-4 text-blue-600 shrink-0 stroke-[2.5]"
                          aria-hidden="true"
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default CardSelect;
