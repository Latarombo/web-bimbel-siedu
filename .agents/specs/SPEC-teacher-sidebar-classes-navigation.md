# SPEC: Navigasi Kelas pada Sidebar Guru (Model AI Web Recent) & Decommission Halaman /teacher/classes

> **Modul ID:** `teacher-sidebar-classes-navigation`
> **Aktor:** Guru (`role: guru`)
> **Status:** Approved (SDD Phase 2 - Ready for Implementation)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md), [CONSTRAINTS.md](../../CONSTRAINTS.md), [DESIGN.md](../docs/DESIGN.md), [DAFTAR_HALAMAN.md](../docs/DAFTAR_HALAMAN.md).

---

## 1. Objective & User Story

### Konteks & Masalah

1. **Redundansi Halaman Indeks Kelas:** Halaman `/teacher/classes` sebelumnya hanya berfungsi sebagai daftar kartu kelas perantara sebelum guru masuk ke detail kelas spesifik (`/teacher/classes/[classId]`). Guru aktif memerlukan alur navigasi yang jauh lebih gesit untuk beralih antar kelas yang diampu tanpa bolak-balik ke halaman indeks.
2. **Adopsi Pola Navigasi AI Web (Recent/Chat History):** Seperti halnya bilah sisi (sidebar) aplikasi AI web modern (ChatGPT, Claude, Gemini) yang meletakkan riwayat percakapan langsung di sidebar untuk akses instan satu kali klik, guru memerlukan daftar kelas yang diampu langsung berada di sidebar sebagai menu cepat.
3. **Decommission Halaman `/teacher/classes`:** Sesuai arahan pengguna, rute `/teacher/classes/page.tsx` dihapus total sehingga rute tersebut mengembalikan 404 Not Found jika diakses secara langsung.

### User Story

_Sebagai Guru_, saya ingin melihat daftar seluruh kelas yang saya ampu langsung di sidebar seperti daftar riwayat di bilah sisi web AI, sehingga saya dapat langsung berpindah antar kelas dengan satu klik dari halaman manapun tanpa memerlukan halaman perantara `/teacher/classes`.

---

## 2. Commands Verifikasi

```bash
# Verifikasi kompilasi TypeScript (Wajib 0 error)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null

# Verifikasi linter
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run lint" < /dev/null
```

---

## 3. Project Structure & Affected Files

```
src/
├── app/
│   └── [locale]/
│       └── (teacher)/
│           ├── layout.tsx                                     → Teruskan data teacherClasses ke TeacherShell
│           └── teacher/
│               ├── classes/
│               │   ├── page.tsx                               → DIHAPUS TOTAL (mengembalikan 404)
│               │   └── [classId]/
│               │       └── page.tsx / class-detail-view.tsx   → Perbarui link back/crumb ke /teacher/dashboard
│               └── dashboard/
│                   └── page.tsx                               → Perbarui fallback link yang sebelumnya ke /teacher/classes
├── components/
│   └── teacher/
│       ├── teacher-shell.tsx                                  → Menerima teacherClasses dan meneruskannya ke TeacherSidebar
│       ├── teacher-sidebar.tsx                                → Hapus menu statis '/teacher/classes', render section Kelas yang Diampu ala web AI
│       └── classes/
│           └── class-detail-view.tsx                          → Back link mengarah ke /teacher/dashboard
```

---

## 4. Data Contracts & UI Specification

### A. Data Contract (`TeacherSidebarProps`)

```tsx
export interface TeacherClassItem {
    id: number;
    name: string;
    jenjang?: string;
    tingkat?: number;
}

interface TeacherSidebarProps {
    role: string;
    userName?: string;
    userEmail?: string | null;
    accountRole?: string;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    isDrawerOpen?: boolean;
    onCloseDrawer?: () => void;
    onOpenLogout?: () => void;
    teacherClasses?: TeacherClassItem[]; // Kelas yang diampu oleh guru
}
```

### B. Desain & Perilaku Navigasi Kelas (Ala Web AI Sidebar)

