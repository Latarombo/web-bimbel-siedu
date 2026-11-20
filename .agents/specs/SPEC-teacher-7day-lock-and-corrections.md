# Spec: Penguncian Edit 7 Hari & Alur Koreksi Guru (BR#18)

> **Status**: Landed  
> **Modul Terkait**: `teacher-attendance`, `teacher-grading`, `teacher-corrections`, `admin-corrections`  
> **Aturan Bisnis Terkait**: BR#18 (Batas Waktu Edit Presensi & Nilai Guru 7 Hari & Alur Koreksi Admin)

---

## 1. Objective & User Story

### Objective
Menegakkan kepatuhan aturan bisnis **BR#18** di seluruh permukaan aplikasi guru (presensi, nilai progres, rapor/riwayat siswa, dan drawer penilaian cepat) serta memastikan alur pengajuan koreksi ke admin (*Correction Approval Flow*) berjalan mulus dan kontekstual dari titik ditemukannya data terkunci tanpa mengharuskan guru mencari ulang data secara manual.

### User Story
- **Sebagai Guru**, saya dapat melihat dengan jelas entri presensi atau nilai mana yang masih dalam masa tenggang 7 hari (dapat diedit langsung) dan entri mana yang telah terkunci permanen.
- **Sebagai Guru**, saat saya mendapati entri yang terkunci dan perlu perbaikan, saya dapat menekan tautan langsung "Ajukan Koreksi" pada baris/kartu tersebut yang akan membuka formulir pengajuan koreksi dengan data entri target yang sudah terpilih secara otomatis (*pre-selected*).
- **Sebagai Guru**, saat menginput nilai di Quick Grade Drawer, saya mendapatkan informasi transparan mengenai kebijakan batas 7 hari ini sebelum menyimpan.
- **Sebagai Admin**, saya dapat meninjau, menyetujui, atau menolak setiap pengajuan koreksi guru dengan catatan verifikasi resmi, dan seluruh aksi tercatat permanen di tabel audit sistem.

---

## 2. Command Verifikasi

