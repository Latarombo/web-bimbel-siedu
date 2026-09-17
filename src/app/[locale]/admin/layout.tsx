import { getLocale, getTranslations } from "next-intl/server";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import AdminSidebar, { type NavSection } from "@/components/admin/AdminSidebar";

// Konstanta status antrean — modul polos, bukan 'use server' (pitfall ekspor const).
// Sama dengan STATUS_MASALAH di halaman flagged (E6).
const PENDAFTARAN_MASALAH = ["tertunggak", "dibatalkan_timeout", "dibatalkan_tunggakan", "dibatalkan_kelas"];

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/dashboard", locale }) } }, locale });
  // Tembok dalam: proxy cek role admin untuk /admin/*; dicek di sini lagi (lapis kedua).
  if (session.user.role !== "admin") {
    return redirect({ href: session.user.role === "guru" ? "/teacher/dashboard" : "/home", locale });
  }

  // Badge counter = angka antrean NYATA dari DB (bukan hiasan). Tiga scan ringan;
  // tabel skala lembaga (ratusan baris), bukan jutaan.
  const [pendaftaran, pengajuanMenunggu, pesanBaru] = await Promise.all([
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.PengajuanPembatalan.where((p) => p.status.eq("menunggu")).all()),
    collect(db.orm.public.PesanKontak.where((p) => p.status.eq("baru")).all()),
  ]);
  const nPendaftaranMasalah = pendaftaran.filter((p) =>
    PENDAFTARAN_MASALAH.includes(p.status as string),
  ).length;

  // Grup nav: Operasional (antrean kerja) / Data Master / Komunikasi & Laporan.
  const NAV_SECTIONS: NavSection[] = [
    {
      label: t("text1"),
      items: [
        { name: t("text2"), href: "/admin/dashboard", icon: "grid" },
        {
          name: t("text3"),
          href: "/admin/enrollments/flagged",
          icon: "clipboard",
          badge: nPendaftaranMasalah,
        },
        { name: t("text4"), href: "/admin/refunds", icon: "inbox", badge: pengajuanMenunggu.length },
        { name: t("text5"), href: "/admin/corrections", icon: "check" },
        { name: t("text6"), href: "/admin/duplicate-children", icon: "copy" },
      ],
    },
    {
      label: t("text7"),
      items: [
        { name: t("text8"), href: "/admin/subjects", icon: "book" },
        { name: t("text9"), href: "/admin/periods", icon: "calendar" },
        { name: t("text10"), href: "/admin/teachers", icon: "users" },
        { name: t("text11"), href: "/admin/classes", icon: "layers" },
      ],
    },
    {
      label: t("text12"),
      items: [
        { name: t("text13"), href: "/admin/messages", icon: "mail", badge: pesanBaru.length },
        { name: t("text14"), href: "/admin/reports", icon: "chart" },
      ],
    },
  ];

  return (
    <div className="min-h-dvh bg-slate-50">
      <AdminSidebar role="Admin" userName={session.user.name ?? "Admin"} userEmail={session.user.email} accountRole={session.user.role} navSections={NAV_SECTIONS} />
      <main id="main" className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}
