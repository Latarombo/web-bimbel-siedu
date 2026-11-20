# SPEC: Modern Web Architecture & UI Elevation (Siedu Master Spec)

> **Status:** Draft / Approved by User Instruction  
> **Tanggal:** 2026-11-20  
> **Author:** Antigravity  
> **Skills yang Digunakan:**
> - `modern-web-guidance` (`dialog`, `light-dismiss-a-dialog`, `forms`, `validate-input-after-interaction`, `accessible-error-announcement`, `responsive-table`)
> - `spec-driven-development` (Workflow SDD terstruktur)
> - `constraint-driven-development` (Kepatuhan CONSTRAINTS.md)
> - `frontend-design` & `design-taste-frontend` (Icon restraint, clean typography, anti-AI cliches)
> - `nextjs-app-router-patterns` & `vercel-react-best-practices` (Zero waterfall, suspense boundaries, hydration safety)

---

## 1. Objective & User Story

Sebagai pengguna dan pengembang Siedu, saya ingin seluruh antarmuka web, modal/dialog interaktif, formulir validasi, dan tabel data diperbarui mengikuti standar **Modern Web Platform (HTML5 native APIs, Dialog, Popover, Constraint Validation, Responsive Tables)** dengan eksekusi bertahap (*tracer-bullet slices*) yang terverifikasi ketat, sehingga:
1. Komponen overlay (modal, sheet, dialog) menggunakan semantik standar dengan pengelolaan fokus otomatis, inert backdrop, overscroll containment, dan light-dismiss yang aksesibel tanpa library pihak ketiga yang membengkak.
2. Formulir memiliki validasi native yang tidak memicu error prematur (`:user-invalid`), mendukung autofill browser baku, dan sinkron dengan assistive technology (a11y).
3. Tabel dan list data bersifat responsif, bebas layout shift, dan mudah dipindai di berbagai ukuran layar.
4. Seluruh kode lolos kompilasi TypeScript (`npx tsc --noEmit` bernilai 0) dan mematuhi batasan di `CONSTRAINTS.md` serta aturan desain di `AGENTS.md`.

---

## 2. Rencana Eksekusi Berurutan (Sequential Slices)

```
[Fase 0: Baseline & Hygiene Lock] 
       ⬇
[Fase 1: Overlay, Modal, Dialog & Drawer Modernization]
       ⬇
[Fase 2: Form & Constraint Validation Modernization]
       ⬇
[Fase 3: Responsive Data Tables & Lists]
       ⬇
[Fase 4: Layout Loading UX & Scroll Containment]
       ⬇
[Fase 5: Verification, Audit & Guidance Disclosure]
```

---

## 3. Scope & Capability Map

| Slice ID | Lingkup Kerja | Target Komponen / Rute | Panduan Modern Web (`modern-web-guidance`) |
|---|---|---|---|
| `slice-0-hygiene` | Verifikasi final restrukturisasi kebab-case, dead-code cleanup, modularisasi `lib/` | `src/components/`, `src/lib/`, `src/hooks/` | Standard hygiene |
| `slice-1-dialogs` | Refactor modal & drawer ke standard native pattern (`<dialog>`, light-dismiss, overscroll containment, accessible names) | `logout-dialog.tsx`, `filter-katalog-modal.tsx`, `modal-pilih-kelas.tsx`, `quick-pay-modal.tsx`, `receipt-modal.tsx`, `export-class-modal.tsx`, `persetujuan-modal.tsx`, `quick-grade-drawer.tsx` | `dialog`, `light-dismiss-a-dialog`, `prevent-page-scroll-under-modal-dialog` |
| `slice-2-forms` | Validasi formulir non-prematur, atribut autocomplete baku, inputmode mobile | `login-form.tsx`, `register-form.tsx`, `account-info-form.tsx`, `child-info-form.tsx`, `contact-form.tsx`, `child-edit-form.tsx` | `forms`, `validate-input-after-interaction`, `accessible-error-announcement` |
| `slice-3-tables` | Tabel data responsif, perataan angka tabular (`tabular-nums`), overflow hygiene | `attendance`, `grades`, `payments`, `admin tables` | `responsive-table` |
| `slice-4-loading` | Verifikasi layout Suspense skeletons & zero CLS | `(parent)/loading.tsx`, `admin/loading.tsx` | Skeleton shimmer & view stability |
| `slice-5-audit` | Audit akhir & verifikasi `tsc --noEmit` bersih 0 | Seluruh repository | Final Verification |

---

## 4. Verification Commands

Setiap irisan (*slice*) wajib diverifikasi menggunakan perintah interop Windows PowerShell:
```powershell
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```
Toleransi error TypeScript: **0**.

---

## 5. Acceptance Criteria (Given-When-Then)

### Slice 1: Modal & Dialog
- **Given** pengguna membuka modal konfirmasi atau filter,
- **When** modal terbuka,
- **Then** fokus otomatis berpindah ke kontrol aman pertama, backdrop meredupkan konten belakang dengan `overscroll-behavior: contain`, dan dialog dapat ditutup dengan `Esc` atau klik di luar (light dismiss).

### Slice 2: Formulir & Validasi
- **Given** pengguna mengisi formulir pendaftaran atau kontak,
- **When** pengguna belum menyelesaikan interaksi atau submit,
- **Then** pesan error tidak muncul prematur; setelah blur atau submit, pesan validasi terhubung dengan `aria-describedby` dan `aria-invalid`.

### Slice 3: Tabel & List Responsif
- **Given** guru atau admin melihat daftar siswa atau presensi pada layar mobile/tablet,
- **When** tabel data memuat kolom jam dan status,
- **Then** angka numerik ditampilkan sejajar (`tabular-nums`), tabel memiliki scroll container horizontal yang rapi tanpa merusak tata letak halaman induk.
