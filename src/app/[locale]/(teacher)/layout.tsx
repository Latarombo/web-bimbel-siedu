import { getTranslations, getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import AdminSidebar, { type NavSection } from "@/components/admin/AdminSidebar";
import { dalamJendela7Hari } from "@/lib/hari";

export const dynamic = "force-dynamic";

export default async function TeacherLayout({ children }: { children: React.ReactNode }) {
  const t = await getTranslations("teacher");
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/dashboard", locale });
  // Tembok dalam: proxy cek role guru untuk /teacher/*; dicek lagi di sini (lapis kedua).
  if (session.user.role !== "guru") {
    return redirect({ href: session.user.role === "admin" ? "/admin/dashboard" : "/home", locale });
  }
  const guruId = Number(session.user.id);

  // Badge nav = angka NYATA dari DB (anti-fake): entri milik guru yang sudah
  // terkunci (perlu koreksi admin) + siswa di kelasnya yang belum punya
  // nilai sama sekali.
  const [kelas, pendaftaran, nilai, presensi] = await Promise.all([
    collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all()),
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);
  const kelasIds = new Set(kelas.map((k) => k.id));
  const siswaAktif = pendaftaran.filter(
    (p) => p.kelasId !== undefined && kelasIds.has(p.kelasId) && ["terdaftar", "tertunggak"].includes(p.status),
  );
  const punyaNilai = new Set(nilai.map((n) => n.pendaftaranId));
  const siswaBelumNilai = siswaAktif.filter((p) => !punyaNilai.has(p.id)).length;
  const terkunci =
    nilai.filter((n) => !dalamJendela7Hari(n.createdAt)).length +
    presensi.filter((x) => !dalamJendela7Hari(x.createdAt)).length;

  const NAV_SECTIONS: NavSection[] = [
    {
      label: t("teaching"),
      items: [
        { name: t("dashboard"), href: "/teacher/dashboard", icon: "grid" },
        { name: t("assignedClassesTitle"), href: "/teacher/classes", icon: "layers", badge: kelas.filter((k) => k.status === "aktif").length },
        { name: t("gradesTitle"), href: "/teacher/grades", icon: "chart", badge: siswaBelumNilai },
        { name: t("corrections"), href: "/teacher/corrections", icon: "clipboard", badge: terkunci },
      ],
    },
    {
      label: t("account"),
      items: [{ name: t("profile"), href: "/teacher/profile", icon: "users" }],
    },
  ];

  return (
    <div className="min-h-dvh bg-slate-50">
      <AdminSidebar role={t("teacher")} userName={session.user.name ?? t("teacher")} userEmail={session.user.email} accountRole={session.user.role} navSections={NAV_SECTIONS} />
      <main id="main" className="lg:pl-64">
        {children}
      </main>
    </div>
  );
}
