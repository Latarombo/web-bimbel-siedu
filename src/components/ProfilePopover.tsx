'use client';

import Link from 'next/link';
import { logout } from '@/app/actions/login';

interface ProfilePopoverProps {
  userName?: string;
  role: string;
  /** Dipanggil setelah item diklik supaya dropdown tertutup. */
  onNavigate: () => void;
}

// Path ikon feather-style (stroke, 24x24 viewBox) — konvensi sama dgn DashboardNavbar.
// ponytail: diduplikasi kecil dari ICONS DashboardNavbar; satukan ke modul ikon
// bersama kalau role lain (guru/admin) ikut memakai popover ini.
const ICONS: Record<string, string> = {
  users:
    'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8zm14 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75',
  user: 'M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2M12 11a4 4 0 100-8 4 4 0 000 8z',
  clock: 'M12 22a10 10 0 100-20 10 10 0 000 20zM12 6v6l4 2',
  file: 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8zM14 2v6h6M16 13H8M16 17H8M10 9H8',
  logout: 'M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9',
  chevronRight: 'M9 18l6-6-6-6',
};

function PopIcon({ icon, className }: { icon: string; className: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d={ICONS[icon]} />
    </svg>
  );
}

const rowCls =
  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-sm font-semibold text-slate-800 transition-colors duration-200 hover:bg-slate-50';

const dividerCls = 'mx-2 my-1 h-px bg-slate-100';

/**
 * Kartu popover profil — replika desain user "Profile(orang tua) Popover Card.png".
 * Terpasang di DashboardNavbar (saat ini hanya role Orang Tua).
 */
const ProfilePopover: React.FC<ProfilePopoverProps> = ({
  userName = 'Pengguna',
  role,
  onNavigate,
}) => {
  const initials = userName
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="w-[21.5rem] overflow-hidden rounded-3xl border border-slate-100 bg-white shadow-xl">
      {/* Header: identitas + tombol detail profil */}
      <div className="flex items-center gap-2.5 px-5 pb-4 pt-5">
        <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-blue-100 text-sm font-bold text-blue-700">
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-bold text-slate-900">{userName}</p>
          <p className="text-xs text-slate-500">Akun {role}</p>
        </div>
        <Link
          href="/profile"
          onClick={onNavigate}
          className="shrink-0 whitespace-nowrap rounded-full border border-slate-200 px-2.5 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-50"
        >
          Detail Profil
        </Link>
      </div>

      <nav className="px-2.5 pb-2.5" aria-label="Menu profil">
        <Link href="/children" onClick={onNavigate} className={rowCls}>
          <PopIcon icon="users" className="h-5 w-5 shrink-0 text-slate-700" />
          Kelola Profil Anak
        </Link>

        {/* Akun saat ini — indikator akun terpilih */}
        <Link href="/profile" onClick={onNavigate} className={rowCls}>
          <PopIcon icon="user" className="h-5 w-5 shrink-0 text-slate-700" />
          <span className="truncate">Akun Orang Tua</span>
          <span className="ml-auto flex shrink-0 items-center gap-1.5">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-blue-100 text-[10px] font-bold text-blue-700">
              {initials}
            </span>
            <span className="whitespace-nowrap text-sm font-semibold text-slate-800">{role}</span>
            <PopIcon icon="chevronRight" className="h-4 w-4 text-slate-400" />
          </span>
        </Link>

        <div className={dividerCls} />

        <Link href="/payments" onClick={onNavigate} className={rowCls}>
          <PopIcon icon="clock" className="h-5 w-5 shrink-0 text-slate-700" />
          Riwayat &amp; Status Pembelian
        </Link>

        <div className={dividerCls} />

        <Link href="/privacy-policy" onClick={onNavigate} className={rowCls}>
          <PopIcon icon="file" className="h-5 w-5 shrink-0 text-slate-700" />
          Kebijakan Privasi
        </Link>
        <Link href="/terms" onClick={onNavigate} className={rowCls}>
          <PopIcon icon="file" className="h-5 w-5 shrink-0 text-slate-700" />
          Syarat dan Ketentuan
        </Link>

        <div className={dividerCls} />

        <button
          onClick={() => {
            onNavigate();
            logout();
          }}
          className={`${rowCls} text-rose-600 hover:bg-rose-50`}
        >
          <PopIcon icon="logout" className="h-5 w-5 shrink-0" />
          Log Out
        </button>
      </nav>
    </div>
  );
};

export default ProfilePopover;
