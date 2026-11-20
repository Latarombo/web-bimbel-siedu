# Spec-Driven Development (SDD) Specs Archive

Direktori ini adalah arsip pusat seluruh dokumen spesifikasi teknis (*feature specs*) yang dihasilkan dari workflow Spec-Driven Development sebelum kode diimplementasikan.

---

## 1. Hubungan dengan Master Capability Map
Sebelum membuat spesifikasi baru, periksa modul induk pada [`CAPABILITY_MAP.md`](./CAPABILITY_MAP.md). Pastikan fitur yang dispesifikasikan memiliki modul ID yang valid dan ketergantungan yang telah disetujui.

---

## 2. Standar Penamaan File
- **Format:** `SPEC-<modul-id>-<nama-fitur>.md` atau `SPEC-<nama-fitur>.md`
- **Contoh:** `SPEC-teacher-attendance-lock.md`, `SPEC-midtrans-snap-checkout.md`

---

## 3. Template Struktur Spec Baku Siedu

Setiap file spesifikasi di direktori ini **WAJIB** memuat komponen terstruktur berikut:

```markdown
# SPEC: [Nama Fitur / Modul]

> **Modul ID:** [Lihat CAPABILITY_MAP.md, misal: teacher-attendance, payment-midtrans]  
> **Aktor:** [Orang Tua / Guru / Admin / Sistem]  
> **Status:** [Draft / Approved / In Progress / Landed]  
> **Rujukan Aturan:** [BR#..., ADR-..., DESIGN.md Bagian ...]

---

## 1. Objective & User Story
- **Konteks & Masalah:** Masalah nyata apa yang diselesaikan?
- **User Story:** Sebagai [aktor], saya ingin [tindakan] sehingga [keuntungan bisnis/operasional].
- **Outcome Kunci:** Kriteria hasil akhir yang terukur saat fitur ini dinyatakan sukses.

---

## 2. Command Verifikasi (Wajib Lolos Sebelum Merge)
```bash
# Typecheck TypeScript (Wajib Exit Code 0)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null

# Build Next.js (Jika ada perubahan route/layout)
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run build" < /dev/null
```

---

## 3. UI/UX Contract & Interaksi (Rujukan: DESIGN.md & CONSTRAINTS.md)
- **Tipe Kontainer:** [Pilih salah satu: Halaman Penuh / Sheet Drawer / Dialog Center] (Sesuai Matriks DESIGN.md 7F).
- **Icon Restraint:** Ikon hanya untuk navigasi utama, tombol mandiri dengan `aria-label`, atau alert kritis. Dilarang ikon pemanis di tombol teks.
- **Header Standard:** Judul H1/H2 berdiri bersih tanpa pill/badge berjejer di samping teks.
- **Empty State Behavior:** Tampilan saat data kosong (border dashed halus, ikon netral, teks solutif, tombol CTA jika ada wewenang).
- **Loading & Skeleton:** Komponen skeleton shimmer yang memetakan bentuk layout akhir saat React 19 Streaming SSR aktif.
- **Data Table Layout:** Teks rata kiri, angka/nominal/tanggal rata kanan dengan `tabular-nums`, status rata tengah.
- **Mobile Responsive (< 640px):** Touch target minimal 44x44px, adaptasi tabel (scroll horizontal atau stacked cards).

---

## 4. Data Contracts & Interfaces
Definisi tipe data TypeScript, skema Zod, atau model Prisma yang mengikat input dan output:

```typescript
// Interface props, input payload, atau return Server Action
export interface ExampleFeaturePayload {
  id: number;
  // ...
}
```

---

## 5. Acceptance Criteria (Given — When — Then)

### Happy Path
- [ ] **AC 1 (Alur Utama):**  
  - **Given:** [Kondisi prasyarat data dan sesi pengguna]  
  - **When:** [Tindakan/input pengguna dieksekusi]  
  - **Then:** [Hasil perubahan data, respons sistem, dan UI feedback yang muncul]

### Edge Cases & Failure Scenarios
- [ ] **AC 2 (Validasi Input & Error Handling):**  
  - **Given:** [Data tidak valid, input bertabrakan, atau jaringan bermasalah]  
  - **When:** [Formulir diajukan]  
  - **Then:** [Tampilkan pesan error inline di bawah field input yang bermasalah, tombol submit pulih dari state loading]
- [ ] **AC 3 (Proteksi Konkurensi / State Lock):**  
  - **Given:** [Kondisi kuota penuh atau jendela waktu terlewati (misal >7 hari BR#18)]  
  - **When:** [Pengguna mencoba memodifikasi data]  
  - **Then:** [Aksi ditolak dengan aman di level Server Action, UI beralih ke mode read-only]

---

## 6. Tracer-Bullet Task Breakdown (Irisan Vertikal)
Pecah pengerjaan menjadi irisan vertikal kecil (maksimal 3-5 file per task) yang dapat diverifikasi secara mandiri:

- [ ] **Task 1 (Kontrak Data & Server Service):** Buat query/mutasi database dengan validasi Zod.
- [ ] **Task 2 (Server Action & Validasi Keamanan):** Handle error, permission check, dan return state.
- [ ] **Task 3 (Komponen UI & Integrasi):** Buat tampilan komponen, empty state, skeleton, dan hook ke action.
- [ ] **Task 4 (Verifikasi & Polishing):** Jalankan typecheck PowerShell dan audit kepatuhan UI/UX.

---

## 7. Out of Scope (YAGNI Boundaries)
Daftar hal-hal yang secara eksplisit **DILARANG / TIDAK DIKERJAKAN** pada iterasi ini demi mencegah *overengineering* (misal: fitur ekspor PDF kompleks, cron notification tambahan, atau konfigurasi generic yang belum memiliki pengguna nyata).
```
