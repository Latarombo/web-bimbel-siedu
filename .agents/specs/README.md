# Spec-Driven Development (SDD) Specs Archive

Direktori ini digunakan untuk menyimpan seluruh dokumen spesifikasi teknis (*feature specs*) yang dihasilkan dari workflow Spec-Driven Development sebelum kode diimplementasikan.

---

## Standar Penamaan File
- Format: `SPEC-<feature-id>.md`
- Contoh: `SPEC-presensi-siswa.md`, `SPEC-input-nilai-rapor.md`

---

## Template Struktur Spec

Setiap file spesifikasi di direktori ini wajib memuat komponen berikut:

```markdown
# Spec: [Nama Fitur]

## 1. Objective & User Story
- **Masalah:** Apa masalah nyata yang diselesaikan?
- **Pengguna:** Siapa yang menggunakan fitur ini (Admin / Guru / Siswa)?
- **Outcome:** Apa hasil akhir yang diharapkan?

## 2. Command Verifikasi
- Typecheck: powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
- Build: powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npm run build" < /dev/null

## 3. Data Contracts & Interfaces
- Skema Prisma / tipe TypeScript / Zod Schema yang terlibat.
- Parameter input dan response Server Action / API.

## 4. Acceptance Criteria (Given - When - Then)
- [ ] AC 1: Kondisi awal, aksi, hasil yang diharapkan.
- [ ] AC 2: Validasi edge case & penanganan error.

## 5. Out of Scope (Batasan)
- Hal-hal yang secara eksplisit TIDAK dikerjakan pada rilis fitur ini (YAGNI).
```
