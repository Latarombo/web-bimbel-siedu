# SPEC: Penghapusan Persetujuan Izin Status Anak & Consent Foto

> **Status:** Approved (Dikonfirmasi oleh Pengguna pada 25 Nov 2026)  
> **Ruang Lingkup:** Pendaftaran Siswa Baru, Portal Guru (Status & WhatsApp Story), Portal Orang Tua (Profil & Edit Anak), serta Skema Database Prisma Next.

---

## 1. Objective & User Story

Menyederhanakan alur pendaftaran dan interaksi publikasi status pembelajaran siswa dengan menghapus konsep izin/consent foto murid dan persetujuan wali murid yang berlebihan. Sebelumnya, guru dibatasi dengan peringatan dan badge status izin foto saat mengunggah foto kegiatan, orang tua dibebani switch consent foto di profil anak, dan pendaftaran mengharuskan konfirmasi modal persetujuan data anak. Dengan penyederhanaan ini, seluruh foto dokumentasi pembelajaran dapat dipublikasikan tanpa gating izin consent, dan alur pendaftaran menjadi langsung (*frictionless*).

### User Stories
1. **Sebagai Orang Tua (Pendaftaran):** Saya dapat mendaftarkan akun dan memilih metode pembayaran kelas langsung tanpa harus melewati modal persetujuan izin data anak yang berulang.
2. **Sebagai Guru (Status & Story Pembelajaran):** Saya dapat membagikan status pembelajaran atau cerita foto dokumentasi kelas tanpa diblokir atau diperingatkan oleh status izin foto murid.
3. **Sebagai Orang Tua (Portal Anak):** Halaman profil dan edit anak saya bersih dari opsi izin foto yang tidak diperlukan.
4. **Sebagai Pengembang:** Skema database bersih dari kolom redundan `persetujuan_foto`, dan kode bebas dari logika consent yang tidak terpakai.

---

## 2. Command Verifikasi

```bash
# Verifikasi TypeScript bersih tanpa error
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null

# Verifikasi Prisma Contract Emit
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx prisma contract emit" < /dev/null
```

---

## 3. Data Contracts & Schema Changes

### A. Skema Prisma (`src/prisma/contract.prisma`)
- Hapus kolom `persetujuanFoto` dari model `Anak`:
  ```prisma
  // HAPUS BARIS INI:
  // persetujuanFoto Boolean @default(false) @map("persetujuan_foto")
  ```
- Generate migration dan emit contract untuk menyinkronkan `contract.json` dan `contract.d.ts`.

### B. Kontrak Tipe TypeScript
- Hapus properti `persetujuanFoto` dari:
  - `src/components/parent/children/types.ts` (`ChildSummaryItem`)
  - `src/components/teacher/status-form.tsx` (`StudentRecipient`)
  - `src/components/teacher/classes/class-detail-view.tsx`
  - `src/components/parent/child-edit-form.tsx` (`ChildEditData`)

---

## 4. Vertical Slices & Task Breakdown

### Slice 1: Database & Prisma Contract
- Hapus `persetujuanFoto` dari model `Anak` di `src/prisma/contract.prisma`.
- Jalankan `npx prisma contract emit` via PowerShell Windows.
- Update/remove referensi ORM `persetujuanFoto` di server actions.

### Slice 2: Pendaftaran (Registration & Checkout Flow)
- **`src/components/pendaftaran/daftar-form.tsx`**:
  - Hapus state modal `isPersetujuanOpen` dan pemanggilan `<PersetujuanModal>`.
  - Tombol "Pilih Metode Bayar" langsung memicu `handleConfirmPersetujuan` / `formAction`.
- **`src/components/pendaftaran/account-info-form.tsx` & `src/app/actions/account-info.ts`**:
  - Hapus input checkbox `consent_wali` dan validasi wajibnya.
  - Otomatis tandai `waliDisetujuiAt: now` saat `consent_privasi` disetujui (atau hapus gating perwalian).

### Slice 3: Portal Guru (Status Pembelajaran & WhatsApp Story)
- **`src/components/teacher/status-form.tsx`**:
  - Hapus pengecekan `hasRecipientWithoutPhotoConsent`.
  - Hapus badge "Izin Foto Aktif" / "Belum Izin Foto" pada daftar checklist murid.
  - Hapus kotak peringatan kuning `t('noConsentWarning')`.
- **`src/components/teacher/whatsapp-story-creator-modal.tsx`**:
  - Hapus state `hasNoConsentStudents` dan alert "Sebagian murid belum menyetujui izin foto".
- **`src/app/actions/teacher.ts`**:
  - Hapus action `updatePersetujuanFoto` dan audit log `anak_persetujuan_foto`.
  - Hapus seleksi field `persetujuanFoto` pada query murid kelas / status.

### Slice 4: Portal Orang Tua (Manajemen Data Anak)
- **`src/components/parent/children/child-quick-view-modal.tsx`**:
  - Hapus kotak panel "Izin Dokumentasi Foto" (`t('modalPhotoConsent')`).
- **`src/components/parent/children/child-bento-card.tsx`**:
  - Hapus indikator izin foto murid.
- **`src/components/parent/child-edit-form.tsx`**:
  - Hapus seksi switch toggle "Persetujuan Publikasi Foto Dokumentasi Kegiatan".
- **`src/app/actions/child-info.ts`**:
  - Hapus parsing `persetujuan_foto` dan pencatatan audit log `anak_persetujuan_foto`.

---

## 5. Acceptance Criteria (Given-When-Then)

### AC-1: Pembagian Status & WhatsApp Story Tanpa Gating Izin Foto
- **Given** guru membuka halaman `/teacher/status` atau modal WhatsApp Story Creator.
- **When** guru memilih kelas yang memiliki murid.
- **Then** tidak ada badge peringatan "Belum Izin Foto" di daftar murid.
- **And** tidak ada alert "Sebagian murid belum menyetujui izin foto".
- **And** guru dapat langsung mempublikasikan status dan foto kegiatan dengan lancar.

### AC-2: Checkout Pendaftaran Langsung Tanpa Modal Izin Tambahan
- **Given** wali murid berada di halaman pendaftaran kelas `/classes/[id]/register`.
- **When** wali murid memilih anak dan mengklik "Pilih Metode Bayar".
- **Then** sistem langsung memproses pendaftaran dan mengarahkan ke halaman pembayaran tanpa menampilkan dialog popover persetujuan pembelian/izin data anak.

### AC-3: Portal Orang Tua Bersih dari Opsi Izin Foto
- **Given** orang tua membuka halaman `/children` atau mengedit profil anak di `/children/[id]/edit`.
- **When** orang tua melihat detail atau form informasi anak.
- **Then** tidak ada card, toggle, atau status "Izin Dokumentasi Foto".

### AC-4: Integritas Tipe & Skema
- **Given** semua perubahan diterapkan.
- **When** perintah `npx tsc --noEmit` dijalankan.
- **Then** exit code 0 tanpa error TypeScript.

---

## 6. Out-of-Scope
- Mengubah status absensi harian kelas (`hadir`, `izin`, `sakit`, `alpa`). Status absensi presensi tetap dipertahankan.
- Mengubah alur Kebijakan Privasi dasar (`consent_privasi` pendaftaran akun orang tua).
