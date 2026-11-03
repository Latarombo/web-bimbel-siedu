import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { TeacherShell } from "@/components/teacher/teacher-shell";
import type {
  QuickSearchClassItem,
  QuickSearchStudentItem,
} from "@/components/teacher/teacher-quick-search";

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

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("siedu_teacher_sidebar_collapsed")?.value === "true";
  const guruId = Number(session.user.id);

  // Search dataset: classes & active students
  const kelas = await collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all());
  const kelasIdsArray = kelas.map((k) => k.id);
  const kelasIds = new Set(kelasIdsArray);

  const [pendaftaran, mapel] = await Promise.all([
    kelasIdsArray.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIdsArray)).all())
      : Promise.resolve([]),
    collect(db.orm.public.MataPelajaran.all()),
  ]);

  const mapelById = new Map(mapel.map((m) => [m.id, m.nama]));

  const siswaAktif = pendaftaran.filter(
    (p) => p.kelasId !== undefined && kelasIds.has(p.kelasId) && ["terdaftar", "tertunggak"].includes(p.status),
  );

  const searchClasses: QuickSearchClassItem[] = kelas.map((k) => ({
    id: k.id,
    name: mapelById.get(k.mataPelajaranId) ?? `Kelas #${k.id}`,
    jenjang: k.jenjang,
    tingkat: k.tingkat,
  }));

  const activeAnakIds = [...new Set(siswaAktif.map((s) => s.anakId))];
  const anakList = activeAnakIds.length
    ? await collect(db.orm.public.Anak.where((a) => a.id.in(activeAnakIds)).all())
    : [];
  const anakById = new Map(anakList.map((a) => [a.id, a.nama]));
  const kelasNamaById = new Map(
    kelas.map((k) => [k.id, mapelById.get(k.mataPelajaranId) ?? `Kelas #${k.id}`])
  );

  const searchStudents: QuickSearchStudentItem[] = siswaAktif.map((s) => ({
    id: s.id,
    nama: anakById.get(s.anakId) ?? `Siswa #${s.anakId}`,
    kelasNama: (s.kelasId ? kelasNamaById.get(s.kelasId) : undefined) ?? "Kelas",
  }));

  return (
    <TeacherShell
      role={t("teacher")}
      userName={session.user.name ?? t("teacher")}
      userEmail={session.user.email ?? null}
      accountRole={session.user.role}
      initialCollapsed={initialCollapsed}
      searchClasses={searchClasses}
      searchStudents={searchStudents}
    >
      {children}
    </TeacherShell>
  );
}
