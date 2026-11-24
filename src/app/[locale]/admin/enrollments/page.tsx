import { getLocale, getTranslations } from "next-intl/server";
import { Link, redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { rupiah } from "@/lib/format/format";
import { ButtonLink } from "@/components/ui/button";
import { StatusBadge, type StatusPendaftaran } from "@/components/common/status-badge";
import { DataTable, type TableColumn, type TableRowData } from "@/components/ui/data-table";
import { PageShell, PageHeader, Panel, FilterTabs } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

const STATUS_MASALAH = ["tertunggak", "dibatalkan_timeout", "dibatalkan_tunggakan", "dibatalkan_kelas"];

export default async function AdminEnrollments({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; kelasId?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const labelMetode = (value: string) => (t.has(`labelMetode_${value}`) ? t(`labelMetode_${value}`) : value.replaceAll("_", " "));
  const fmtTanggal = (iso: string) =>
    new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: "Asia/Jakarta",
    });

  const session = await auth();
  if (!session?.user) {
    return redirect({
      href: { pathname: "/login", query: { next: getPathname({ href: "/admin/enrollments", locale }) } },
      locale,
    });
  }

  const { status, kelasId: filterKelasId } = await searchParams;
  const filter = status ?? "semua";

  const [pendaftaran, anak, kelas, mapel, users, pembayaran] = await Promise.all([
    collect(db.orm.public.Pendaftaran.all()),
    collect(db.orm.public.Anak.all()),
    collect(db.orm.public.Kelas.all()),
    collect(db.orm.public.MataPelajaran.all()),
    collect(db.orm.public.User.all()),
    collect(db.orm.public.Pembayaran.all()),
  ]);

  const anakById = new Map(anak.map((a) => [a.id, a]));
  const userById = new Map(users.map((u) => [u.id, u]));
  const kelasById = new Map(kelas.map((k) => [k.id, k]));
  const mapelById = new Map(mapel.map((m) => [m.id, m]));

  const bayarByPendaftaran = new Map<number, typeof pembayaran>();
  for (const b of pembayaran) {
    const arr = bayarByPendaftaran.get(b.pendaftaranId) ?? [];
    arr.push(b);
    bayarByPendaftaran.set(b.pendaftaranId, arr);
  }

  // Filter dataset jika ada kelasId
  let daftar = pendaftaran;
  if (filterKelasId) {
    const kId = Number(filterKelasId);
    if (!Number.isNaN(kId) && kId > 0) {
      daftar = daftar.filter((p) => p.kelasId === kId);
    }
  }

  const nTotal = daftar.length;
  const nTerdaftar = daftar.filter((p) => p.status === "terdaftar").length;
  const nMenunggu = daftar.filter((p) => p.status === "menunggu_pembayaran").length;
  const nMasalah = daftar.filter((p) => STATUS_MASALAH.includes(p.status)).length;

  if (filter === "terdaftar") {
    daftar = daftar.filter((p) => p.status === "terdaftar");
  } else if (filter === "menunggu_pembayaran") {
    daftar = daftar.filter((p) => p.status === "menunggu_pembayaran");
  } else if (filter === "bermasalah") {
    daftar = daftar.filter((p) => STATUS_MASALAH.includes(p.status));
  }

  const urut = daftar.toSorted((a, b) => b.createdAt.localeCompare(a.createdAt));

  const columns: TableColumn[] = [
    { key: "anak", header: t("text117") },
    { key: "kelas", header: t("text11") },
    { key: "wali", header: t("text30") },
    { key: "metode", header: t("text118"), align: "center" },
    { key: "pembayaran", header: t("text18"), align: "right" },
    { key: "status", header: t("text32"), align: "center" },
    { key: "createdAt", header: t("text120"), align: "right" },
  ];

  const rows: TableRowData[] = urut.map((p) => {
    const a = anakById.get(p.anakId);
    const wali = a ? userById.get(a.orangTuaId) : undefined;
    const k = kelasById.get(p.kelasId);
    const m = k ? mapelById.get(k.mataPelajaranId) : undefined;
    const tagihan = bayarByPendaftaran.get(p.id) ?? [];
    const berhasil = tagihan.filter((b) => b.status === "berhasil");
    const totalBayar = berhasil.reduce((sum, b) => sum + Number(b.jumlah), 0);

    const anakNama = a?.nama ?? `Siswa #${p.anakId}`;
    const mapelNama = m?.nama ?? `Kelas #${p.kelasId}`;
    const waliNama = wali?.name ?? "—";

    return {
      id: p.id,
      values: {
        anak: `${anakNama} ${a?.jenjangTerakhir ?? ""}`,
        kelas: mapelNama,
        wali: `${waliNama} ${wali?.nomorTelepon ?? ""}`,
        metode: p.metodeBayar,
        pembayaran: totalBayar,
        status: p.status,
        createdAt: p.createdAt,
      },
      cells: {
        anak: (
          <div>
            <p className="font-semibold text-slate-900">{anakNama}</p>
            <p className="text-xs text-slate-500">
              {a?.jenjangTerakhir ?? p.jenjangSaatDaftar}
              {a?.tingkat ? ` · ${a.tingkat}` : ""}
            </p>
          </div>
        ),
        kelas: (
          <div>
            <Link
              href={`/admin/classes/${p.kelasId}`}
              className="font-semibold text-blue-700 hover:underline"
            >
              {mapelNama}
            </Link>
            <p className="text-xs text-slate-500">
              {k?.jenjang}
              {k?.tingkat ? ` · ${k.tingkat}` : ""}
              {k?.ruangan ? ` (${k.ruangan})` : ""}
            </p>
          </div>
        ),
        wali: (
          <div>
            <p className="text-sm font-medium text-slate-900">{waliNama}</p>
            <p className="text-xs tabular-nums text-slate-500">{wali?.nomorTelepon || "—"}</p>
          </div>
        ),
        metode: (
          <div className="text-center">
            <span className="text-xs font-medium text-slate-700">{labelMetode(p.metodeBayar)}</span>
            {p.tenorBulan ? (
              <span className="block text-[11px] tabular-nums text-slate-500">
                {p.tenorBulan}x cicilan
              </span>
            ) : null}
          </div>
        ),
        pembayaran: (
          <div className="text-right">
            <span className="font-semibold tabular-nums text-slate-900">{rupiah(totalBayar)}</span>
            <span className="block text-xs tabular-nums text-slate-500">
              {berhasil.length}/{tagihan.length} tagihan
            </span>
          </div>
        ),
        status: <StatusBadge status={p.status as StatusPendaftaran} />,
        createdAt: (
          <span className="tabular-nums text-xs text-slate-500">{fmtTanggal(p.createdAt)}</span>
        ),
      },
    };
  });

  const queryKelas = filterKelasId ? `&kelasId=${filterKelasId}` : "";
  const filteredKelas = filterKelasId ? kelasById.get(Number(filterKelasId)) : undefined;
  const filteredMapel = filteredKelas ? mapelById.get(filteredKelas.mataPelajaranId) : undefined;

  return (
    <PageShell wide>
      <PageHeader
        title={t("text3")}
        desc={
          filteredMapel
            ? `Pendaftaran untuk kelas ${filteredMapel.nama} (${filteredKelas?.jenjang})`
            : "Kelola seluruh data pendaftaran siswa di semua kelas dan periode."
        }
        meta={`${nTotal} pendaftaran`}
      >
        <ButtonLink href={getPathname({ href: "/admin/enrollments/flagged", locale })} variant="secondary">
          Pendaftaran Bermasalah {nMasalah > 0 ? `(${nMasalah})` : ""}
        </ButtonLink>
      </PageHeader>

      {filterKelasId && filteredMapel ? (
        <div className="mt-4 flex items-center justify-between rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-2.5 text-sm text-blue-900">
          <span>
            Menampilkan pendaftaran kelas <strong>{filteredMapel.nama}</strong>
          </span>
          <Link
            href="/admin/enrollments"
            className="text-xs font-bold text-blue-700 underline hover:text-blue-900"
          >
            Hapus Filter Kelas
          </Link>
        </div>
      ) : null}

      <div className="mt-5">
        <FilterTabs
          label="Filter Status Pendaftaran"
          tabs={[
            {
              label: t("text67"),
              href: `/admin/enrollments?status=semua${queryKelas}`,
              count: nTotal,
              aktif: filter === "semua",
            },
            {
              label: t("text47"),
              href: `/admin/enrollments?status=terdaftar${queryKelas}`,
              count: nTerdaftar,
              aktif: filter === "terdaftar",
            },
            {
              label: t("text24"),
              href: `/admin/enrollments?status=menunggu_pembayaran${queryKelas}`,
              count: nMenunggu,
              aktif: filter === "menunggu_pembayaran",
            },
            {
              label: "Bermasalah",
              href: `/admin/enrollments?status=bermasalah${queryKelas}`,
              count: nMasalah,
              aktif: filter === "bermasalah",
              attention: nMasalah > 0,
            },
          ]}
        />
      </div>

      <Panel className="mt-4 p-5">
        <DataTable
          columns={columns}
          rows={rows}
          empty={filter === "semua" ? "Belum ada data pendaftaran" : "Tidak ada pendaftaran untuk filter ini"}
          initialSort={{ key: "createdAt", dir: "desc" }}
          searchPlaceholder="Cari siswa, kelas, orang tua..."
        />
      </Panel>
    </PageShell>
  );
}
