"use client";

import { useActionState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { mulaiPembayaran, type PayState } from "@/app/actions/pembayaran";

/*
 * Tombol "Bayar lewat Midtrans" — action server membuat transaksi SNAP lalu
 * mengembalikan redirect_url; efek ini menavigasi ke halaman gateway.
 */
export default function MidtransPayButton({
  pembayaranId,
  label,
  className = "w-full min-h-12 text-base font-bold shadow-md rounded-xl",
  size = "lg",
}: {
  pembayaranId: number;
  label: string;
  className?: string;
  size?: "default" | "sm" | "lg";
}) {
  const tr = useTranslations("parent");
  const [state, formAction, pending] = useActionState<PayState, FormData>(
    mulaiPembayaran,
    {
      ok: false,
      error: "",
    },
  );
  const sudah = useRef(false);

  useEffect(() => {
    if (pending) {
      sudah.current = false;
    }
  }, [pending]);

  useEffect(() => {
    if (state.ok && state.url && !sudah.current) {
      sudah.current = true;
      window.location.assign(state.url);
    }
  }, [state]);

  return (
    <form action={formAction} className="w-full">
      <input type="hidden" name="pembayaran_id" value={pembayaranId} />
      <Button
        type="submit"
        className={className}
        size={size}
        disabled={pending}
      >
        {pending ? (
          <span className="flex items-center justify-center gap-2">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            <span>{tr("text190")}</span>
          </span>
        ) : (
          label
        )}
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
