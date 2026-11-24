# Spec: Codebase Restructure & Architecture Hygiene (4 Area)

> **Status:** Proposed / Awaiting Review
> **Tanggal:** 2026-11-20
> **Author:** Antigravity
> **Skills yang Digunakan:**
>
> - `nextjs-app-router-patterns`
> - `vercel-composition-patterns`
> - `vercel-react-best-practices`
> - `codebase-design`
> - `spec-driven-development`
> - `constraint-driven-development`

---

## 1. Objective

Meningkatkan kualitas arsitektur, konsistensi penamaan, modularitas library, dan UX transisi rute pada seluruh aplikasi Siedu dengan menuntaskan 4 area perapian:

1. **Area 1 (Instant Loading UX):** Menyediakan layout-level Suspense boundaries (`loading.tsx`) untuk route group `(parent)` dan `admin/` dengan skeleton shimmer proporsional.
2. **Area 2 (Dead Code Elimination):** Menghapus komponen usang yang sudah tidak memiliki pemanggil (`src/components/teacher/catatan-pertemuan-form.tsx`).
3. **Area 3 (Naming Standardization):** Menyeragamkan seluruh nama file komponen ke format **kebab-case** secara konsisten.
4. **Area 4 (Modularisasi `src/lib/`):** Mengelompokkan utility, data teks hukum, dan konfigurasi auth ke dalam subdirektori semantik yang terisolasi.

---

## 2. Tech Stack & Commands

- **Framework:** Next.js 16.3.4 (App Router & Turbopack), React 19, TypeScript 5.
- **Styling:** Tailwind CSS v4, Lucide React.
- **Verification Commands:**
    - TypeScript Compiler:
        ```powershell
        powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
        ```
    - Git Status Check:
        ```bash
        git status --short
        ```

---

## 3. Scope & Capability Map (4 Modul)

| Modul ID                 | Tanggung Jawab                                                  | File Terkait                                                                                                                         | Dependensi            |
| ------------------------ | --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | --------------------- |
| `mod-loading-states`     | Pembuatan skeleton loading di level layout `(parent)` & `admin` | `src/app/[locale]/(parent)/loading.tsx`, `src/app/[locale]/admin/loading.tsx`                                                        | —                     |
| `mod-dead-code`          | Pembersihan file dead code yang sudah didekomisioning           | Hapus `src/components/teacher/catatan-pertemuan-form.tsx`                                                                            | —                     |
| `mod-naming-standard`    | Standardisasi nama file komponen ke kebab-case                  | `src/components/auth/`, `src/components/landing/`, `src/components/pendaftaran/`, `src/components/common/`, `src/components/navbar/` | —                     |
| `mod-lib-modularization` | Pemisahan static content, formatters, dan auth helpers          | `src/lib/content/`, `src/lib/format/`, `src/lib/auth/`                                                                               | `mod-naming-standard` |

**Urutan Eksekusi:**
`mod-loading-states` $\rightarrow$ `mod-dead-code` $\rightarrow$ `mod-naming-standard` $\rightarrow$ `mod-lib-modularization` $\rightarrow$ Verifikasi Final.

---

## 4. Rincian Teknis Per Modul

### Modul 1: `mod-loading-states` (Instant Route Skeletons)

- **Target File Baru:**
    1. `src/app/[locale]/(parent)/loading.tsx`: Skeleton dashboard wali murid (kartu sambutan, ringkasan anak, jadwal sesi terdekat, shimmer card).
    2. `src/app/[locale]/admin/loading.tsx`: Skeleton dashboard/tabel admin (page header, filter tabs shimmer, tabel data placeholder).
- **Aturan UX (CONSTRAINTS.md):**
    - Menggunakan geometry skeleton shimmer (`animate-pulse bg-slate-200/80 dark:bg-slate-800`), dilarang menggunakan fullscreen spinner berputar.

### Modul 2: `mod-dead-code` (Pembersihan Komponen Usang)

- **Aksi:** Menghapus `src/components/teacher/catatan-pertemuan-form.tsx` menggunakan `git rm`.
- **Justifikasi:** Komponen sudah 100% digantikan oleh `src/components/teacher/attendance/session-journal-form.tsx` (sesuai spesifikasi dekomisioning laporan di `DAFTAR_HALAMAN.md`).

### Modul 3: `mod-naming-standard` (Standardisasi Kebab-Case)

Menyeragamkan file komponen sisa yang masih menggunakan PascalCase:

