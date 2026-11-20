# Spec: Decommission Deteksi Anak Duplikat Admin (BR#16)

> **Status**: Landed  
> **Tipe**: Penghapusan Fitur / Decommissioning & Penyederhanaan Domain  
> **Modul Terkait**: `admin-governance`, `parent-children`  
> **Aturan Bisnis Terkait**: BR#16 (Dihapus)

---

## 1. Objective & Rationale

### Objective
Menghapus seluruh sub-sistem deteksi dan peninjauan profil anak duplikat lintas akun (**BR#16**) beserta rute halaman `/admin/duplicate-children`, serta menambahkan guard pencegahan duplikat tidak sengaja di dalam satu akun orang tua yang sama (*intra-account duplicate guard*).

### Rationale & Keputusan Domain
1. **Pemisahan Akun & Privasi:** Setiap akun orang tua adalah entitas mandiri. Dua akun berbeda yang kebetulan memiliki anak dengan nama dan tanggal lahir yang sama adalah dua keluarga yang berbeda dan sah, bukan duplikat.
2. **Eliminasi False Positive & Overhead:** Menandai nama dan tanggal lahir yang sama antar-akun menimbulkan alarm palsu (*false alarm*) dan beban verifikasi manual yang tidak perlu bagi Admin (*YAGNI*).
3. **Pencegahan Duplikat Sejati (Intra-Account):** Proteksi duplikasi yang sebenarnya dibutuhkan adalah mencegah satu orang tua menambahkan anak yang sama berulang kali di akunnya sendiri karena dobel klik atau ketidaksengajaan.

---

## 2. Command Verifikasi

```bash
# 1. Bersihkan cache Next.js setelah menghapus rute halaman
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run clean" < /dev/null

# 2. Verifikasi tipe TypeScript tanpa error
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. Scope of Deletion & Changes

### A. File yang Dihapus
- `src/app/[locale]/admin/duplicate-children/page.tsx`

### B. Komponen & Kode yang Dibersihkan
- `src/app/[locale]/admin/layout.tsx`: Hapus item navigasi sidebar `/admin/duplicate-children`.
- `src/prisma/contract.prisma`: Hapus referensi komentar BR#16 pada model `Anak`.
- `src/app/actions/child-info.ts`: Tambahkan guard intra-akun pada `saveChildInfo` agar satu orang tua tidak dapat mendaftarkan anak dengan nama & tanggal lahir yang sama dua kali.

### C. Dokumentasi yang Diperbarui
- `ATURAN_SISTEM.md`: Hapus BR#16 dari katalog aturan bisnis.
- `ROADMAP_SIEDU.md`: Hapus BR#16 dari NOW dan catat di OUT OF SCOPE.
- `DAFTAR_HALAMAN.md`: Hapus rute `/admin/duplicate-children`.
- `PRD.md`: Hapus rujukan BR#16.
- `CAPABILITY_MAP.md`: Bersihkan rujukan BR#16 pada modul `admin-governance`.

---

## 4. Acceptance Criteria (Given-When-Then)

### AC-1: Rute Halaman Dihapus Bersih
- **Given** pengguna/admin mencoba mengakses `/admin/duplicate-children`,
- **When** rute dipanggil,
- **Then** server mengembalikan 404 Not Found dan tidak ada link navigasi di sidebar admin.

### AC-2: Guard Duplikat Intra-Akun
- **Given** orang tua A sudah memiliki anak bernama "Jhon" dengan tanggal lahir "2015-05-10",
- **When** orang tua A mencoba menambahkan anak baru dengan nama "Jhon" dan tanggal lahir "2015-05-10" pada akun yang sama,
- **Then** sistem menolak dan menampilkan pesan validasi bahwa anak tersebut sudah terdaftar di profil orang tua.

### AC-3: Lintas Akun Bebas & Tidak Diblokir
- **Given** orang tua A memiliki anak bernama "Jhon" lahir "2015-05-10",
- **When** orang tua B (akun berbeda) menambahkan anak bernama "Jhon" lahir "2015-05-10",
- **Then** sistem mengizinkan pendaftaran anak orang tua B tanpa hambatan dan tanpa menghasilkan notifikasi duplikat ke Admin.
