'use client';

import { useEffect } from 'react';

export function ClearDraft({ storageKey }: { storageKey: string | string[] }) {
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const keys = Array.isArray(storageKey) ? storageKey : [storageKey];
        for (const k of keys) {
          if (k.endsWith('*')) {
            const prefix = k.slice(0, -1);
            const toRemove: string[] = [];
            for (let i = 0; i < sessionStorage.length; i++) {
              const itemKey = sessionStorage.key(i);
              if (itemKey && itemKey.startsWith(prefix)) {
                toRemove.push(itemKey);
              }
            }
            toRemove.forEach((item) => sessionStorage.removeItem(item));
          } else {
            sessionStorage.removeItem(k);
          }
        }
      } catch {}
    }
  }, [storageKey]);

  return null;
}

export default ClearDraft;
