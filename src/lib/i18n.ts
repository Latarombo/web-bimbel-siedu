export const LANGS = { id: "Bahasa Indonesia (ID)", en: "English (US)" } as const;
export type Lang = keyof typeof LANGS;

/** Terjemahan chrome publik (navbar + footer). Konten halaman masih ID. */
export const chrome: Record<Lang, {
  nav: { classes: string; about: string; privacy: string; terms: string; login: string; signup: string; dashboard: string };
  footer: {
    desc: string; program: string; company: string; help: string; viewAll: string; rights: string;
    companyLinks: string[]; helpLinks: string[];
  };
}> = {
  id: {
    nav: { classes: "Jelajah Kelas", about: "Tentang", privacy: "Kebijakan Privasi", terms: "Ketentuan", login: "Masuk", signup: "Daftar", dashboard: "Dashboard" },
    footer: {
      desc: "Platform manajemen pembelajaran terintegrasi untuk masa depan pendidikan anak Anda.",
      program: "Program Belajar",
      company: "Perusahaan",
      help: "Bantuan",
      viewAll: "Lihat Semua Kelas",
      companyLinks: ["Tentang Kami", "Karier", "Pengajar Kami", "Blog", "Testimoni"],
      helpLinks: ["FAQ", "Kebijakan Privasi", "Syarat & Ketentuan", "Kontak Kami"],
      rights: "© 2026 Siedu. Seluruh hak cipta dilindungi.",
    },
  },
  en: {
    nav: { classes: "Browse Classes", about: "About", privacy: "Privacy Policy", terms: "Terms", login: "Login", signup: "Sign Up", dashboard: "Dashboard" },
    footer: {
      desc: "An integrated learning management platform for the future of your child's education.",
      program: "Learning Programs",
      company: "Company",
      help: "Help",
      viewAll: "View All Classes",
      companyLinks: ["About Us", "Career", "Our Teachers", "Blog", "Testimonial"],
      helpLinks: ["FAQ", "Privacy Policy", "Terms & Conditions", "Contact Us"],
      rights: "© 2026 Siedu. All rights reserved.",
    },
  },
};