- `src/components/auth/LoginForm.tsx` $\rightarrow$ `login-form.tsx`
- `src/components/auth/RegisterForm.tsx` $\rightarrow$ `register-form.tsx`
- `src/components/auth/GoogleButton.tsx` $\rightarrow$ `google-button.tsx`
- `src/components/landing/HeroSection.tsx` $\rightarrow$ `hero-section.tsx`
- `src/components/landing/HeroRain.tsx` $\rightarrow$ `hero-rain.tsx`
- `src/components/landing/WaveAnimation.tsx` $\rightarrow$ `wave-animation.tsx`
- `src/components/landing/TestimonialTeacher.tsx` $\rightarrow$ `testimonial-teacher.tsx`
- `src/components/landing/CountUp.tsx` $\rightarrow$ `count-up.tsx`
- `src/components/landing/FaqSection.tsx` $\rightarrow$ `faq-section.tsx`
- `src/components/landing/FeatureSplit.tsx` $\rightarrow$ `feature-split.tsx`
- `src/components/landing/FinalCta.tsx` $\rightarrow$ `final-cta.tsx`
- `src/components/landing/JenjangCards.tsx` $\rightarrow$ `jenjang-cards.tsx`
- `src/components/landing/LangkahMemulai.tsx` $\rightarrow$ `langkah-memulai.tsx`
- `src/components/landing/ServicesCards.tsx` $\rightarrow$ `services-cards.tsx`
- `src/components/landing/TestimonialCarousel.tsx` $\rightarrow$ `testimonial-carousel.tsx`
- `src/components/landing/TestimonialsSection.tsx` $\rightarrow$ `testimonials-section.tsx`
- `src/components/landing/TrustIndicators.tsx` $\rightarrow$ `trust-indicators.tsx`
- `src/components/pendaftaran/AccountInfoForm.tsx` $\rightarrow$ `account-info-form.tsx`
- `src/components/pendaftaran/ChildInfoForm.tsx` $\rightarrow$ `child-info-form.tsx`
- `src/components/contact/ContactForm.tsx` $\rightarrow$ `contact-form.tsx`
- `src/components/navbar/DashboardNavbar.tsx` $\rightarrow$ `dashboard-navbar.tsx`
- `src/components/common/Footer.tsx` $\rightarrow$ `footer.tsx`
- `src/components/common/SmoothScroll.tsx` $\rightarrow$ `smooth-scroll.tsx`
- `src/components/common/LogoutDialog.tsx` $\rightarrow$ `logout-dialog.tsx`
- `src/components/common/ProfilePopover.tsx` $\rightarrow$ `profile-popover.tsx`
- `src/components/admin/AdminSidebar.tsx` $\rightarrow$ `admin-sidebar.tsx`

### Modul 4: `mod-lib-modularization` (Kategorisasi `src/lib/`)

Membuat subfolder semantik dan memindahkan helper murni:

1. `src/lib/content/`:
    - `privacy-policy.ts` $\rightarrow$ `src/lib/content/privacy-policy.ts`
    - `syarat-ketentuan.ts` $\rightarrow$ `src/lib/content/syarat-ketentuan.ts`
2. `src/lib/format/`:
    - `format.ts` $\rightarrow$ `src/lib/format/format.ts`
    - `hari.ts` $\rightarrow$ `src/lib/format/hari.ts`
    - `label.ts` $\rightarrow$ `src/lib/format/label.ts`
    - `phone.ts` $\rightarrow$ `src/lib/format/phone.ts`
    - `terbilang.ts` $\rightarrow$ `src/lib/format/terbilang.ts`
3. `src/lib/auth/`:
    - `auth-adapter.ts` $\rightarrow$ `src/lib/auth/auth-adapter.ts`
    - `auth.config.ts` $\rightarrow$ `src/lib/auth/auth.config.ts`
    - `oauth.ts` $\rightarrow$ `src/lib/auth/oauth.ts`
    - `token.ts` $\rightarrow$ `src/lib/auth/token.ts`
4. Root `src/lib/` yang tetap dipertahankan di root:
    - `auth.ts` (NextAuth v5 root initialization)
    - `utils.ts` (Tailwind `cn()`)
    - `site.ts` (metadata global situs)
    - `collect.ts` (Prisma helper)
    - `rate-limit.ts` (API rate limiter)
    - `midtrans.ts`, `mail.ts`, `whatsapp.ts` (3rd party clients)

---

## 5. Code Style & Boundary Contracts

- **Always:**
    - Lakukan pemindahan dengan `git mv` agar riwayat file dan commit tidak putus.
    - Perbarui seluruh import di seluruh halaman yang terdampak secara presisi.
    - Verifikasi kelolosan kompilasi `npx tsc --noEmit` wajib bernilai 0.
- **Ask First:**
    - Mengubah logika internal state atau validasi formulir.
    - Mengubah skema database Prisma.
- **Never:**
    - Menambahkan supresi `@ts-ignore` atau `@ts-expect-error`.
    - Merusak struktur URL routing publik/parent/teacher/admin.

---

## 6. Success Criteria (Kriteria Keberhasilan)

1. `(parent)` dan `admin` memiliki fallback skeleton `loading.tsx` yang halus dan bebas CLS.
2. Tidak ada lagi komponen usang yang mengambang tanpa pemanggil.
3. Seluruh nama file komponen di `src/components/` 100% konsisten berformat `kebab-case.tsx`.
4. Folder `src/lib/` terstruktur rapi ke subfolder semantik (`content/`, `format/`, `auth/`).
5. Eksekusi `powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null` menghasilkan `Exit code 0` tanpa error.