1. **Penempatan di Sidebar:**
    - Diletakkan di antara menu utama pembelajaran (Dashboard, Jadwal) dan menu administrasi (Nilai & Rapor, Status Pembelajaran), atau sebagai seksi mandiri _"Kelas"_ / _"Kelas Saya"_.
2. **Tampilan Saat Terbuka (Expanded Mode):**
    - Subheading kategori yang tenang: _"Kelas"_ (atau _"Kelas Saya"_).
    - Daftar item kelas dengan tinggi ringkas (`h-9`), padding proporsional (`px-3 py-1.5`), sudut membulat lembut (`rounded-md`).
    - Teks kelas memuat nama mata pelajaran & tingkat/jenjang (misal: `Matematika · Kelas 7` atau `IPA - 8`), terpotong rapi dengan `truncate`.
    - **Active State:** Bila `pathname` sama dengan `/teacher/classes/${class.id}` atau diawali `/teacher/classes/${class.id}/`, terapkan style aktif: `bg-slate-100 text-slate-950 font-semibold dark:bg-slate-800 dark:text-white`.
    - **Hover State:** `hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-800 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors`.
    - **Icon Restraint:** Tipografi bersih tanpa ikon pemanis yang berlebihan, mengikuti nuansa elegan daftar obrolan web AI.
3. **Tampilan Saat Diciutkan (Collapsed Mode - 72px):**
    - Daftar kelas disembunyikan secara bersih (`isCollapsed === true`), sehingga bilah samping 72px tetap ramping, fokus, dan tidak mengalami overflow horizontal.
4. **Tampilan di Mobile Drawer:**
    - Dirender secara identik di dalam drawer navigasi mobile agar pengguna layar kecil memiliki akses cepat yang sama.
5. **State Kosong (Empty State):**
    - Jika guru belum memiliki kelas yang diampu, tampilkan teks tenang berukuran kecil: `Belum ada kelas aktif` (tanpa clutter).

---

## 5. Acceptance Criteria (Given-When-Then)

1. **AC-1: Daftar Kelas Langsung di Sidebar**
    - _Given_ Guru login ke portal guru dengan beberapa kelas yang diampu,
    - _When_ Sidebar dalam kondisi terbuka (expanded) pada desktop atau drawer dibuka pada mobile,
    - _Then_ Terlihat seksi kelas yang memuat daftar kelas guru dengan tautan langsung ke `/teacher/classes/[classId]`.

2. **AC-2: Indikator Kelas Aktif**
    - _Given_ Guru membuka halaman `/teacher/classes/10` atau sub-halamannya (`/teacher/classes/10/sessions/...`),
    - _When_ Melihat sidebar,
    - _Then_ Item kelas ID 10 di sidebar ditandai dengan styling aktif (`bg-slate-100 dark:bg-slate-800`).

3. **AC-3: Mode Diciutkan (Collapsed 72px)**
    - _Given_ Guru menekan tombol ciutkan sidebar (collapse),
    - _When_ Lebar sidebar menjadi 72px,
    - _Then_ Daftar kelas tidak terlihat dan tidak menyebabkan horizontal scrollbar.

4. **AC-4: Penghapusan Total Halaman `/teacher/classes`**
    - _Given_ Pengguna atau browser mencoba membuka `/teacher/classes`,
    - _When_ Rute tersebut diakses,
    - _Then_ Aplikasi mengembalikan halaman 404 (Not Found).

5. **AC-5: Pembaruan Back Links & Navigasi Terkait**
    - _Given_ Guru berada di halaman detail kelas `/teacher/classes/[classId]`,
    - _When_ Guru menekan tombol kembali di breadcrumb/header,
    - _Then_ Guru diarahkan ke `/teacher/dashboard` (bukan `/teacher/classes` yang sudah 404).

---

## 6. Out-of-Scope

- Perubahan pada portal admin (`/admin/classes`).
- Perubahan pada API backend sesi atau database kelas.
