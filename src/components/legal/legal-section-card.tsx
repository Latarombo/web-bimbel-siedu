"use client";

import { useState } from "react";
import { LucideIcon, Link as LinkIcon, Check } from "lucide-react";

interface LegalSectionCardProps {
  id: string;
  title: string;
  icon?: LucideIcon;
  copyLinkLabel?: string;
  copiedLabel?: string;
  children: React.ReactNode;
}

export function LegalSectionCard({
  id,
  title,
  icon: Icon,
  copyLinkLabel = "Salin tautan pasal",
  copiedLabel = "Tautan tersalin!",
  children,
}: LegalSectionCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      const url = `${window.location.origin}${window.location.pathname}#${id}`;
      navigator.clipboard.writeText(url).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }
  };

  return (
    <section
      id={id}
      className="scroll-mt-28 group relative rounded-2xl border border-slate-200/80 bg-white p-6 sm:p-8 shadow-2xs transition-all duration-200 hover:border-blue-200/80 hover:shadow-xs"
    >
      {/* Section Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-brand">
              <Icon className="size-4.5" />
            </div>
          )}
          <h2 className="text-lg font-bold leading-snug tracking-tight text-foreground sm:text-xl">
            {title}
          </h2>
        </div>

        {/* Copy Anchor Link Button */}
        <button
          type="button"
          onClick={handleCopyLink}
          aria-label={copied ? copiedLabel : copyLinkLabel}
          title={copied ? copiedLabel : copyLinkLabel}
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand focus:outline-hidden focus:ring-1 focus:ring-brand"
        >
          {copied ? (
            <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600">
              <Check className="size-3.5" />
              <span className="hidden sm:inline">{copiedLabel}</span>
            </span>
          ) : (
            <LinkIcon className="size-4 transition-transform group-hover:scale-110" />
          )}
        </button>
      </div>

      {/* Section Content */}
      <div className="mt-5 space-y-4 text-sm leading-relaxed text-body sm:text-base sm:leading-7">
        {children}
      </div>
    </section>
  );
}
