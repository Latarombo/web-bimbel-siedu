"use client";

import { useState } from "react";
import { Link as LinkIcon, Check } from "lucide-react";

interface CopySectionLinkButtonProps {
  id: string;
  copyLinkLabel?: string;
  copiedLabel?: string;
}

export function CopySectionLinkButton({
  id,
  copyLinkLabel = "Salin tautan pasal",
  copiedLabel = "Tautan tersalin!",
}: CopySectionLinkButtonProps) {
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
  );
}
