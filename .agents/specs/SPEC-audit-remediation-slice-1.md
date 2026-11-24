# Spec: Audit Remediation — Slice 1: Security Hardening & N+1 Query Elimination

- **Status:** Draft / Ready for Execution
- **Author:** Antigravity (Google DeepMind)
- **Reference:** [`AUDIT_REPORT.md`](file:///home/un0t_l1ed/.gemini/antigravity-cli/brain/36adccf8-2d8e-4805-833f-50e65643d012/AUDIT_REPORT.md), [`CONSTRAINTS.md`](file:///mnt/d/projek_react/PJBL/siedu/CONSTRAINTS.md)

---

## 1. Objective & User Story

### Objective

Menutup celah keamanan otorisasi Server Action pada `bersihkanRetensiStatus` dan mengeliminasi pola query loop N+1 pada seluruh pengambilan data di portal orang tua (`children`, `payments`, dan `schedule-attendance`).

### User Story

- **Sebagai Administrator & Sistem Keamanan Siedu**, saya ingin aksi mutasi data sensitif seperti pengarsipan foto/status pembelajaran (`bersihkanRetensiStatus`) hanya dapat dipicu oleh sesi Administrator terautentikasi atau oleh pemanggil CRON terotorisasi (`CRON_SECRET`), sehingga integritas data terlindungi dari eksekusi liar.
- **Sebagai Orang Tua Wali Murid**, saya ingin halaman profil anak, tagihan pembayaran, dan jadwal presensi memuat data dengan cepat dan stabil tanpa menimbulkan latensi tinggi akibat query database berulang (_N+1 waterfall_).

---

## 2. Command Verifikasi

Verifikasi wajib lolos tanpa error sebelum kode di-_commit_:

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit; npm run lint" < /dev/null
```

---

## 3. Data Contracts & Changes

### 3.1 Security Hardening (`src/app/actions/teacher.ts`)

```typescript
export async function bersihkanRetensiStatus({
    referensiWaktuIso,
    cronSecret,
}: {
    referensiWaktuIso?: string;
    cronSecret?: string;
} = {}): Promise<{
    ok: boolean;
    error?: string;
    countArchived?: number;
    countPurged?: number;
}>;
```

- **Invariant:** Menolak eksekusi jika caller BUKAN admin (`user.role !== "admin"`) DAN BUKAN cron terotorisasi (`cronSecret !== process.env.CRON_SECRET`).

### 3.2 Database Query Batching (`children/page.tsx`)

- Mengganti `Promise.all(anakRows.map(async ...))` dengan query batching:
    ```typescript
    db.orm.public.Pendaftaran.where((p) => p.anakId.in(anakIds)).all();
    ```

### 3.3 Database Query Batching (`payments/page.tsx`)

- Mengganti `mapelIds.map(async ...)` dengan:
    ```typescript
    db.orm.public.MataPelajaran.where((m) => m.id.in(mapelIds)).all();
    ```
- Mengganti `milikSaya.map(p => Pembayaran.where({ pendaftaranId }))` dengan:
    ```typescript
    db.orm.public.Pembayaran.where((b) =>
        b.pendaftaranId.in(pendaftaranIds),
    ).all();
    ```

### 3.4 Database Query Batching (`schedule-attendance/page.tsx`)

- Mengganti N+1 loop pada mapel, guru, jadwal, dan presensi dengan single batch query `.in(...)`.

---

## 4. Acceptance Criteria (Given-When-Then)

1. **Security Guarding pada `bersihkanRetensiStatus`:**
    - **Given** Pemanggil aksi tidak memiliki sesi login dan tidak menyertakan `cronSecret` yang valid,
    - **When** Fungsi `bersihkanRetensiStatus()` dipanggil,
    - **Then** Fungsi mengembalikan `{ ok: false, error: "Akses ditolak: Hanya admin atau cron yang berwenang" }` tanpa memodifikasi database.
    - **Given** Pemanggil memiliki sesi dengan role `admin` ATAU menyertakan `cronSecret === process.env.CRON_SECRET`,
    - **When** Fungsi `bersihkanRetensiStatus()` dipanggil,
    - **Then** Fungsi mengeksekusi retensi dan mengembalikan `{ ok: true, countArchived, countPurged }`.

2. **Query Batching pada Portal Orang Tua:**
    - **Given** Akun orang tua memiliki beberapa anak dan beberapa kelas aktif,
    - **When** Mengakses halaman `/children`, `/payments`, atau `/schedule-attendance`,
    - **Then** Server hanya mengeksekusi query batch dengan klausa `.in(...)` tanpa adanya loop `map(async ...)` ke database.
    - **Then** Data anak, tagihan, jadwal, dan riwayat presensi yang ditampilkan tetap 100% identik dengan implementasi sebelumnya.

---

## 5. Out-of-Scope (Dialokasikan ke Slice 2 & Slice 3)

- Redesain kartu KPI di dashboard admin (_Slice 2_).
- Reposisi status badge di samping heading pada `home/page.tsx` (_Slice 2_).
- Refaktor string counter dinamis di `teacher.json` dan `public.json` (_Slice 2_).
- Migrasi tag `<img>` native ke `<Image />` dan penggantian elipsis `...` (_Slice 3_).
