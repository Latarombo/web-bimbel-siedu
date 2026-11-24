# SPEC: CRUD Tugas / Asesmen Guru & Relasi ke Sesi Pertemuan Kelas

> **Modul ID:** `teacher-assignment-crud-session-link`
> **Aktor:** Guru & Orang Tua / Siswa
> **Status:** Selesai (Completed & Verified)
> **Rujukan Aturan:** [AGENTS.md](../../AGENTS.md) SDD Siklus Kerja, [CONSTRAINTS.md](../../CONSTRAINTS.md)

---

## 1. Objective & User Story

- **Konteks:** Guru saat ini dapat membuat tugas (`Penilaian`) dan menginput nilai siswa (`HasilPenilaian`), namun sebelumnya guru **belum memiliki fitur untuk menghapus (Delete)** tugas yang telah dibuat. Selain itu, tugas belum memiliki relasi struktural langsung ke **sesi pertemuan riil (`SesiPertemuan`)** dari kelas tersebut.
- **Tujuan:**
    1. **CRUD Lengkap Tugas oleh Guru:** Memberikan akses penuh bagi guru untuk **Membuat (Create)**, **Melihat (Read)**, **Mengubah (Update)**, dan **Menghapus (Delete)** tugas yang telah dibuatnya dengan konfirmasi aman (cascade delete ke `hasil_penilaian`).
    2. **Relasi Tugas ke Sesi Pertemuan:** Menambahkan relasi opsional `sesi_id` (`sesiPertemuanId`) pada entitas `penilaian` ke `sesi_pertemuan`. Guru dapat mengaitkan tugas dengan sesi pertemuan tertentu di kelas.
    3. **Visualisasi Terpadu:** Menampilkan tugas terkait langsung pada halaman absensi sesi pertemuan guru (`attendance`) dan portal orang tua (`schedule-attendance`).
- **User Story:**
    - _Sebagai Guru_, saya ingin dapat menghapus tugas yang salah dibuat atau tidak lagi relevan, dan mengaitkan tugas ke pertemuan kelas tertentu agar kurikulum tertata rapi.
    - _Sebagai Orang Tua / Siswa_, saya ingin melihat tugas apa saja yang diberikan guru pada pertemuan sesi tertentu dan status pengerjaan/nilainya.

---

## 2. Command Verifikasi (Wajib Lolos)

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

_Status: Lolos 100% tanpa error._

---

## 3. Data Contracts & Perubahan Skema

### A. Database PostgreSQL (Supabase)

```sql
ALTER TABLE "public"."penilaian"
ADD COLUMN IF NOT EXISTS "sesi_id" integer REFERENCES "public"."sesi_pertemuan"("id") ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS "idx_penilaian_sesi_id" ON "public"."penilaian"("sesi_id");
```

_Catatan: Jumlah tabel publik tetap 16 tabel (tidak ada tabel baru)._

### B. Prisma Next Contract (`contract.prisma`)

- Pada `model Penilaian`:
    ```prisma
    sesiPertemuanId Int?           @map("sesi_id")
    sesi            SesiPertemuan? @relation(fields: [sesiPertemuanId], references: [id], onDelete: SetNull)
    ```
- Pada `model SesiPertemuan`:
    ```prisma
    penilaian Penilaian[]
    ```

---

## 4. Server Actions & Business Logic

- **`hapusPenilaian(penilaianId: number)`:**
    - Guard auth guru (`dibuatOleh === user.id` atau admin).
    - Eksekusi delete `Penilaian` (cascade ke `HasilPenilaian`).
    - Rekam jejak audit di `AuditPerubahan` (`entitas: 'penilaian'`, `aksi: 'HAPUS_PENILAIAN'`).
    - Revalidate paths (`/teacher/classes/[classId]`, `/teacher/grades`, `/schedule-attendance`).
- **Update `savePenilaianBatch`:**
    - Menerima `sesi_id` (opsional) dari formData dan menyimpannya ke `Penilaian.sesiPertemuanId`.

---

## 5. Acceptance Criteria (Given — When — Then)

- **AC 1 (Hapus Tugas oleh Guru):**
    - Given guru membuka tugas yang telah dibuatnya di `/teacher/grades/assessment/[id]` atau tab "Tugas & Asesmen" di `/teacher/classes/[classId]`.
    - When guru mengklik "Hapus Tugas" dan mengonfirmasi dialog.
    - Then tugas dan skor siswa terkait terhapus bersih, dan halaman di-refresh tanpa error.
- **AC 2 (Koneksi Tugas ke Pertemuan):**
    - Given guru membuat atau mengedit tugas.
    - When guru memilih sesi pertemuan kelas terkait (atau membuat langsung dari halaman pertemuan).
    - Then tugas tersimpan dengan `sesi_id` yang sesuai dan tampil di daftar pertemuan.
- **AC 3 (Integritas Tipe Data):**
    - When `npx tsc --noEmit` dijalankan.
    - Then lulus 100% dengan **0 error**.

---

## 6. Tracer-Bullet Task Breakdown

- [x] **Slice 1: Database Migration & Prisma Contract**
    - Eksekusi `ALTER TABLE penilaian ADD COLUMN sesi_id ...` di Supabase.
    - Tambahkan relasi `sesiPertemuanId` di `contract.prisma`.
    - Emit Prisma contract (`npx prisma contract emit`).
- [x] **Slice 2: Server Actions Guru**
    - Buat action `hapusPenilaian` di `src/app/actions/teacher.ts`.
    - Dukung parameter `sesi_id` di `savePenilaianBatch`.
- [x] **Slice 3: Antarmuka Form Penilaian & Hapus Modal**
    - Tambahkan opsi pemilihan sesi pertemuan dan tombol Hapus Tugas di `src/components/teacher/penilaian-form.tsx`.
    - Tambahkan tombol Hapus Tugas di tabel tugas `ClassDetailView`.
    - Dukung pemilihan sesi di `QuickAssessmentModal`.
- [x] **Slice 4: Integrasi Halaman Sesi Pertemuan & Portal Orang Tua**
    - Tampilkan tugas terkait di halaman absensi sesi guru (`TeacherAttendanceManager`).
    - Tampilkan tugas terkait di rincian sesi portal orang tua (`schedule-attendance`).
- [x] **Slice 5: Verifikasi & Audit**
    - Jalankan `npx tsc --noEmit` via PowerShell Windows (Exit Code 0).
