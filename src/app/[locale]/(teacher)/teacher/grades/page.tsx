import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import {
  TeacherGradesView,
  type AssessmentItem,
  type StudentGradeItem,
  type ClassFilterOption,
} from "@/components/teacher/grades/teacher-grades-view";

export const dynamic = "force-dynamic";

export default async function TeacherGrades({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string; kelas?: string }>;
}) {
  const locale = await getLocale();
  const session = await auth();
  if (!session?.user) return redirect({ href: "/login?next=/teacher/grades", locale });
  const { tab = "tugas" } = await searchParams;
  const guruId = Number(session.user.id);

  // 1. Fetch teacher classes
  const kelas = await collect(
    db.orm.public.Kelas.where((k) => k.guruId.eq(guruId)).all(),
  );
  const kelasIds = new Set(kelas.map((k) => k.id));
  const mapel = await collect(db.orm.public.MataPelajaran.all());
  const mapelById = new Map(mapel.map((m) => [m.id, m]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));

  // 2. Fetch enrollments, students, and grading records
  const [semuaPendaftaran, semuaAnak, semuaNilai, semuaPenilaian, semuaHasil] = await Promise.all([
    kelas.length
      ? collect(db.orm.public.Pendaftaran.where((p) => p.kelasId.in([...kelasIds])).all())
      : Promise.resolve([]),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.NilaiProgres.where((n) => n.dicatatOleh.eq(guruId)).all()),
    collect(db.orm.public.Penilaian.where((p) => p.dibuatOleh.eq(guruId)).all()),
    collect(db.orm.public.HasilPenilaian.all()),
  ]);

  const anakById = new Map(semuaAnak.map((a) => [a.id, a]));

  // 3. Map assessment results by assessment ID
  const hasilByPenilaian = new Map<number, typeof semuaHasil>();
  for (const h of semuaHasil) {
    const arr = hasilByPenilaian.get(h.penilaianId) ?? [];
    arr.push(h);
    hasilByPenilaian.set(h.penilaianId, arr);
  }

  // 4. Transform Assessments list
  const assessmentItems: AssessmentItem[] = [...semuaPenilaian]
    .sort((a, b) => b.tanggal.localeCompare(a.tanggal))
    .map((p) => {
      const hList = hasilByPenilaian.get(p.id) ?? [];
      const k = kelasById.get(p.kelasId);
      const m = k ? mapelById.get(k.mataPelajaranId) : null;
      const countDinilai = hList.filter((x) => x.statusHasil === "dinilai").length;
      const countTidakIkut = hList.filter((x) => x.statusHasil === "tidak_ikut").length;
      const countBelum = hList.filter((x) => x.statusHasil === "belum_dinilai").length;

      return {
        id: p.id,
        nama: p.nama,
        kelasId: p.kelasId,
        kelasNama: m?.nama ?? `Kelas #${p.kelasId}`,
        jenjang: k?.jenjang ?? "SD",
        tingkat: k?.tingkat,
        tanggal: p.tanggal,
        nilaiMaksimum: Number(p.nilaiMaksimum),
        draf: p.draf,
        diterbitkanPada: p.diterbitkanPada,
        countDinilai,
        countTidakIkut,
        countBelum,
        totalSiswa: hList.length,
      };
    });

  // 5. Map student progress grades
  const nilaiByP = new Map<number, typeof semuaNilai>();
  for (const n of semuaNilai) {
    const arr = nilaiByP.get(n.pendaftaranId) ?? [];
    arr.push(n);
    nilaiByP.set(n.pendaftaranId, arr);
  }

  const activeStudents = semuaPendaftaran.filter((p) =>
    ["terdaftar", "tertunggak"].includes(p.status),
  );

  const studentGradeItems: StudentGradeItem[] = activeStudents.map((p) => {
    const nilai = (nilaiByP.get(p.id) ?? []).sort((a, b) => b.tanggal.localeCompare(a.tanggal));
    const k = kelas.find((x) => x.id === p.kelasId);
    const m = k ? mapelById.get(k.mataPelajaranId) : null;

    const rata = (() => {
      const num = nilai
        .filter((n) => n.nilaiKuantitatif != null)
        .map((n) => Number(n.nilaiKuantitatif));
      return num.length ? Math.round(num.reduce((s, v) => s + v, 0) / num.length) : null;
    })();

    const anak = anakById.get(p.anakId);

    return {
      id: p.id,
      anakId: p.anakId,
      nama: anak?.nama ?? `Siswa #${p.anakId}`,
      kelasId: p.kelasId ?? 0,
      kelasNama: m?.nama ?? `Kelas #${p.kelasId}`,
      jenjang: k?.jenjang ?? "SD",
      tingkat: k?.tingkat,
      jumlahNilai: nilai.length,
      rataRata: rata,
      nilaiTerakhir: nilai[0]?.tanggal ?? null,
      status: p.status,
    };
  });

  // 6. Stats calculation
  const studentsGraded = studentGradeItems.filter((s) => s.jumlahNilai > 0).length;
  const studentsUngraded = studentGradeItems.length - studentsGraded;

  const stats = {
    totalAssessments: semuaPenilaian.length,
    totalPublished: semuaPenilaian.filter((p) => !p.draf).length,
    studentsGraded,
    studentsUngraded,
  };

  // 7. Class options for filter dropdown
  const classOptions: ClassFilterOption[] = kelas.map((k) => {
    const m = mapelById.get(k.mataPelajaranId);
    return {
      id: k.id,
      nama: m?.nama ?? `Kelas #${k.id}`,
      jenjang: k.jenjang,
      tingkat: k.tingkat,
    };
  });

  return (
    <TeacherGradesView
      assessments={assessmentItems}
      students={studentGradeItems}
      classes={classOptions}
      locale={locale}
      initialTab={tab === "murid" ? "murid" : "tugas"}
      stats={stats}
    />
  );
}
