import { getTranslations, getLocale } from "next-intl/server";
import { Link, redirect } from "@/i18n/navigation";
import Image from "next/image";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import ChildInfoForm from "@/components/ChildInfoForm";
import WaveAnimation from "@/components/WaveAnimation";
import { LanguageSwitcher } from "@/components/language-switcher";
import { SITE } from "@/lib/site";
import { ArrowLeft, HelpCircle } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function NewChildPage() {
  const tr = await getTranslations("parent");
  const tAuth = await getTranslations("auth");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) {
    redirect({ href: "/login?next=/children/new", locale });
    return null;
  }

  const ortuId = Number(session.user.id);
  const parent = await db.orm.public.User.where({ id: ortuId }).first();

  const isEn = locale.startsWith("en");

  return (
    <div className="relative flex min-h-dvh flex-col overflow-x-clip overflow-y-auto bg-linear-to-br from-blue-700 via-blue-600 to-cyan-400">
      {/* Top Bar Bersih & Navigatif (Tombol Kembali di Kiri, Bantuan & Bahasa di Kanan) */}
      <header className="flex items-center justify-between px-4 pt-6 pb-2 sm:px-6 sm:pt-8 lg:px-8 z-20 w-full max-w-7xl mx-auto">
        {/* Sisi Kiri: Tombol Kembali (Lingkaran Putih) */}
        <div className="flex items-center">
          <Link
            href="/children"
            className="grid size-9 sm:size-10 place-items-center rounded-full bg-white text-slate-800 hover:bg-slate-50 shadow-md transition-transform active:scale-95 shrink-0"
            aria-label={isEn ? "Back to Children List" : "Kembali ke Daftar Anak"}
            title={isEn ? "Back to Children List" : "Kembali ke Daftar Anak"}
          >
            <ArrowLeft className="size-4 sm:size-5" aria-hidden />
          </Link>
        </div>

        {/* Sisi Kanan: Bantuan + Switch Bahasa */}
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/#faq"
            className="flex items-center justify-center gap-2 bg-white text-slate-800 hover:bg-slate-50 shadow-md transition-all active:scale-95 rounded-full sm:rounded-xl size-9 sm:size-auto sm:px-4 sm:py-2 text-xs sm:text-sm font-medium"
            title={tAuth("help")}
            aria-label={tAuth("help")}
          >
            <HelpCircle className="size-4 sm:size-4.5 text-slate-600 shrink-0" />
            <span className="hidden sm:inline">{tAuth("help")}</span>
          </Link>
          <LanguageSwitcher variant="auth" placement="bottom" align="right" />
        </div>
      </header>

      {/* Main Content — Logo Besar di Tengah, Diikuti Form Card */}
      <div className="grow flex flex-col items-center my-auto px-4 pt-2 pb-12 sm:px-6 sm:pt-4 sm:pb-16 lg:px-8 z-10 w-full max-w-7xl mx-auto">
        {/* Logo Siedu Putih Besar di Tengah (Di Atas Form Card) */}
        <div className="mb-5 sm:mb-7 flex justify-center">
          <Link
            href="/home"
            className="inline-flex items-center transition-transform hover:scale-105 active:scale-95"
            aria-label={tAuth("homeAria")}
          >
            <Image
              src="/images/Logo-white.png"
              alt="Siedu"
              width={180}
              height={54}
              className="h-10 sm:h-12 md:h-14 w-auto drop-shadow-lg"
              priority
            />
          </Link>
        </div>

        {/* Form Card Kompak & Elegan Pas di Tengah Layar */}
        <div className="w-full flex justify-center items-center">
          <ChildInfoForm
            parentPhone={parent?.nomorTelepon ?? ""}
            title={isEn ? "Add Child Profile" : "Tambah Profil Anak"}
            subtitle={
              isEn
                ? "Enter your child's information to get started with classes."
                : "Masukkan informasi putra-putri Anda untuk memulai bimbingan belajar."
            }
            submitLabel={isEn ? "Save Profile" : "Simpan Profil Anak"}
            redirectTo="/children"
            backHref="/children"
            backLabel={isEn ? "Cancel & Back to Children List" : "Batal & Kembali ke Daftar Anak"}
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
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-100 rounded-full mix-blend-overlay filter blur-3xl opacity-60 -translate-y-1/2 translate-x-1/2" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-overlay filter blur-3xl opacity-80 translate-y-1/2 -translate-x-1/2" />
    </div>
  );
}
