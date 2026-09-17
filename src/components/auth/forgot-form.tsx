"use client";
import { useTranslations } from 'next-intl';
import { Field, Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
export default function ForgotForm() {
    const t = useTranslations('auth');
  return (
    <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
      <Field label={t('email')} required hint={t('resetHint')}><Input type="email" name="email" required placeholder={t('emailPlaceholder')} /></Field>
      <Button type="submit" className="w-full">{t('sendReset')}</Button>
    </form>
  );
}
