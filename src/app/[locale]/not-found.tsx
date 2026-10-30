import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Compass, Home, BookOpen, LayoutDashboard, HelpCircle } from "lucide-react";
import { auth } from "@/lib/auth";
import { Link } from "@/i18n/navigation";
import { ButtonLink } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("common.notFound");
  const session = await auth();
  const role = session?.user?.role;

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

        {/* Visual Compass Badge */}
        <div className="mb-6 flex size-20 items-center justify-center rounded-2xl bg-brand-soft text-brand shadow-sm ring-8 ring-brand-soft/50">
          <Compass className="size-10 animate-pulse text-brand" />
        </div>

        {/* 404 Status Pill */}
        <span className="mb-3 inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold tracking-wider text-slate-600 uppercase">
          {t("badge")} Error
        </span>

        {/* Title */}
        <h1 className="font-(family-name:--font-jakarta) mb-3 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
          {t("title")}
        </h1>

        {/* Description */}
        <p className="mb-8 text-sm leading-relaxed text-body sm:text-base">
          {t("description")}
        </p>

        {/* Action Buttons - Role Adaptive */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {role === "admin" ? (
            <ButtonLink href="/admin/dashboard" size="lg" className="h-11 px-6 font-medium shadow-sm">
              <LayoutDashboard className="mr-2 size-4" />
              {t("backDashboardAdmin")}
            </ButtonLink>
          ) : role === "guru" ? (
            <ButtonLink href="/teacher/dashboard" size="lg" className="h-11 px-6 font-medium shadow-sm">
              <LayoutDashboard className="mr-2 size-4" />
              {t("backDashboardTeacher")}
            </ButtonLink>
          ) : role === "orang_tua" ? (
            <ButtonLink href="/home" size="lg" className="h-11 px-6 font-medium shadow-sm">
              <LayoutDashboard className="mr-2 size-4" />
              {t("backDashboardParent")}
            </ButtonLink>
          ) : (
            <>
              <ButtonLink href="/" size="lg" className="h-11 px-6 font-medium shadow-sm">
                <Home className="mr-2 size-4" />
                {t("backHome")}
              </ButtonLink>
              <ButtonLink href="/classes" variant="outline" size="lg" className="h-11 px-6 font-medium">
                <BookOpen className="mr-2 size-4" />
                {t("exploreClasses")}
              </ButtonLink>
            </>
          )}
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
