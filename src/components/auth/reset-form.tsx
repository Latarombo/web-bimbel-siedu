"use client";
import { useTranslations } from 'next-intl';
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
export default function ResetForm({ token }: { token: string }) {
    const t = useTranslations('auth');
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      {/* break-all: token panjang tanpa spasi bisa jebol lebar kartu di 360px */}
      <p className="text-xs text-muted">{t('token')} <code className="inline-block max-w-full break-all px-1.5 py-0.5 rounded bg-slate-100 border border-border align-bottom">{token}</code></p>
      <Field label={t('newPassword')} required hint={t('minimumEight')}><Input type="password" name="password" required /></Field>
      <Field label={t('confirmPassword')} required><Input type="password" name="password_confirm" required /></Field>
      <Button type="submit" className="w-full">{t('resetPassword')}</Button>
    </form>
  );
}
