import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { HelpCircle } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common.notFound");

  return (
    <div className="flex min-h-[calc(100vh-4rem)] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center">
        {/* 404 Illustration */}
        <div className="mb-6 w-full px-2">
          <Image
            src="/404.png"
            alt={t("title")}
            width={1774}
            height={887}
            className="h-auto w-full object-contain"
            priority
          />
        </div>

        {/* Title */}
        <h1 className="font-(family-name:--font-jakarta) mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>

        {/* Description */}
        <p className="mb-8 max-w-md text-sm leading-relaxed text-body sm:text-base">
          {t("description")}
        </p>

        {/* Action Button - Single & Standard */}
        <div className="flex justify-center">
          <ButtonLink href="/" size="lg" className="h-11 px-6 font-medium shadow-sm">
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
