'use client';

import { useEffect } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { AlertTriangle, RefreshCw, Home, HelpCircle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Button, ButtonLink } from "@/components/ui/button";

/**
 * Route-level Error Boundary untuk rute di bawah [locale].
 * Sesuai konvensi Next.js 16.3+, error boundary menggunakan prop retry() stabil.
 */
export default function ErrorBoundary({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  const t = useTranslations("common.error");

  useEffect(() => {
    // Log error untuk kebutuhan pemantauan & debugging
    console.error("[Siedu Error Boundary]:", error);
  }, [error]);

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex max-w-md flex-col items-center">
        {/* Brand Logo */}
        <Link href="/" className="mb-8 inline-flex items-center gap-2 transition-opacity hover:opacity-90">
          <Image
            src="/images/Logo.png"
            alt="Siedu"
            width={120}
            height={36}
            className="h-8 w-auto"
            priority
          />
        </Link>

        {/* Warning Icon Badge */}
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-amber-50 text-amber-600 shadow-sm ring-8 ring-amber-50/60 dark:bg-amber-950/40 dark:text-amber-400 dark:ring-amber-950/30">
          <AlertTriangle className="size-10 text-amber-600 dark:text-amber-400" />
        </div>

        {/* 500 Status Pill */}
        <span className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wider text-slate-600 uppercase">
          {t("badge")} Error
        </span>

        {/* Title */}
        <h1 className="font-(family-name:--font-jakarta) mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>

        {/* Description */}
        <p className="mb-6 text-sm leading-relaxed text-body sm:text-base">
          {t("description")}
        </p>

        {/* Error Digest (jika ada dari Next.js Server Components) */}
        {error.digest ? (
          <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-500 font-mono select-all">
            <span className="font-sans font-medium text-slate-700 mr-1.5">{t("digestLabel")}</span>
            #{error.digest}
          </div>
        ) : null}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button
            onClick={() => retry()}
            size="lg"
            className="h-11 px-6 font-medium shadow-sm"
          >
            <RefreshCw className="mr-2 size-4" />
            {t("retry")}
          </Button>
          <ButtonLink
            href="/"
            variant="outline"
            size="lg"
            className="h-11 px-6 font-medium"
          >
            <Home className="mr-2 size-4" />
            {t("backHome")}
          </ButtonLink>
        </div>

        {/* Help Link */}
        <div className="mt-8 flex items-center gap-1.5 text-xs text-muted">
          <HelpCircle className="size-3.5" />
          <span>{t("helpPrompt")}</span>
          <ButtonLink href="/contact" variant="link" className="h-auto p-0 text-xs font-medium text-brand">
            {t("contactUs")}
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