```bash
# Verifikasi tipe TypeScript tanpa error:
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Data Contracts & Type Adjustments

### A. SiswaPresensi Type (`src/components/teacher/attendance/attendance-table.tsx`)
```typescript
export type SiswaPresensi = {
  pendaftaranId: number;
  nama: string;
  anakId?: number;
  jenjangTerakhir?: string | null;
  status?: string;
  catatan?: string;
  terkunci: boolean;
  presensiId?: number; // ID record presensi untuk deep-link koreksi
};
```

### B. PengajuanKoreksiFormProps (`src/components/teacher/pengajuan-koreksi-form.tsx`)
```typescript
interface PengajuanKoreksiFormProps {
  lockedEntries: LockedEntryItem[];
  initialKey?: string; // Format: `${entitas}-${id}` (contoh: "presensi-12" atau "nilai-45")
}
```

### C. TeacherCorrections Page SearchParams (`src/app/[locale]/(teacher)/teacher/corrections/page.tsx`)
```typescript
interface TeacherCorrectionsProps {
  searchParams?: Promise<{
    entitas?: string;
    id?: string;
  }>;
}
```

### D. Duplicate Prevention di Server Action (`src/app/actions/teacher.ts`)
```typescript
// Guard: Cek apakah sudah ada pengajuan pending untuk entitas dan entitasId yang sama
const [existingPending] = await collect(
  db.orm.public.PengajuanKoreksi.where((p) => p.entitas.eq(entitas))
    .where((p) => p.entitasId.eq(entitasId))
    .where((p) => p.status.eq("menunggu"))
    .all()
);
if (existingPending) {
  return { error: t("correctionAlreadyPending") };
}
```

---

## 4. Acceptance Criteria (Given-When-Then)

### AC-1: Indikator & Contextual CTA pada Presensi Terkunci
- **Given** sebuah sesi presensi yang telah dicatat lebih dari 7 hari kalender yang lalu (`!dalamJendela7Hari(lama.createdAt)`),
- **When** guru membuka halaman presensi sesi tersebut (`/teacher/classes/[id]/sessions/[date]/attendance`),
- **Then** status radio button dan input catatan dinonaktifkan (`disabled`), badge menampilkan "Kunci", dan terdapat tautan "Ajukan Koreksi" yang mengarah ke `/teacher/corrections?entitas=presensi&id=<id>`.

### AC-2: Auto-Selection pada Formulir Koreksi Guru
- **Given** guru menekan tautan "Ajukan Koreksi" dari baris presensi atau nilai tertentu,
- **When** guru tiba di `/teacher/corrections?entitas=<entitas>&id=<id>`,
- **Then** `PengajuanKoreksiForm` secara otomatis memilih entri terkunci tersebut dan mengisi nilai usulan awal sesuai data terkini dari entri tersebut.

### AC-3: Pencegahan Pengajuan Ganda (Anti-Spam Pending Request)
- **Given** sebuah entitas presensi atau nilai telah diajukan koreksinya dan berstatus `menunggu`,
- **When** guru mencoba mengirim pengajuan koreksi baru untuk entitas dan entitasId yang sama,
- **Then** sistem menolak operasi dan menampilkan pesan kesalahan ramah bahwa pengajuan untuk entri ini sedang menunggu persetujuan admin.

### AC-4: Contextual CTA pada Riwayat Nilai Murid
- **Given** seorang murid memiliki entri nilai progres yang dicatat > 7 hari yang lalu,
- **When** guru membuka tab legacy/nilai individu pada `/teacher/grades/[enrollmentId]`,
- **Then** baris nilai yang terkunci menampilkan label "Terkunci (aturan 7 hari)" dan tombol tautan "Ajukan Koreksi Nilai Ini →" menuju `/teacher/corrections?entitas=nilai&id=<id>`.

### AC-5: Informasi Transparan di Quick Grade Drawer
- **Given** guru membuka Quick Grade Drawer dari halaman kelas,
- **When** drawer terbuka,
- **Then** ditampilkan banner informatif yang menjelaskan bahwa nilai dapat disunting mandiri selama 7 hari, dan setelah 7 hari terkunci permanen sesuai BR#18.

---

## 5. Vertical Slices & Implementasi

- **Slice 1 (Koreksi Flow & Auto-Select)**:
  - Tambahkan dukungan `searchParams` di `src/app/[locale]/(teacher)/teacher/corrections/page.tsx`.
  - Dukung `initialKey` pada `src/components/teacher/pengajuan-koreksi-form.tsx`.
- **Slice 2 (Presensi Deep Link)**:
  - Perbarui `SiswaPresensi` di `attendance-table.tsx` untuk menyertakan `presensiId`.
  - Tambahkan CTA "Ajukan Koreksi" di samping label Kunci pada tabel presensi.
  - Salurkan `lama?.id` ke `anakList` pada `attendance/page.tsx`.
- **Slice 3 (Nilai Deep Link & Quick Drawer Note)**:
  - Tambahkan direct link "Ajukan Koreksi Nilai Ini →" di `src/app/[locale]/(teacher)/teacher/grades/[enrollmentId]/page.tsx`.
  - Tambahkan info banner BR#18 di `src/components/teacher/classes/quick-grade-drawer.tsx`.
- **Slice 4 (Backend Guard & i18n)**:
  - Tambahkan pengecekan pengajuan pending di `ajukanKoreksi` (`src/app/actions/teacher.ts`).
  - Tambahkan kunci terjemahan `correctionAlreadyPending` di `messages/id/teacher.json` dan `messages/en/teacher.json`.
- **Slice 5 (Verifikasi & QA)**:
  - Eksekusi `npx tsc --noEmit` via PowerShell.
  - Perbarui roadmap `ROADMAP_SIEDU.md`.
