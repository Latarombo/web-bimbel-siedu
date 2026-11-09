# Roadmap & Progress — Siedu v2.0

**Last Updated:** 26 Agustus 2026

> **⚠️ STACK MIGRATION 26 Aug 2026:** Proyek pindah dari Laravel+Blade+MySQL ke **Next.js full-stack + Prisma + PostgreSQL (Supabase) + Vercel Hobby**. Lihat `ATURAN_SISTEM.md` bagian "Keputusan Teknis: Migrasi Stack" untuk detail lengkap. Progress Phase 1 di bawah ini yang berbasis Laravel **DIARSIPKAN sebagai referensi logika bisnis**, bukan dianggap "selesai" di stack baru — kode Laravel-nya tidak dipakai lagi, tapi keputusan bisnis (Business Rules) di baliknya tetap berlaku dan jadi acuan saat menulis ulang di Next.js.

> **Cara pakai:** berikan bersamaan dengan `ATURAN_SISTEM.md` dan `src/prisma/contract.prisma` di tiap sesi AI coding. (`TECHNICAL_SPECS.md` yang dulu direferensikan ternyata tidak pernah ada di repo — sumber kebenaran skema = contract Prisma.) File ini **living document** — update setelah tiap fitur selesai (pindahkan item dari bagian yang belum selesai ke "✅ Sudah Selesai").
>
> **Urutan pengerjaan mengikuti nomor di bawah** — kalau ada dependency, jangan dikerjakan out of order. **Prioritas:** 🔴 Blocker (harus duluan) > 🟡 High (penting untuk fitur lain) > 🟢 Medium (bisa paralel) > 🔵 Low (opsional/nice to have).

---

## 🔴 Prioritas #0 — Setup Ulang Stack (WAJIB SEBELUM SEMUA ITEM LAIN)

| # | Item | Deskripsi | Priority | Estimate |
|---|---|---|---|---|
| 0a | Setup Project Next.js | `create-next-app` (App Router, TypeScript), setup Prisma, koneksi ke database Supabase (PostgreSQL) | 🔴 BLOCKER | 1-2 jam |
| 0b | Prisma Schema — 11 tabel | ✅ **Selesai 5 Sep 2026** — `src/prisma/contract.prisma` (users, anak, mata_pelajaran, periode_pendaftaran, kelas, jadwal_item, pendaftaran, pembayaran, presensi, nilai_progres, pengajuan_pembatalan), applied ke Supabase, `db verify` OK | ✅ Selesai | — |
| 0c | Setup Auth.js | ✅ **Selesai 5 Sep 2026** — next-auth v5 (JWT, tanpa adapter Prisma), `src/lib/auth.ts` + `auth.config.ts` + `src/proxy.ts` (Next 16: middleware→proxy), guard role /admin & /teacher. E2E curl: login→session cookie→/home 200 | ✅ Selesai | — |
| 0d | Setup Vercel + Supabase | Supabase ✅. AUTH_SECRET & CRON_SECRET sudah di `.env` lokal (+ `.env.example`). Deploy Vercel + MIDTRANS keys masih perlu akun user | 🟡 Sebagian | — |

---

## 🗄️ Diarsipkan (Phase 1 Laravel — LOGIKA BISNIS TETAP JADI ACUAN, KODE TIDAK DIPAKAI)

