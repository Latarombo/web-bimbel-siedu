"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { savePenilaianBatch, tarikPenilaian } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export interface StudentAssessmentRow {
  pendaftaranId: number;
  nama: string;
  statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut";
  nilai: number | string | null;
  catatan: string | null;
}

interface PenilaianFormProps {
  kelasId: number;
  penilaianId?: number;
  initialNama?: string;
  initialTanggal?: string;
  initialNilaiMaksimum?: number | string;
  initialDraf?: boolean;
  diterbitkanPada?: string | null;
  siswa: StudentAssessmentRow[];
}

export function PenilaianForm({
  kelasId,
  penilaianId,
  initialNama = "",
  initialTanggal,
  initialNilaiMaksimum = 100,
  initialDraf = true,
  diterbitkanPada,
  siswa: initialSiswa,
}: PenilaianFormProps) {
  const t = useTranslations("teacher");
  const [nama, setNama] = useState(initialNama);
  const [tanggal, setTanggal] = useState(
    initialTanggal ?? new Date().toISOString().slice(0, 10),
  );
  const [nilaiMaksimum, setNilaiMaksimum] = useState(String(initialNilaiMaksimum));
  const [isDraf, setIsDraf] = useState(initialDraf);
  const [publishedAt, setPublishedAt] = useState<string | null>(diterbitkanPada ?? null);

  const [studentRows, setStudentRows] = useState<Record<number, {
    statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut";
    nilai: string;
    catatan: string;
  }>>(() => {
    const map: Record<number, { statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut"; nilai: string; catatan: string }> = {};
    for (const s of initialSiswa) {
      map[s.pendaftaranId] = {
        statusHasil: s.statusHasil,
        nilai: s.nilai != null ? String(s.nilai) : "",
        catatan: s.catatan ?? "",
      };
    }
    return map;
  });

  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const handleStatusChange = (pId: number, statusHasil: "belum_dinilai" | "dinilai" | "tidak_ikut") => {
    setStudentRows((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        statusHasil,
        nilai: statusHasil === "dinilai" ? prev[pId].nilai : "",
      },
    }));
  };

  const handleNilaiChange = (pId: number, val: string) => {
    setStudentRows((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        nilai: val,
        statusHasil: val.trim() !== "" ? "dinilai" : prev[pId].statusHasil,
      },
    }));
  };

  const handleCatatanChange = (pId: number, val: string) => {
    setStudentRows((prev) => ({
      ...prev,
      [pId]: {
        ...prev[pId],
        catatan: val,
      },
    }));
  };

  const handleSubmit = (aksi: "simpan_draf" | "terbitkan") => {
    if (!nama.trim()) {
      setErrorMsg(t("assessmentNameRequired"));
      return;
    }

    const maxScoreNum = Number(nilaiMaksimum);
    if (isNaN(maxScoreNum) || maxScoreNum <= 0) {
      setErrorMsg(t("invalidMaxScore"));
      return;
    }

    const formData = new FormData();
    formData.append("kelas_id", String(kelasId));
    if (penilaianId) {
      formData.append("penilaian_id", String(penilaianId));
    }
    formData.append("nama", nama.trim());
    formData.append("tanggal", tanggal);
    formData.append("nilai_maksimum", String(maxScoreNum));
    formData.append("aksi", aksi);

    for (const s of initialSiswa) {
      const cur = studentRows[s.pendaftaranId];
      if (cur) {
        formData.append(`status_${s.pendaftaranId}`, cur.statusHasil);
        formData.append(`nilai_${s.pendaftaranId}`, cur.statusHasil === "dinilai" ? cur.nilai : "");
        formData.append(`catatan_${s.pendaftaranId}`, cur.catatan);
      }
    }

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await savePenilaianBatch({ ok: false }, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setIsDraf(aksi === "simpan_draf");
        if (aksi === "terbitkan") {
          setPublishedAt(new Date().toISOString());
          setSuccessMsg(t("assessmentPublished"));
        } else {
          setSuccessMsg(t("assessmentSaved"));
        }
      }
    });
  };

  const handleWithdraw = () => {
    if (!penilaianId) return;
    if (!confirm(t("withdrawConfirm"))) return;

    const formData = new FormData();
    formData.append("penilaian_id", String(penilaianId));

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await tarikPenilaian({ ok: false }, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setIsDraf(true);
        setPublishedAt(null);
        setSuccessMsg(t("assessmentWithdrawn"));
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Header status bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-4">
        <div className="flex items-center gap-2.5">
          <Badge tone={isDraf ? "amber" : "emerald"}>
            {isDraf ? t("draftStatus") : t("publishedStatus")}
          </Badge>
          {!isDraf && publishedAt ? (
            <span className="text-xs text-slate-500">
              {t("publishedOn", {
                date: new Date(publishedAt).toLocaleString("id-ID", { timeZone: "Asia/Jakarta" }),
              })}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {!isDraf && penilaianId ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isPending}
              onClick={handleWithdraw}
              className="border-amber-300 text-amber-800 hover:bg-amber-50"
            >
              {t("withdrawToDraft")}
            </Button>
          ) : null}

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={() => handleSubmit("simpan_draf")}
          >
            {t("saveDraft")}
          </Button>

          <Button
            type="button"
            size="sm"
            disabled={isPending}
            onClick={() => handleSubmit("terbitkan")}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
          >
            {isDraf ? t("publishToParents") : t("saveChanges")}
          </Button>
        </div>
      </div>

      {errorMsg ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3.5 text-xs text-red-800">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div role="alert" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3.5 text-xs text-emerald-800">
          {successMsg}
        </div>
      ) : null}

      {/* Meta Assessment Form */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="sm:col-span-1">
          <label htmlFor="assessment-name" className="block text-xs font-semibold text-slate-700">
            {t("assessmentName")} <span className="text-red-500">*</span>
          </label>
          <input
            id="assessment-name"
            type="text"
            required
            value={nama}
            onChange={(e) => setNama(e.target.value)}
            placeholder={t("assessmentNamePlaceholder")}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div>
          <label htmlFor="assessment-date" className="block text-xs font-semibold text-slate-700">
            {t("assessmentDate")} <span className="text-red-500">*</span>
          </label>
          <input
            id="assessment-date"
            type="date"
            required
            value={tanggal}
            onChange={(e) => setTanggal(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
        </div>

        <div>
          <label htmlFor="assessment-max" className="block text-xs font-semibold text-slate-700">
            {t("maxScore")} <span className="text-red-500">*</span>
          </label>
          <input
            id="assessment-max"
            type="number"
            min="1"
            max="1000"
            required
            value={nilaiMaksimum}
            onChange={(e) => setNilaiMaksimum(e.target.value)}
            className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
          />
          <p className="mt-0.5 text-[11px] text-slate-400">{t("maxScoreHelp")}</p>
        </div>
      </div>

      {/* Student Grading Table */}
      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            <tr>
              <th className="px-4 py-3 sm:px-6">{t("student")}</th>
              <th className="px-4 py-3 text-center">{t("status")}</th>
              <th className="px-4 py-3 sm:w-32">{t("score")}</th>
              <th className="px-4 py-3 sm:px-6">{t("notes")}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {initialSiswa.map((s) => {
              const cur = studentRows[s.pendaftaranId] ?? {
                statusHasil: "belum_dinilai",
                nilai: "",
                catatan: "",
              };

              return (
                <tr key={s.pendaftaranId} className="transition-colors hover:bg-slate-50/60">
                  <td className="px-4 py-3 font-semibold text-slate-900 sm:px-6">
                    {s.nama}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={cur.statusHasil}
                      onChange={(e) =>
                        handleStatusChange(
                          s.pendaftaranId,
                          e.target.value as "belum_dinilai" | "dinilai" | "tidak_ikut",
                        )
                      }
                      className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-800 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    >
                      <option value="dinilai">{t("statusDinilai")}</option>
                      <option value="belum_dinilai">{t("statusBelumDinilai")}</option>
                      <option value="tidak_ikut">{t("statusTidakIkut")}</option>
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1.5">
                      <input
                        type="number"
                        min="0"
                        max={nilaiMaksimum || 100}
                        disabled={cur.statusHasil !== "dinilai"}
                        value={cur.nilai}
                        onChange={(e) => handleNilaiChange(s.pendaftaranId, e.target.value)}
                        placeholder="—"
                        className="w-20 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-sm tabular-nums text-slate-900 outline-none disabled:bg-slate-100 disabled:text-slate-400 focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                      />
                      <span className="text-xs text-slate-400">/ {nilaiMaksimum}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 sm:px-6">
                    <input
                      type="text"
                      value={cur.catatan}
                      onChange={(e) => handleCatatanChange(s.pendaftaranId, e.target.value)}
                      placeholder={t("notesPlaceholder")}
                      className="w-full rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600/20"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
