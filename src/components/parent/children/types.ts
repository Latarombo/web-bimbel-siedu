export type ChildData = {
  id: number;
  nama: string;
  tanggalLahir: string;
  jenjangTerakhir: 'TK' | 'SD' | 'SMP' | 'SMA' | string | null;
  tingkat: string | null;
  emailNotifikasi: string | null;
  nomorTelepon: string | null;
  persetujuanFoto: boolean;
  jumlahKelasAktif: number;
  isLocked: boolean;
  kelasAktif?: {
    mapel: string;
    guru: string;
  } | null;
  jadwal?: {
    hari: string;
    mulai: string;
    selesai: string;
    mapel: string;
    guru: string;
    tanggalBerikutnya: string | null;
  }[];
  presensi?: {
    total: number;
    hadir: number;
    izin: number;
    sakit: number;
    alpa: number;
  };
  persenHadir?: number | null;
};

export type JenjangStyle = {
  bgGradient: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  avatarBg: string;
  cardBorderHover: string;
  ringColor: string;
  accentText: string;
  lightGlow: string;
};

export const JENJANG_STYLES: Record<string, JenjangStyle> = {
  TK: {
    bgGradient: "from-amber-500/10 via-orange-500/5 to-transparent",
    badgeBg: "bg-amber-50",
    badgeText: "text-amber-800",
    badgeBorder: "border-amber-200/80",
    avatarBg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
    cardBorderHover: "hover:border-amber-300 hover:shadow-amber-500/10",
    ringColor: "focus-visible:ring-amber-500",
    accentText: "text-amber-700",
    lightGlow: "bg-amber-400/15",
  },
  SD: {
    bgGradient: "from-sky-500/10 via-blue-500/5 to-transparent",
    badgeBg: "bg-sky-50",
    badgeText: "text-sky-800",
    badgeBorder: "border-sky-200/80",
    avatarBg: "bg-gradient-to-br from-sky-400 to-blue-600 text-white",
    cardBorderHover: "hover:border-sky-300 hover:shadow-sky-500/10",
    ringColor: "focus-visible:ring-blue-500",
    accentText: "text-sky-700",
    lightGlow: "bg-sky-400/15",
  },
  SMP: {
    bgGradient: "from-indigo-500/10 via-violet-500/5 to-transparent",
    badgeBg: "bg-indigo-50",
    badgeText: "text-indigo-800",
    badgeBorder: "border-indigo-200/80",
    avatarBg: "bg-gradient-to-br from-indigo-500 to-violet-600 text-white",
    cardBorderHover: "hover:border-indigo-300 hover:shadow-indigo-500/10",
    ringColor: "focus-visible:ring-indigo-500",
    accentText: "text-indigo-700",
    lightGlow: "bg-indigo-400/15",
  },
  SMA: {
    bgGradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
    badgeBg: "bg-emerald-50",
    badgeText: "text-emerald-800",
    badgeBorder: "border-emerald-200/80",
    avatarBg: "bg-gradient-to-br from-emerald-500 to-teal-600 text-white",
    cardBorderHover: "hover:border-emerald-300 hover:shadow-emerald-500/10",
    ringColor: "focus-visible:ring-emerald-500",
    accentText: "text-emerald-700",
    lightGlow: "bg-emerald-400/15",
  },
  DEFAULT: {
    bgGradient: "from-blue-500/10 via-slate-500/5 to-transparent",
    badgeBg: "bg-slate-100",
    badgeText: "text-slate-700",
    badgeBorder: "border-slate-200",
    avatarBg: "bg-gradient-to-br from-blue-600 to-slate-700 text-white",
    cardBorderHover: "hover:border-blue-300 hover:shadow-blue-500/10",
    ringColor: "focus-visible:ring-blue-500",
    accentText: "text-blue-700",
    lightGlow: "bg-blue-400/15",
  },
};
