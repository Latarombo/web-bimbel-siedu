#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/3469d0712c58d96e339567963a2be40eea61c17aa264e9da36d0417ed6838ef4/contract';
import endContract from '../../snapshots/3469d0712c58d96e339567963a2be40eea61c17aa264e9da36d0417ed6838ef4/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/62c70b569a6fc3ef54da90968758496e532cf04fa77ebec2d858866d87149531/contract';
import startContract from '../../snapshots/62c70b569a6fc3ef54da90968758496e532cf04fa77ebec2d858866d87149531/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, lit } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'anak', column: 'persetujuan_foto' }),
      this.dropTable({ schema: 'public', table: 'catatan_pertemuan' }),
      this.dropTable({ schema: 'public', table: 'laporan_foto_status' }),
      this.dropTable({ schema: 'public', table: 'laporan_perkembangan' }),
      this.dropTable({ schema: 'public', table: 'nilai_progres' }),
      this.dropTable({ schema: 'public', table: 'password_reset_tokens' }),
      this.dropTable({ schema: 'public', table: 'pengajuan_pembatalan' }),
      this.dropTable({ schema: 'public', table: 'peserta_sesi' }),
      this.dropColumn({ schema: 'public', table: 'presensi', column: 'terlambat' }),
      this.dropTable({ schema: 'public', table: 'status_pembelajaran_penerima' }),
      this.addColumn({
        schema: 'public',
        table: 'pendaftaran',
        column: col('catatan_rapor', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'pendaftaran',
        column: col('rapor_diterbitkan_pada', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'penilaian',
        column: col('catatan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'penilaian',
        column: col('sesi_id', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'sesi_pertemuan',
        column: col('catatan_diterbitkan_pada', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'sesi_pertemuan',
        column: col('catatan_draf', 'bool', {
          notNull: true,
          default: lit(true),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'sesi_pertemuan',
        column: col('catatan_materi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'sesi_pertemuan',
        column: col('catatan_pr', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('reset_token_expires_at', 'timestamptz', {
          codecRef: { codecId: 'pg/timestamptz-string@1' },
        }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('reset_token_hash', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'anak',
        constraint: 'anak_email_notif_len_62e5eb95',
        expression: 'email_notifikasi IS NULL OR length(email_notifikasi) <= 255',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'anak',
        constraint: 'anak_nama_len_0ee8313e',
        expression: 'length(nama) <= 100',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'anak',
        constraint: 'anak_phone_len_a4b2d801',
        expression: 'nomor_telepon IS NULL OR length(nomor_telepon) <= 20',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'anak',
        constraint: 'anak_tingkat_len_a4c764b9',
        expression: 'tingkat IS NULL OR length(tingkat) <= 30',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'hasil_penilaian',
        constraint: 'hasil_catatan_len_b5e712d8',
        expression: 'catatan IS NULL OR length(catatan) <= 1000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_ruangan_len_1fcacb5c',
        expression: 'ruangan IS NULL OR length(ruangan) <= 50',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_tingkat_len_a4c764b9',
        expression: 'tingkat IS NULL OR length(tingkat) <= 30',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'mata_pelajaran',
        constraint: 'mapel_deskripsi_len_d8e96230',
        expression: 'deskripsi IS NULL OR length(deskripsi) <= 500',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'mata_pelajaran',
        constraint: 'mapel_nama_len_0ee8313e',
        expression: 'length(nama) <= 100',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pendaftaran',
        constraint: 'pendaftaran_catatan_rapor_len_9723b88f',
        expression: 'catatan_rapor IS NULL OR length(catatan_rapor) <= 2000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pengajuan_koreksi',
        constraint: 'koreksi_alasan_len_8757e4db',
        expression: 'length(alasan) <= 1000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pengajuan_koreksi',
        constraint: 'koreksi_catatan_admin_len_9365c655',
        expression: 'catatan_admin IS NULL OR length(catatan_admin) <= 1000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pengajuan_koreksi',
        constraint: 'koreksi_data_usulan_len_ed0dcb7f',
        expression: 'length(data_usulan) <= 1000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'penilaian',
        constraint: 'penilaian_catatan_len_b5e712d8',
        expression: 'catatan IS NULL OR length(catatan) <= 1000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'penilaian',
        constraint: 'penilaian_nama_len_0ee8313e',
        expression: 'length(nama) <= 100',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'periode_pendaftaran',
        constraint: 'periode_nama_len_0ee8313e',
        expression: 'length(nama) <= 100',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pesan_kontak',
        constraint: 'pesan_kontak_email_len_39c7c506',
        expression: 'length(email) <= 255',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pesan_kontak',
        constraint: 'pesan_kontak_nama_len_0ee8313e',
        expression: 'length(nama) <= 100',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pesan_kontak',
        constraint: 'pesan_kontak_pesan_len_1792af89',
        expression: 'length(pesan) <= 2000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pesan_kontak',
        constraint: 'pesan_kontak_sekolah_len_b7fbae64',
        expression: 'sekolah IS NULL OR length(sekolah) <= 150',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pesan_kontak',
        constraint: 'pesan_kontak_telepon_len_800d816a',
        expression: 'length(telepon) <= 20',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'presensi',
        constraint: 'presensi_catatan_len_e2069307',
        expression: 'catatan IS NULL OR length(catatan) <= 255',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'sesi_pertemuan',
        constraint: 'sesi_materi_len_5b9aa432',
        expression: 'catatan_materi IS NULL OR length(catatan_materi) <= 2000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'sesi_pertemuan',
        constraint: 'sesi_pr_len_1ba5d569',
        expression: 'catatan_pr IS NULL OR length(catatan_pr) <= 1000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'status_pembelajaran',
        constraint: 'status_konten_len_a07c9d6d',
        expression: 'length(konten_teks) <= 1000',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'user_alamat_len_4f61cabf',
        expression: 'alamat IS NULL OR length(alamat) <= 500',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'user_email_len_39c7c506',
        expression: 'length(email) <= 255',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'user_name_len_f9c2ce5f',
        expression: 'length(name) <= 100',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'users',
        constraint: 'user_phone_len_c479dc80',
        expression: 'length(nomor_telepon) <= 20',
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_reset_token_hash_key',
        columns: ['reset_token_hash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'penilaian',
        index: 'penilaian_sesi_id_idx_9e4d5c99',
        columns: ['sesi_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'penilaian',
        foreignKey: {
          name: 'penilaian_sesi_id_fkey',
          columns: ['sesi_id'],
          references: { schema: 'public', table: 'sesi_pertemuan', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
