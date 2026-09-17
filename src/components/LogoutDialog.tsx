'use client';

import { useRef, useState, useTransition } from 'react';
import { Dialog } from 'radix-ui';
import { Lock, LogOut, X } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { unstable_rethrow } from 'next/navigation';
import { logout } from '@/app/actions/login';

interface LogoutDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName: string;
  userEmail?: string | null;
  role: string;
  accountRole?: string;
}

export default function LogoutDialog({ open, onOpenChange, userName, userEmail, role, accountRole }: LogoutDialogProps) {
  const t = useTranslations('shared.logoutDialog');
  const [pending, startTransition] = useTransition();
  const [failed, setFailed] = useState(false);
  const submitting = useRef(false);
  const cancelRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const isParent = accountRole === 'orang_tua';
  const initials = userName.trim().split(/\s+/).map((word) => word[0]).slice(0, 2).join('').toUpperCase();

  function confirmLogout() {
    if (submitting.current) return;
    submitting.current = true;
    setFailed(false);
    startTransition(async () => {
      try {
        await logout();
      } catch (error) {
        unstable_rethrow(error);
        setFailed(true);
      } finally {
        submitting.current = false;
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={(nextOpen) => {
      if (!submitting.current) onOpenChange(nextOpen);
    }}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[100] bg-slate-900/40" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[101] max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-3xl bg-white px-6 pb-7 pt-14 text-center shadow-2xl outline-none sm:px-9 sm:pb-8 sm:pt-14"
          onOpenAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
            setFailed(false);
            cancelRef.current?.focus();
          }}
          onCloseAutoFocus={(event) => {
            event.preventDefault();
            returnFocusRef.current?.focus();
          }}
          onInteractOutside={(event) => event.preventDefault()}
          onEscapeKeyDown={(event) => {
            if (submitting.current) event.preventDefault();
          }}
          aria-busy={pending}
        >
          <Dialog.Close asChild>
            <button type="button" disabled={pending} aria-label={t('close')} className="absolute right-3 top-3 grid size-10 place-items-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50">
              <X className="size-5" aria-hidden="true" />
            </button>
          </Dialog.Close>
          <Dialog.Title className="text-2xl font-bold tracking-tight text-slate-900">{t('title')}</Dialog.Title>
          <Dialog.Description className="mt-3 text-sm leading-6 text-slate-500">
            {t.rich(isParent ? 'parentDescription' : 'description', {
              role,
              strong: (chunks) => <strong className="font-semibold text-slate-700">{chunks}</strong>,
            })}
          </Dialog.Description>

          <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-4 text-left">
            <div className="grid size-12 shrink-0 place-items-center rounded-full bg-violet-600 text-base font-semibold text-white" aria-hidden="true">{initials}</div>
            <div className="min-w-0">
              <p className="break-words text-sm font-semibold text-slate-900">{userName}</p>
              {userEmail ? <p className="mt-1 break-all text-sm text-slate-500">{userEmail}</p> : null}
            </div>
          </div>

          {failed ? <p role="alert" className="mt-4 text-sm text-danger">{t('error')}</p> : null}
          <div className="mt-6 grid grid-cols-2 gap-3">
            <Dialog.Close asChild>
              <button ref={cancelRef} type="button" disabled={pending} className="min-h-12 rounded-lg bg-slate-100 px-3 py-3 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-200 disabled:opacity-50">{t('cancel')}</button>
            </Dialog.Close>
            <button type="button" onClick={confirmLogout} disabled={pending} className="flex min-h-12 items-center justify-center gap-2 rounded-lg bg-danger px-3 py-3 text-sm font-semibold text-white transition-colors hover:bg-rose-700 disabled:cursor-wait disabled:opacity-60">
              <LogOut className="size-4 shrink-0" aria-hidden="true" />
              <span role="status">{t(pending ? 'pending' : 'confirm')}</span>
            </button>
          </div>
          <p className="mt-5 flex items-start justify-center gap-1.5 text-xs leading-5 text-slate-400">
            <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>{t(isParent ? 'parentNote' : 'note')}</span>
          </p>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