| # | Item | Deskripsi | Status Laravel (arsip) |
|---|---|---|---|
| 1 | PRD & Dokumentasi | Overview, Problem Statement, use case, PRD v2.0 (perubahan aktor + BR baru) | ✅ Selesai (Laravel) — isi bisnis tetap dipakai, `PRD.md` sudah diupdate ke stack baru |
| 2 | Setup Project & Database | Laravel + MySQL, migration inti (9 tabel) | ✅ Selesai (Laravel) — **ditulis ulang di item 0b (Prisma)** |
| 3 | Model Eloquent | Semua Model dengan relasi, teruji di Tinker | ✅ Selesai (Laravel) — **ditulis ulang sebagai Prisma schema relations** |
| 4 | Autentikasi & Role | Breeze, registrasi publik role `orang_tua` + 2 consent, `AdminSeeder`, middleware, dashboard per role | ✅ Selesai (Laravel) — **ditulis ulang di item 0c (Auth.js)** |
| 5 | CRUD Data Master (Admin) | Mata Pelajaran, Periode, Guru, Kelas (+ validasi bentrok jadwal guru, BR#6) | ✅ Selesai (Laravel) — perlu ditulis ulang jadi Next.js pages + Server Actions |
| 6 | Halaman Publik (Guest) | Landing page, Katalog Kelas, About Page | ✅ Selesai (Laravel) — perlu ditulis ulang, sudah ada desain Stitch untuk referensi |
| 7 | Perubahan Aktor Siswa → Orang Tua | Migration, Model `Anak`, `AnakController`, form register baru | ✅ Selesai (Laravel) — keputusan desain (Keputusan #1-5) tetap berlaku |
| 8 | Alur Pendaftaran (dasar) | Pilih anak + kelas + metode bayar, kuota terkunci (`lockForUpdate()`), validasi bentrok jadwal anak (BR#9) | ✅ Selesai (Laravel) — row-lock perlu ditulis ulang pakai Prisma transaction + raw `SELECT FOR UPDATE` |
| 9 | Pembersihan Teknis | Hapus Model duplikat, fix validasi tanggal lahir, setup Git + GitHub | ✅ Selesai (Laravel) — N/A di stack baru |
| 10 | Dokumentasi Teknis | DB schema detail ✅ (sumber: `src/prisma/contract.prisma` + BR#27-31 di `ATURAN_SISTEM.md`). `TECHNICAL_SPECS.md` tidak pernah ada di repo — arsisitektur/API routes/services/scheduled jobs belum didokumentasikan; tulis terpisah saat implementasi, jangan recreate file hantu | 🟡 Sebagian | — |

---

## 🔴 Prioritas Berikutnya — Blocker (WAJIB Selesai Dulu)

**Catatan:** Item 10-14 saling bergantung. Item 10 adalah prerequisite untuk item 11-14. Selesaikan dalam urutan ini.

| # | Item | Deskripsi | Priority | Estimate | Blocker |
|---|---|---|---|---|---|
| 10 | **Wiring Status Pendaftaran** | ✅ **Selesai 5 Sep 2026** — `src/lib/services/pendaftaran.ts` (`processTimeouts`, `memenuhiSyaratTerdaftar`) + route `/api/cron/check-timeout` (Bearer CRON_SECRET, teruji 401/200). Sisa: daftarkan URL ke cron-job.org/GitHub Actions tiap 5 menit (butuh deploy/URL publik) | 🟡 Sebagian | — | Perlu deploy 0d |
| 11 | **BR#14: Buat Pembayaran Record saat Pendaftaran** | ✅ **Selesai 5 Sep 2026** — `createPendaftaran()` di `src/lib/services/pendaftaran.ts` bikin 1 baris pembayaran (dp/lunas) atomik + SELECT FOR UPDATE kelas. Self-check 14/14 PASS (`scripts/selfcheck-pendaftaran.ts`) | ✅ Selesai | — |
| 12 | **BR#11: Scheduled Job Pelepasan Kuota** | ✅ **Selesai 5 Sep 2026** — digabung di `processTimeouts()` (satu transaction: ubah status + `greatest(kuota_terisi-1,0)`). Teruji di self-check | ✅ Selesai | — |
| 13 | **BR#12: Validasi Metode Bayar vs biaya_dp** | ✅ **Selesai 5 Sep 2026** — guard di `createPendaftaran()` (BR#12 + BR#28 tenor ≤ tenor_maksimum). Teruji self-check | ✅ Selesai | — |
| 14 | **BR#13: Filter Kelas sesuai Jenjang Anak** | ✅ **Selesai 5 Sep 2026 (service)** — `kelasTersediaUntukJenjang()` + guard jenjang null di `createPendaftaran()`. Sisa: halaman UI pilih kelas (form daftar) belum dibuat | 🟡 Sebagian | — | UI |

---

## 🟡 Prioritas High (Setelah Blocker Selesai)

| # | Item | Deskripsi | Priority | Estimate | Depends On | Design Decisions Needed |
|---|---|---|---|---|---|---|
| 15 | **Halaman Detail Pendaftaran** | Tampilkan detail enrollment dengan tombol aksi kondisional per status: menunggu_pembayaran → "Bayar", terdaftar → "Batalkan", tertunggak → countdown + tombol bayar, dibatalkan_* → no buttons. Hanya 1 tagihan aktif/jatuh tempo ditampilkan (cicilan belum jatuh tempo hidden). Tab terpisah untuk Presensi & Nilai. **Keputusan UX sudah final (PRD.md Bagian 6).** | 🟡 HIGH | 4-5 jam | 10, 14 | None (keputusan final) |
| 16 | **Integrasi Midtrans Webhook** | Buat Route Handler `/api/webhooks/midtrans/route.ts` untuk handle callback payment gateway (pakai Midtrans Node.js SDK). Validasi signature (SHA512), lock payment record via Prisma transaction, update status. Konfigurasi Snap channel exclude cicilan kartu/BNPL (BR#23, sudah final). **Sebelum mulai:** jawab pertanyaan terbuka: (a) status display saat browser ditutup mid-payment, (b) konvensi `.env` ServerKey (`MIDTRANS_SERVER_KEY_SANDBOX`/`MIDTRANS_SERVER_KEY_PROD`), (c) pemetaan `transaction_status` → pendaftaran status (**kandidat BR#26** — bukan BR#23, nomor itu sudah dipakai untuk aturan kanal pembayaran). | 🟡 HIGH | 5-6 jam | 15 | 2 open questions + 1 BR baru perlu dirumuskan |
| 17 | **Halaman Riwayat & Status Pembayaran Orang Tua** | Tab/halaman terpisah: daftar pembayaran (status, amount, jatuh tempo, tanggal pembayaran). **Sebelum mulai:** tanya apakah orang tua bisa download bukti/invoice atau cukup lihat status. | 🟡 HIGH | 2-3 jam | 16 | 1 design decision (download capability) |
| 18 | **Presensi (Guru Input)** | Guru input kehadiran siswa per kelas. Edit allowed 7 hari sejak input (BR#18). Setelah 7 hari, locked — ajukan koreksi ke Admin. **Implementasi:** Model `Presensi`, `PresensiController`, form input, 7-day validation | 🟡 HIGH | 4-5 jam | 10 | None |
| 19 | **Nilai/Progres Belajar (Guru Input)** | Guru input nilai (kuantitatif SMP/SMA) atau progres (kualitatif TK/SD) per anak. Aturan edit sama seperti presensi (BR#18). **Implementasi:** Model `NilaiProgres`, `NilaiProgresController`, form, jenjang-based formatting | 🟡 HIGH | 4-5 jam | 10 | None |
| 20 | **Pengajuan Pembatalan/Refund Orang Tua** | Orang Tua submit cancellation request dari detail enrollment. Admin review & approve/reject sesuai BR#19 (DP hangus untuk voluntary, full refund 4 kasus). **Implementasi:** Model `PengajuanPembatalan`, form, admin queue, refund trigger | 🟡 HIGH | 5-6 jam | 15, 17 | None (BR#19 sudah final) |

---

## 🟢 Prioritas Medium (Fitur Tambahannya Admin/Advanced)

| # | Item | Deskripsi | Priority | Estimate | Depends On | Design Decisions Needed |
|---|---|---|---|---|---|---|
| 21 | **Verifikasi Refund Admin (Kasus Khusus)** | Admin review pengajuan refund kasus khusus (sistem error, salah transfer, dsb). Approve → trigger refund via Midtrans. **Sebelum mulai:** design alur: apakah auto-refund via API atau manual transfer + manual record? | 🟢 MEDIUM | 3-4 jam | 20 | Refund mechanism (auto vs manual) |
| 22 | **Laporan Pendaftaran & Keuangan Admin (F13)** | Dashboard reports: enrollment trend, payment summary, delinquency status. Export CSV/PDF. **Sebelum mulai:** tanya format report (periode filter, breakdown by status, export format) | 🟢 MEDIUM | 4-5 jam | 17 | Report format & filters |
| 23 | **BR#15: Rename Status dibatalkan_siswa → dibatalkan_orang_tua** | Migration kosmetik: rename enum value. Update all references. | 🔵 LOW | 30 min | — | None |
| 24 | **BR#16: Deteksi Anak Duplikat** | Admin dashboard: flag anak dengan exact name match (normalized) + same DOB across accounts. Manual review only (not auto-blocked). **Implementasi:** Service + admin view dengan action "review duplikasi" | 🟢 MEDIUM | 2-3 jam | — | None |
| 25 | **Ambiguitas #5: Kunci Profil Anak Read-Only** | Jika anak punya ≥1 active enrollment, field nama & jenjang read-only. Tampilkan label "Dikunci (sudah ada pendaftaran aktif)". **Implementasi:** `AnakController::update()` check status, view conditional readonly | 🟢 MEDIUM | 1-2 jam | 10, 14 | None |
| 26 | **BR#26: Rumuskan Pemetaan Webhook Midtrans** *(dulu salah ditulis BR#23 — sudah dipakai untuk aturan kanal pembayaran, lihat item 27; nomor BR#26 sudah dicadangkan resmi di `ATURAN_SISTEM.md` Bagian 3 — jangan dipakai aturan lain)* | Tentukan mapping: Midtrans `transaction_status` (settlement/capture/deny/expire/cancel) → internal `pembayaran.status` & `pendaftaran.status`. Rumuskan sebagai Business Rule baru. **Implementasi:** dokumentasi + implementasi di webhook handler | 🔴 BLOCKER (untuk Midtrans) | 1-2 jam | — | Yes (pemetaan logic) |
| 27 | **Perbaikan Dokumentasi** | Update `ATURAN_SISTEM.md` Bagian 3 dengan BR#26 (webhook mapping) setelah dirumuskan. Update Bagian 4/2 (struktur data): tambahkan `presensi`, `nilai_progres`, `pengajuan_pembatalan`, dan field baru BR#25 (`alamat`, `email_notifikasi`, dst) kalau belum tercantum. Sinkronkan `PRD.md`/`ROADMAP_SIEDU.md` dengan `ATURAN_SISTEM.md` (✅ PRD v2.2 5 Sep 2026; `TECHNICAL_SPECS.md`/`SKEMA_DATABASE.md`/`BRIEFING_UNTUK_AI.md` tidak ada di repo) — **catatan: ada 2 set nama file paralel untuk dokumen yang sama fungsinya, lihat catatan di bawah tabel.** | 🔵 LOW | 1 jam | 26 | None |

---

## 🔲 Belum Dikerjakan (Future / Out of Scope v1)

| # | Item | Alasan | Priority |
|---|---|---|---|
| 28 | Multi-Tenant Architecture | Untuk v2 (saat ini single-lembaga per instalasi) | Future |
| 29 | Mobile App (Native iOS/Android) | Web responsive sufficient untuk v1 | Future |
| 30 | LMS Integration (Moodle, Google Classroom) | Integrasi third-party; standalone system saja v1 | Future |
| 31 | WhatsApp/SMS Notifications | Email-only untuk v1 (no WA gateway integration) | Future |
| 32 | Student Self-Login | Anak hanya profil data (per design perubahan aktor) | Out of Scope |
| 33 | Identity/KYC Verification | Tidak ada dokumen upload (follow Ruangguru model) | Out of Scope |
| 34 | Joint Custody Support | One account = one guardian (no switching) | Out of Scope |

---

## 🔴 Critical Path & Dependencies

```
Phase 1 (Foundation): Items 1-9 ✅ DONE
                      ↓
Phase 2 (Blocker): Items 10-14 🔴 MUST DO FIRST
                      ↓
                   Item 23 (Pemetaan Webhook) — Must define before Midtrans integration
                      ↓
Phase 3 (Core Features): Items 15-20 🟡 PARALLEL SAFE (after blockers)
                      ↓
Phase 4 (Admin Advanced): Items 21-22, 24-27 🟢 Can do parallel with Phase 3
```

**Timeline Estimate:**
- Blocker Phase (10-14 + 23): **3-4 hari** (if focused)
- Core Phase (15-20): **5-6 hari parallel**
- Admin Phase (21-22, 24-27): **4-5 hari parallel**
- **Total v1 MVP: ~10-12 hari** (aggressive) atau **~2-3 minggu** (realistic dengan testing & review)

---

## Catatan Update

*(Tambahkan baris baru di sini tiap kali menyelesaikan item — format: Tanggal | Item # | Deskripsi Singkat | Keputusan Baru? | Catatan)*

| Tanggal | Item | Deskripsi | Keputusan Baru | Catatan |
|---|---|---|---|---|
| 14 Aug 2026 | 1 + 10 | Dokumentasi: PRD.md + TECHNICAL_SPECS.md dibuat lengkap | Tidak | 13 features, acceptance criteria, DB schema detail, API routes |
| 26 Aug 2026 | — | BR#23 (kanal vs metode bayar, exclude cicilan pihak ketiga), BR#24 (cicilan manual, BR#20 tidak berlaku), BR#25 (field `alamat`/`nomor_telepon`/`email_notifikasi`) diputuskan & dicatat di `PRD.md` v2.1 dan `TECHNICAL_SPECS.md` | Ya (3 BR baru) | Ditemukan tabrakan nomor: item roadmap #16/#26 sebelumnya salah menulis "BR#23" untuk pemetaan webhook Midtrans — sudah diperbaiki jadi **BR#26** |
| — | — | — | — | — |
