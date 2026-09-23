import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import ChildInfoForm from "@/components/ChildInfoForm";
import WaveAnimation from "@/components/WaveAnimation";
import AuthTopBar from "@/components/auth/top-bar";
import { SITE } from "@/lib/site";

export const dynamic = "force-dynamic";

export default async function NewChildPage() {
  const tAuth = await getTranslations("auth");
  const tParent = await getTranslations("parent");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login?next=/children/new", locale });
    return null;
  }

  const ortuId = Number(session.user.id);
  const parent = await db.orm.public.User.where({ id: ortuId }).first();

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400">
      {/* Top Bar Bersih & Navigatif (Logo di Kiri, Bantuan & Bahasa di Kanan) */}
      <div className="z-20 w-full max-w-7xl mx-auto">
        <AuthTopBar homeHref="/home" />
      </div>

      {/* Main Content — Form Card Kompak & Elegan Pas di Tengah Layar */}
      <div className="grow flex flex-col items-center justify-center my-auto px-4 py-8 sm:px-6 sm:py-12 lg:px-8 z-10 w-full max-w-7xl mx-auto">
        <div className="w-full flex justify-center items-center">
          <ChildInfoForm
            parentPhone={parent?.nomorTelepon ?? ""}
            title={tParent("bentoAddChildTitle")}
            subtitle={tParent("addChildSubtitle")}
            submitLabel={tParent("saveChildProfile")}
            redirectTo="/children"
            backHref="/children"
            backLabel={tParent("cancelBackChildren")}
            showSkip={false}
          />
        </div>
      </div>

      {/* Wave Animation */}
      <WaveAnimation />

      {/* Footer */}
      <footer className="px-4 py-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center text-white text-xs sm:text-sm z-10 gap-2 w-full max-w-7xl mx-auto">
        <p className="text-center sm:text-left text-white/85">
          {tAuth("copyright", { year: new Date().getFullYear(), name: SITE.nama })}
        </p>
        <div className="flex items-center space-x-4 text-white/85">
          <Link href="/privacy-policy" className="hover:text-white transition-colors">
            {tAuth("privacy")}
          </Link>
          <span className="hidden sm:inline opacity-60">•</span>
          <Link href="/terms" className="hover:text-white transition-colors">
            {tAuth("terms")}
          </Link>
        </div>
      </footer>

      {/* Decorative Background Elements */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        <div className="absolute top-0 right-0 size-96 rounded-full bg-cyan-100 mix-blend-overlay filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 size-96 rounded-full bg-blue-200 mix-blend-overlay filter blur-3xl opacity-80 translate-y-1/2 -translate-x-1/2" />
      </div>
    </div>
  );
}
