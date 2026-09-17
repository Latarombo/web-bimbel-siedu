import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { redirect, getPathname } from "@/i18n/navigation";
import { auth } from "@/lib/auth";
import { db } from "@/prisma/db";
import { collect } from "@/lib/collect";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageShell, PageHeader, Panel, FilterTabs } from "@/components/admin/ui";
import { ConfirmAction } from "@/components/admin/confirm-action";
import { hapusPesan, ubahStatusPesan } from "@/app/actions/admin";

export const dynamic = "force-dynamic";

// E11 — Pesan Masuk: kotak surat dari formulir Kontak publik. Pola master-detail
// seperti antrean ticket: list ringkas kiri, baca + aksi kanan (tanpa form per baris).
const TONE = { baru: "amber", diproses: "brand", selesai: "emerald" } as const;

export default async function AdminMessages({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; baca?: string }>;
}) {
  const locale = await getLocale();
  const t = await getTranslations("admin");
  const LABEL = { baru: t("text185"), diproses: t("text186"), selesai: t("text187") } as const;
  const session = await auth();
  if (!session?.user) return redirect({ href: { pathname: "/login", query: { next: getPathname({ href: "/admin/messages", locale }) } }, locale });
  const { status, baca } = await searchParams;
  const filter = status === "baru" || status === "diproses" || status === "selesai" ? status : null;

  const semua = await collect(db.orm.public.PesanKontak.all());
  const daftar = semua
    .filter((p) => (filter ? p.status === filter : true))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const hitung = (s: string) => semua.filter((p) => p.status === s).length;
  const selected =
    semua.find((p) => p.id === Number(baca ?? 0)) ??
    (filter === "baru" ? daftar[0] : daftar[0]);

  const fmtWaktu = (iso: string) =>
    new Date(iso).toLocaleString(locale === "en" ? "en-GB" : "id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Jakarta",
    });

  const q = filter ? `?status=${filter}` : "";
  const tabs = [
    { label: t("text67"), href: "/admin/messages", count: semua.length, aktif: !filter },
    { label: t("text185"), href: "/admin/messages?status=baru", count: hitung("baru"), aktif: filter === "baru", attention: hitung("baru") > 0 },
    { label: t("text186"), href: "/admin/messages?status=diproses", count: hitung("diproses"), aktif: filter === "diproses" },
    { label: t("text187"), href: "/admin/messages?status=selesai", count: hitung("selesai"), aktif: filter === "selesai" },
  ];

  return (
    <PageShell wide>
      <PageHeader
        title={t("text188")}
        desc={t("text189")}
        meta={hitung("baru") > 0 ? t("unreadCount", { count: hitung("baru") }) : t("text190")}
      />

      <div className="mt-5">
        <FilterTabs label={t("text191")} tabs={tabs} />
      </div>

      <div className="mt-4 grid items-start gap-4 lg:grid-cols-[minmax(0,1fr)_30rem]">
        {/* LIST */}
        <Panel>
          {daftar.length === 0 ? (
            <p className="px-6 py-12 text-center text-sm text-slate-500">
              {filter ? t("text192") : t("text193")}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {daftar.map((p) => {
                const isSel = selected?.id === p.id;
                return (
                  <li key={p.id}>
                    <Link
                      href={`/admin/messages${q}${q ? "&" : "?"}baca=${p.id}`}
                      className={`flex items-start gap-3 px-5 py-4 transition-colors ${isSel ? "bg-blue-50/60" : "hover:bg-slate-50"}`}
                    >
                      <span
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${p.status === "baru" ? "bg-amber-500" : "bg-slate-200"}`}
                        aria-hidden="true"
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="truncate text-sm font-bold text-slate-900">
                            {p.nama}
                            <span className="ml-2 font-normal text-slate-400">{p.email}</span>
                          </span>
                          <span className="flex-shrink-0 text-xs tabular-nums text-slate-400">{fmtWaktu(p.createdAt)}</span>
                        </span>
                        <span className="mt-0.5 block truncate text-sm font-semibold text-slate-700">{p.subjek}</span>
                        <span className="mt-0.5 block line-clamp-1 text-xs text-slate-400">{p.pesan}</span>
                      </span>
                      {p.status !== "baru" ? <Badge tone={TONE[p.status as keyof typeof TONE]}>{LABEL[p.status as keyof typeof LABEL]}</Badge> : null}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        {/* BACA + AKSI */}
        <div className="lg:sticky lg:top-6">
          {selected ? (
            <Panel>
              <div className="border-b border-slate-100 px-6 py-4">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-800">
                      {selected.nama.trim().charAt(0).toUpperCase()}
                    </span>
                    <div>
                      <h2 className="font-display text-[15px] font-bold tracking-tight text-slate-900">{selected.nama}</h2>
                      <p className="text-xs text-slate-500">
                        <a href={`mailto:${selected.email}`} className="text-blue-700 hover:underline">
                          {selected.email}
                        </a>
                        {selected.telepon ? ` · ${selected.telepon}` : ""}
                      </p>
                    </div>
                  </div>
                  <Badge tone={TONE[selected.status as keyof typeof TONE]}>{LABEL[selected.status as keyof typeof LABEL]}</Badge>
                </div>
                <p className="mt-2.5 text-xs tabular-nums text-slate-400">
                  {t("receivedAt", { date: fmtWaktu(selected.createdAt) })}
                  {selected.jenjang ? t("messageLevel", { level: selected.jenjang }) : ""}
                  {selected.sekolah ? ` · ${selected.sekolah}` : ""}
                </p>
              </div>
              <div className="p-6">
                <h3 className="text-sm font-bold text-slate-900">{selected.subjek}</h3>
                <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-4 py-3.5 text-sm leading-relaxed text-slate-800">
                  {selected.pesan}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  {(["baru", "diproses", "selesai"] as const)
                    .filter((s) => s !== selected.status)
                    .map((s) => (
                      <form key={s} action={ubahStatusPesan}>
                        <input type="hidden" name="pesan_id" value={selected.id} />
                        <input type="hidden" name="status" value={s} />
                        <Button type="submit" size="sm" variant={s === "selesai" ? "default" : "outline"}>
                          {t("markStatus", { status: LABEL[s] })}
                        </Button>
                      </form>
                    ))}
                  <ConfirmAction
                    action={hapusPesan}
                    label={t("text93")}
                    confirmLabel={t("text194")}
                  >
                    <input type="hidden" name="pesan_id" value={selected.id} />
                  </ConfirmAction>
                  <a
                    href={`mailto:${selected.email}?subject=${encodeURIComponent(t("replySubject", { subject: selected.subjek }))}`}
                    className="ml-auto text-sm font-semibold text-blue-700 hover:underline"
                  >{t("text195")} </a>
                </div>
              </div>
            </Panel>
          ) : (
            <Panel>
              <div className="p-6 text-sm text-slate-500">{t("text196")}</div>
            </Panel>
          )}
        </div>
      </div>
    </PageShell>
  );
}
