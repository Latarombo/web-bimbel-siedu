"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { ajukanKoreksi } from "@/app/actions/teacher";
import { Button } from "@/components/ui/button";
import { CardSelect } from "@/components/ui/card-select";

export interface LockedEntryItem {
  id: number;
  entitas: "presensi" | "nilai";
  label: string;
  ringkasan: string;
  currentValues: {
    status?: string;
    nilaiKuantitatif?: string | number | null;
    catatan?: string | null;
    catatanKualitatif?: string | null;
  };
}

interface PengajuanKoreksiFormProps {
  lockedEntries: LockedEntryItem[];
}

export function PengajuanKoreksiForm({ lockedEntries }: PengajuanKoreksiFormProps) {
  const t = useTranslations("teacher");
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [proposedStatus, setProposedStatus] = useState<string>("hadir");
  const [proposedGrade, setProposedGrade] = useState<string>("");
  const [proposedNotes, setProposedNotes] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selectedEntry = lockedEntries.find((e) => `${e.entitas}-${e.id}` === selectedKey);

  const handleSelectEntry = (key: string) => {
    setSelectedKey(key);
    setErrorMsg(null);
    setSuccessMsg(null);
    const entry = lockedEntries.find((e) => `${e.entitas}-${e.id}` === key);
    if (entry) {
      if (entry.entitas === "presensi") {
        setProposedStatus(entry.currentValues.status ?? "hadir");
        setProposedNotes(entry.currentValues.catatan ?? "");
      } else {
        setProposedGrade(String(entry.currentValues.nilaiKuantitatif ?? ""));
        setProposedNotes(entry.currentValues.catatanKualitatif ?? "");
      }
    }
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedEntry) return;

    if (!reason.trim() || reason.trim().length < 5) {
      setErrorMsg(t("correctionReasonMin"));
      return;
    }

    const dataUsulanObj = selectedEntry.entitas === "presensi"
      ? { status: proposedStatus, catatan: proposedNotes.trim() }
      : { nilaiKuantitatif: proposedGrade.trim(), catatanKualitatif: proposedNotes.trim() };

    const formData = new FormData();
    formData.append("entitas", selectedEntry.entitas);
    formData.append("entitas_id", String(selectedEntry.id));
    formData.append("data_usulan", JSON.stringify(dataUsulanObj));
    formData.append("alasan", reason.trim());

    setErrorMsg(null);
    setSuccessMsg(null);

    startTransition(async () => {
      const res = await ajukanKoreksi({ ok: false }, formData);
      if (res?.error) {
        setErrorMsg(res.error);
      } else {
        setSuccessMsg(t("correctionSuccess"));
        setReason("");
        setSelectedKey("");
      }
    });
  };

  if (lockedEntries.length === 0) {
    return (
      <div className="rounded-lg border border-slate-100 bg-slate-50/70 p-4 text-center text-sm text-slate-500">
        {t("noLockedEntries")}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errorMsg ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-800">
          {errorMsg}
        </div>
      ) : null}

      {successMsg ? (
        <div role="alert" className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-800">
          {successMsg}
        </div>
      ) : null}

      <div>
        <label htmlFor="select-locked-entry" className="block text-xs font-semibold text-slate-700">
          {t("selectLockedEntry")} <span className="text-red-500">*</span>
        </label>
        <CardSelect
          id="select-locked-entry"
          value={selectedKey}
          onChange={(val) => handleSelectEntry(val)}
          required
          options={lockedEntries.map((e) => ({
            value: `${e.entitas}-${e.id}`,
            label: `[${e.entitas === "presensi" ? t("attendance") : t("grades")}] ${e.label} — ${e.ringkasan}`,
          }))}
          placeholder={t("selectEntryPlaceholder")}
          modalTitle={t("selectLockedEntry")}
          className="mt-1"
        />
      </div>

      {selectedEntry ? (
        <div className="space-y-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3.5">
          <div className="text-xs text-slate-500">
            <span className="font-medium text-slate-700">{t("currentData")}: </span>
            {selectedEntry.ringkasan}
          </div>

          {selectedEntry.entitas === "presensi" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {t("proposedStatus")} <span className="text-red-500">*</span>
                </label>
                <CardSelect
                  value={proposedStatus}
                  onChange={(val) => setProposedStatus(val)}
                  options={[
                    { value: "hadir", label: t("statusHadir") },
                    { value: "izin", label: t("statusIzin") },
                    { value: "sakit", label: t("statusSakit") },
                    { value: "alpa", label: t("statusAlpa") },
                  ]}
                  modalTitle={t("proposedStatus")}
                  className="mt-1"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {t("additionalNotes")}
                </label>
                <input
                  type="text"
                  value={proposedNotes}
                  onChange={(e) => setProposedNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {t("proposedGrade")} (0-100) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={proposedGrade}
                  onChange={(e) => setProposedGrade(e.target.value)}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700">
                  {t("additionalNotes")}
                </label>
                <input
                  type="text"
                  value={proposedNotes}
                  onChange={(e) => setProposedNotes(e.target.value)}
                  placeholder={t("notesPlaceholder")}
                  className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700">
              {t("correctionReason")} <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={2}
              required
              minLength={5}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={t("correctionStep2Body")}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-600/15"
            />
          </div>

          <Button type="submit" disabled={isPending} className="w-full">
            {isPending ? t("submittingCorrection") : t("submitCorrection")}
          </Button>
        </div>
      ) : null}
    </form>
  );
}
