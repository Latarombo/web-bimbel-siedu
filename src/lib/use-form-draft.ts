'use client';

import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Hook untuk menyimpan dan memulihkan draf form secara otomatis ke sessionStorage.
 * Mencegah hilangnya inputan pengguna saat terjadi pergantian bahasa (locale switch),
 * navigasi rute sementara, atau accidental page refresh.
 *
 * @param storageKey Kunci unik di sessionStorage
 * @param initialValues Nilai default form
 */
export type UseFormDraftReturn<T> = [
  T,
  (field: keyof T, value: any) => void,
  (values: Partial<T>) => void,
  () => void,
  boolean
] & {
  draft: T;
  setDraftField: (field: keyof T, value: any) => void;
  setMultipleDraft: (values: Partial<T>) => void;
  clearDraft: () => void;
  isReady: boolean;
};

export function useFormDraft<T extends Record<string, any>>(
  storageKey: string,
  initialValues: T
): UseFormDraftReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [isReady, setIsReady] = useState(false);
  const isLoadedRef = useRef(false);

  // 1. Baca draft yang tersimpan di sessionStorage saat mount
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const saved = sessionStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        setValues((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Abaikan error parse JSON
    }
    isLoadedRef.current = true;
    setIsReady(true);
  }, [storageKey]);

  // 2. Simpan perubahan ke sessionStorage
  const saveToStorage = useCallback(
    (newValues: T) => {
      if (typeof window === 'undefined' || !isLoadedRef.current) return;
      try {
        sessionStorage.setItem(storageKey, JSON.stringify(newValues));
      } catch {
        // Abaikan jika storage quota penuh
      }
    },
    [storageKey]
  );

  // Update 1 field
  const setField = useCallback(
    (field: keyof T, value: any) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: value };
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Update beberapa fields sekaligus
  const setMultiple = useCallback(
    (newFields: Partial<T>) => {
      setValues((prev) => {
        const updated = { ...prev, ...newFields };
        saveToStorage(updated);
        return updated;
      });
    },
    [saveToStorage]
  );

  // Bersihkan draft (dipanggil saat submit form berhasil)
  const clearDraft = useCallback(() => {
    if (typeof window === 'undefined') return;
    try {
      sessionStorage.removeItem(storageKey);
    } catch {}
  }, [storageKey]);

  const result = [values, setField, setMultiple, clearDraft, isReady] as unknown as UseFormDraftReturn<T>;
  result.draft = values;
  result.setDraftField = setField;
  result.setMultipleDraft = setMultiple;
  result.clearDraft = clearDraft;
  result.isReady = isReady;

  return result;
}

export default useFormDraft;
