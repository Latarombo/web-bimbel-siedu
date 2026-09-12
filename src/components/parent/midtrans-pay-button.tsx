"use client";

import { useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { mulaiPembayaran, type PayState } from "@/app/actions/pembayaran";

/*
 * Tombol "Bayar lewat Midtrans" — action server membuat transaksi SNAP lalu
 * mengembalikan redirect_url; efek ini menavigasi ke halaman gateway.
 */
export default function MidtransPayButton({
  pembayaranId,
  label,
}: {
  pembayaranId: number;
  label: string;
}) {
  const [state, formAction, pending] = useActionState<PayState, FormData>(
    mulaiPembayaran,
    {
      ok: false,
      error: "",
    },
  );
  const sudah = useRef(false);

  useEffect(() => {
    if (state.ok && state.url && !sudah.current) {
      sudah.current = true;
      window.location.assign(state.url);
    }
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="pembayaran_id" value={pembayaranId} />
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Menyiapkan pembayaran…" : label}
      </Button>
      {!state.ok && state.error ? (
        <p
          className="mt-2 rounded-xl bg-red-50 px-3 py-2 text-sm text-red-700"
          role="alert"
        >
          {state.error}
        </p>
      ) : null}
    </form>
  );
}
