import { getTranslations, getLocale } from "next-intl/server";
import { cookies } from "next/headers";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { TeacherShell } from "@/components/teacher/teacher-shell";
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

  const cookieStore = await cookies();
  const initialCollapsed = cookieStore.get("siedu_teacher_sidebar_collapsed")?.value === "true";
  const guruId = Number(session.user.id);

  // Badge nav = angka NYATA dari DB (anti-fake): siswa aktif yang belum punya
  // hasil "dinilai" di satu pun Penilaian guru + presensi yang sudah terkunci >7 hari + kelas aktif.
  const kelas = await collect(db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all());
  const kelasIdsArray = kelas.map((k) => k.id);
  const kelasIds = new Set(kelasIdsArray);

  const [pendaftaran, penilaian, presensi] = await Promise.all([
    kelasIdsArray.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in(kelasIdsArray)).all())
      : Promise.resolve([]),
    collect(db.orm.public.Penilaian.where((p) => p.dibuatOleh.eq(guruId)).all()),
    collect(db.orm.public.Presensi.where((x) => x.dicatatOleh.eq(guruId)).all()),
  ]);

  const penilaianIdsArray = penilaian.map((p) => p.id);
  const penilaianIds = new Set(penilaianIdsArray);

  const hasil = penilaianIdsArray.length
    ? await collect(db.orm.public.HasilPenilaian.where((h) => h.penilaianId.in(penilaianIdsArray)).all())
    : [];

  const siswaAktif = pendaftaran.filter(
    (p) => p.kelasId !== undefined && kelasIds.has(p.kelasId) && ["terdaftar", "tertunggak"].includes(p.status),
  );
  const sudahDinilai = new Set(
    hasil.filter((h) => penilaianIds.has(h.penilaianId) && h.statusHasil === "dinilai").map((h) => h.pendaftaranId),
  );
  const siswaBelumNilai = siswaAktif.filter((p) => !sudahDinilai.has(p.id)).length;
  const terkunci = presensi.filter((x) => !dalamJendela7Hari(x.createdAt)).length;
  const kelasAktif = kelas.filter((k) => k.status === "aktif").length;

  return (
    <TeacherShell
      role={t("teacher")}
      userName={session.user.name ?? t("teacher")}
      userEmail={session.user.email ?? null}
      accountRole={session.user.role}
      initialCollapsed={initialCollapsed}
      badgeCounts={{
        kelasAktif: kelasAktif,
        siswaBelumNilai: siswaBelumNilai,
        presensiTerkunci: terkunci,
      }}
    >
      {children}
    </TeacherShell>
  );
}
