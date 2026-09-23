'use client';

import { useState, useCallback } from 'react';

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
  (field: keyof T, value: T[keyof T]) => void,
  (values: Partial<T>) => void,
  () => void,
  boolean
] & {
  draft: T;
  setDraftField: (field: keyof T, value: T[keyof T]) => void;
  setMultipleDraft: (values: Partial<T>) => void;
  clearDraft: () => void;
  isReady: boolean;
};

export function useFormDraft<T extends object>(
  storageKey: string,
  initialValues: T
): UseFormDraftReturn<T> {
  const mergeFromStorage = (key: string, base: T): T => {
    if (typeof window === 'undefined') return base;
    try {
      const saved = sessionStorage.getItem(key);
      if (saved) {
        return { ...base, ...JSON.parse(saved) } as T;
      }
    } catch {
      // Abaikan error parse JSON
    }
    return base;
  };

  const [values, setValues] = useState<T>(() => mergeFromStorage(storageKey, initialValues));
  const [isReady] = useState(() => typeof window !== 'undefined');

  const [prevStorageKey, setPrevStorageKey] = useState(storageKey);
  if (storageKey !== prevStorageKey) {
    setPrevStorageKey(storageKey);
    setValues((prev) => mergeFromStorage(storageKey, prev));
  }

  // Simpan perubahan ke sessionStorage
  const saveToStorage = useCallback(
    (newValues: T) => {
      if (typeof window === 'undefined') return;
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
    (field: keyof T, value: T[keyof T]) => {
      setValues((prev) => {
        const updated = { ...prev, [field]: value } as T;
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
