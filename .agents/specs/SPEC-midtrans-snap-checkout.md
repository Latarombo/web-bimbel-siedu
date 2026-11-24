# SPEC: Midtrans Snap Sandbox Checkout — The Focused Cashier

> **Modul ID:** `payment-midtrans`
> **Aktor:** Orang Tua (Wali Murid)
> **Status:** Landed (Selesai & Terverifikasi)
> **Rujukan Aturan:** [`ATURAN_SISTEM.md`](../docs/ATURAN_SISTEM.md) BR#2, BR#14, BR#23, BR#24, BR#26, [`DESIGN.md`](../docs/DESIGN.md) Bagian 7F & 7I

---

## 1. Objective & User Story

- **Konteks & Masalah:** Saat ini tombol bayar di halaman detail pendaftaran langsung mengalihkan pengguna ke redirect URL eksternal Midtrans secara mendadak. Orang tua membutuhkan pengalaman kasir digital yang tenang, transparan, dan terfokus (_Focused Cashier_) untuk memeriksa rincian invoice tagihan (biaya kelas, potongan DP, status termin cicilan), melihat batas waktu pembayaran 1×24 jam (BR#2), dan menyelesaikan pembayaran via pop-up Midtrans Snap Sandbox tanpa meninggalkan website Siedu.
- **User Story:** Sebagai wali murid, saya ingin melihat rincian tagihan resmi di halaman `/enrollments/[id]/pay` dan membayar melalui pop-up modal Midtrans Snap Sandbox, sehingga transaksi berjalan lancar, aman, dan status pendaftaran anak langsung terkonfirmasi otomatis.
- **Outcome Kunci:**
    1. Halaman kasir berdedikasi `/enrollments/[id]/pay` dengan layout faktur resmi bergaya modern SaaS.
    2. Integrasi skrip `snap.js` Sandbox (`window.snap.pay`) dengan callback instan (`onSuccess`, `onPending`, `onError`, `onClose`).
    3. Indikator hitung mundur (_countdown timer_) batas waktu 1×24 jam (BR#2) berbasis font `tabular-nums`.
    4. Penonaktifan kanal cicilan pihak ketiga / BNPL sesuai aturan BR#23.
    5. Verifikasi TypeScript (`npx tsc --noEmit`) lolos 100% tanpa error.

---

## 2. Command Verifikasi (Wajib Lolos)

```bash
powershell.exe -NonInteractive -NoProfile -Command "Set-Location 'D:\projek_react\PJBL\siedu'; npx tsc --noEmit" < /dev/null
```

---

## 3. UI/UX Contract & Interaksi (Rujukan: DESIGN.md)

- **Tipe Kontainer:** Halaman Penuh (_Full Route_) di `/enrollments/[id]/pay` dengan kontainer terpusat `max-w-4xl mx-auto py-8 px-4 sm:px-6`.
- **Tata Letak (_Layout_):**
    - **Desktop (>1024px):** Grid 2 kolom seimbang. Kolom kiri memuat ringkasan siswa, kelas, jadwal, dan rincian komponen tagihan. Kolom kanan memuat kartu transaksi kasir, timer batas waktu, dan tombol aksi bayar.
    - **Mobile (<640px):** Susunan vertikal kolom tunggal yang ergonomis. Tombol aksi selebar penuh dengan touch target minimal 48px.
- **Tipografi & Angka:**
    - Heading "Kasir Pembayaran" menggunakan `font-display tracking-tight text-slate-900`. Bersih tanpa pill/badge di samping teks.
    - Seluruh nominal rupiah dan timer countdown wajib menggunakan kelas `tabular-nums font-semibold`.
- **Icon Restraint:** Bebas dari ikon pemanis dekoratif pada tombol teks. Ikon hanya untuk tombol panah navigasi "Kembali ke Rincian Kelas" (`aria-label`) dan status alert.
- **State Tombol Saat Memproses:** Tombol submit menampilkan label `"Menghubungkan ke Kasir..."` didampingi mikro-spinner inline (`size-4 animate-spin`) dengan `disabled:opacity-70`.
- **Fallback Non-Gateway:** Jika `MIDTRANS_SERVER_KEY` belum terpasang di `.env`, sediakan instruksi transfer rekening lembaga dan tombol konfirmasi simulasi (khusus mode dev offline).

---

## 4. Data Contracts & Interfaces

### A. Return State Server Action `mulaiPembayaran`

```typescript
export type PayState =
    | {
          ok: true;
          token: string;
          redirectUrl: string;
      }
    | {
          ok: false;
          error: string;
      };
```

### B. Props Komponen Kasir Client (`SnapCashier`)

```typescript
export interface SnapCashierProps {
    pendaftaranId: number;
    pembayaranId: number;
    nominal: number;
    tipe: 'dp' | 'cicilan' | 'lunas';
    cicilanKe: number | null;
    jatuhTempo: string | null;
    batasWaktuTimeoutIso: string;
    clientKey: string;
    snapEnv: 'sandbox' | 'production';
    namaAnak: string;
    namaKelas: string;
}
```

---

## 5. Acceptance Criteria (Given — When — Then)

### Happy Path

- [x] **AC 1 (Akses Halaman Kasir):**
    - **Given:** Wali murid memiliki tagihan aktif berstatus `pending` atau `gagal`.
    - **When:** Membuka `/enrollments/[id]/pay`.
    - **Then:** Sistem merender ringkasan faktur, batas waktu 24 jam, dan tombol primer "Lanjutkan Pembayaran via Midtrans".
- [x] **AC 2 (Pemicuan Pop-up Snap Sandbox):**
    - **Given:** Pengguna menekan tombol "Lanjutkan Pembayaran".
    - **When:** Server Action berhasil menerbitkan token transaksi Midtrans.
    - **Then:** Modal pop-up Midtrans Snap muncul melayang di layar dengan banner "TEST MODE / SANDBOX" dan pilihan metode bayar (BCA/BRI/Mandiri VA, QRIS, GoPay, Gerai Tunai).
- [x] **AC 3 (Penyelesaian Pembayaran Instan):**
    - **Given:** Pengguna menyelesaikan pembayaran di simulator Midtrans Snap.
    - **When:** Callback `onSuccess` terpanggil.
    - **Then:** Sistem mengarahkan otomatis ke `/enrollments/[id]/payment-result?order_id=...` dan tiket kelas/kuitansi tampil.

### Edge Cases & Failure Scenarios

- [x] **AC 4 (Sudah Lunas / Tidak Ada Tagihan):**
    - **Given:** Pendaftaran sudah lunas atau tidak memiliki tagihan terbuka.
    - **When:** Pengguna membuka `/enrollments/[id]/pay`.
    - **Then:** Sistem mengalihkan kembali ke `/enrollments/[id]` dengan aman tanpa menampilkan error.
- [x] **AC 5 (Penutupan Pop-up Tanpa Bayar):**
    - **Given:** Modal Snap ditutup oleh pengguna (`onClose`) sebelum transaksi diselesaikan.
    - **When:** Modal menghilang.
    - **Then:** Halaman kasir tetap aktif, menampilkan status bahwa tagihan masih menunggu, dan tombol pembayaran dapat ditekan kembali kapan saja.
- [x] **AC 6 (Kanal Cicilan Pihak Ketiga Diblokir):**
    - **Given:** Permintaan token dibuat ke API Midtrans Snap.
    - **When:** Parameter `enabled_payments` dikirim.
    - **Then:** Tidak ada opsi cicilan kartu kredit bank atau BNPL pihak ketiga (Akulaku, Kredivo) di daftar pembayaran (kepatuhan BR#23).

---

## 6. Tracer-Bullet Task Breakdown (Irisan Vertikal)

- [x] **Task 1 (Layanan & Action):** Perbarui `src/lib/midtrans.ts` (tambahkan `midtransClientKey()`) dan perbarui action `mulaiPembayaran` di `src/app/actions/pembayaran.ts` agar mengembalikan `{ token, redirectUrl }`.
- [x] **Task 2 (Komponen Client Kasir):** Buat komponen `src/components/parent/snap-cashier.tsx` yang memuat script `snap.js`, mengelola interaksi `window.snap.pay`, dan menyajikan countdown timer 24 jam.
- [x] **Task 3 (Halaman Kasir Terfokus):** Bangun halaman `src/app/[locale]/(parent)/enrollments/[id]/pay/page.tsx` dengan layout 2-kolom invoice formal, rincian biaya transparan, dan guard kepemilikan orang tua.
- [x] **Task 4 (Integrasi Tautan):** Pastikan tombol "Bayar Tagihan" pada kartu pendaftaran di `/enrollments/[id]` dan kartu pembayaran di `/payments` mengarah langsung ke `/enrollments/[id]/pay`.
- [x] **Task 5 (Verifikasi Kualitas):** Jalankan `npx tsc --noEmit` via PowerShell dan uji alur Snap Sandbox hingga halaman hasil pembayaran.

---

## 7. Out of Scope (YAGNI)

- Fitur auto-debit atau penyimpanan token kartu kredit (dilarang BR#24).
- Opsi pembayaran multi-invoice sekaligus dalam satu transaksi Snap (satu tagihan per transaksi).
