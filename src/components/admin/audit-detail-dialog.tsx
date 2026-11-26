'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { AdminModal, RowActionIconBtn } from '@/components/admin/admin-table-kit';

function formatJson(str?: string | null): string {
  if (!str) return 'Tidak ada data';
  try {
    return JSON.stringify(JSON.parse(str), null, 2);
  } catch {
    return str;
  }
}

export function AuditDetailDialog({
  aksi,
  entitas,
  entitasId,
  sebelum,
  sesudah,
  alasan,
}: {
  aksi: string;
  entitas: string;
  entitasId: number;
  sebelum?: string | null;
  sesudah?: string | null;
  alasan?: string | null;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <RowActionIconBtn
        onClick={() => setOpen(true)}
        ariaLabel={`Lihat payload ${entitas} #${entitasId}`}
        title="Lihat rincian perubahan"
      >
        <Eye className="size-4" aria-hidden="true" />
      </RowActionIconBtn>

      <AdminModal
        isOpen={open}
        onClose={() => setOpen(false)}
        title="Rincian Perubahan Data"
        subtitle={`Entitas: ${entitas.toUpperCase()} #${entitasId} · Aksi: ${aksi}`}
        maxWidthClass="sm:max-w-2xl"
      >
        <div className="space-y-4">
          {alasan ? (
            <div className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/60 p-3 text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                Catatan / Alasan:{' '}
              </span>
              {alasan}
            </div>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 text-xs">
            <div>
              <span className="mb-1.5 block font-semibold text-rose-700 dark:text-rose-400">
                Sebelum:
              </span>
              <pre className="max-h-64 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                {formatJson(sebelum)}
              </pre>
            </div>
            <div>
              <span className="mb-1.5 block font-semibold text-emerald-700 dark:text-emerald-400">
                Sesudah:
              </span>
              <pre className="max-h-64 overflow-x-auto rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-3 font-mono text-[11px] text-slate-800 dark:text-slate-200">
                {formatJson(sesudah)}
              </pre>
            </div>
          </div>

          <div className="flex justify-end border-t border-slate-100 dark:border-slate-800 pt-3">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors cursor-pointer"
            >
              Tutup
            </button>
          </div>
        </div>
      </AdminModal>
    </>
  );
}
