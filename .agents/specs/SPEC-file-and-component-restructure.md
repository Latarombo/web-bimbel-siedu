# SPEC: Perapian Struktur File Komponen & React Hooks (Scope 1)

> **Status:** Draft / Ready for Implementation  
> **Tanggal:** 2026-11-20  
> **Author:** Antigravity  
> **Skills yang Digunakan:**
> - `nextjs-app-router-patterns`: Prinsip *Scope Rule* & kolokasi domain UI, isolasi hooks vs backend libs.
> - `vercel-composition-patterns`: Standarisasi arsitektur komponen & konsistensi re-export.
> - `vercel-react-best-practices`: Kebersihan import tree dan pencegahan waterfall bundle.
> - `codebase-design`: Pemisahan batas antarmuka modul yang jelas (*deep modules*).

---

## 1. Objective & User Story

Sebagai developer Siedu, saya ingin struktur file komponen di `src/components/` terorganisir rapi ke dalam subfolder domain masing-masing dan custom React hooks dipisahkan ke `src/hooks/`, sehingga:
1. Direktori `src/components/` bersih dari file yang berceceran di root.
2. Tidak ada pencampuran antara utility backend/server (`src/lib/`) dengan React client hooks.
3. Seluruh import path di seluruh rute dan komponen terbarui secara konsisten tanpa merusak kompilasi TypeScript (`tsc --noEmit`).

---

## 2. Pemetaan Pemindahan File (File Mapping)

### A. Komponen Domain Autentikasi (`src/components/auth/`)
| File Asal | Lokasi Baru |
|---|---|
| `src/components/LoginForm.tsx` | `src/components/auth/LoginForm.tsx` |
| `src/components/RegisterForm.tsx` | `src/components/auth/RegisterForm.tsx` |
| `src/components/GoogleButton.tsx` | `src/components/auth/GoogleButton.tsx` |

### B. Komponen Domain Landing Page (`src/components/landing/`)
| File Asal | Lokasi Baru |
|---|---|
| `src/components/HeroSection.tsx` | `src/components/landing/HeroSection.tsx` |
| `src/components/HeroRain.tsx` | `src/components/landing/HeroRain.tsx` |
| `src/components/WaveAnimation.tsx` | `src/components/landing/WaveAnimation.tsx` |
| `src/components/wave-shell.tsx` | `src/components/landing/wave-shell.tsx` |
| `src/components/TestimonialTeacher.tsx` | `src/components/landing/TestimonialTeacher.tsx` |

### C. Komponen Domain Pendaftaran (`src/components/pendaftaran/`)
| File Asal | Lokasi Baru |
|---|---|
| `src/components/AccountInfoForm.tsx` | `src/components/pendaftaran/AccountInfoForm.tsx` |
| `src/components/ChildInfoForm.tsx` | `src/components/pendaftaran/ChildInfoForm.tsx` |
| `src/components/clear-draft.tsx` | `src/components/pendaftaran/clear-draft.tsx` |

### D. Komponen Domain Kontak & Kelas (`src/components/contact/` & `src/components/kelas/`)
| File Asal | Lokasi Baru |
|---|---|
| `src/components/ContactForm.tsx` | `src/components/contact/ContactForm.tsx` |
| `src/components/kelas-card.tsx` | `src/components/kelas/kelas-card.tsx` |

### E. Komponen Navigasi (`src/components/navbar/`)
| File Asal | Lokasi Baru |
|---|---|
| `src/components/DashboardNavbar.tsx` | `src/components/navbar/DashboardNavbar.tsx` |
| `src/components/LandingNavbar.tsx` | Dihapus / dialihkan langsung ke `src/components/navbar/index.tsx` |

### F. Komponen Shared / Primitives (`src/components/common/`)
| File Asal | Lokasi Baru |
|---|---|
| `src/components/Footer.tsx` | `src/components/common/Footer.tsx` |
| `src/components/SmoothScroll.tsx` | `src/components/common/SmoothScroll.tsx` |
| `src/components/status-badge.tsx` | `src/components/common/status-badge.tsx` |
| `src/components/language-switcher.tsx` | `src/components/common/language-switcher.tsx` |
| `src/components/LogoutDialog.tsx` | `src/components/common/LogoutDialog.tsx` |
| `src/components/ProfilePopover.tsx` | `src/components/common/ProfilePopover.tsx` |

### G. React Custom Hooks (`src/hooks/`)
| File Asal | Lokasi Baru |
|---|---|
| `src/lib/use-form-draft.ts` | `src/hooks/use-form-draft.ts` |
| `src/lib/use-scroll-lock.ts` | `src/hooks/use-scroll-lock.ts` |

---

## 3. Strategi Transisi & Zero Downtime

1. Pindahkan file fisik ke folder tujuan.
2. Perbarui seluruh import di semua file pemanggil (`src/app/`, `src/components/`, dll.).
3. Buat file re-export sementara di lokasi asal jika masih ada ketergantungan dinamis, lalu hapus jika seluruh import sudah bersih.
4. Jalankan verifikasi ketat via Windows PowerShell:
   ```powershell
   powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
   ```

---

## 4. Out of Scope
- Tidak mengubah logika internal komponen, form handling, maupun skema data.
- Tidak merestrukturisasi rute App Router `src/app/[locale]/` yang sudah berjalan.
