#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/73542dcea0fa4b01ae9c5168b7209eb26c36dd2020848e4842bf5a7c1ece57a0/contract';
import endContract from '../../snapshots/73542dcea0fa4b01ae9c5168b7209eb26c36dd2020848e4842bf5a7c1ece57a0/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<never, End> {
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createSchema({ schema: 'public' }),
      this.createTable({
        schema: 'public',
        table: 'anak',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deleted_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('email_notifikasi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenjang_terakhir', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nomor_telepon', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('orang_tua_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tanggal_lahir', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'anak_jenjang_terakhir_check_7895310b',
            "\"jenjang_terakhir\" IN ('TK', 'SD', 'SMP', 'SMA')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'kelas',
        columns: [
          col('biaya_dp', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('biaya_periode', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deleted_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('guru_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('hari', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jam_mulai', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('jam_selesai', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('kuota_maksimum', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('kuota_minimum', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('kuota_terisi', 'int4', {
            notNull: true,
            default: lit(0),
            codecRef: { codecId: 'pg/int4@1' },
          }),
          col('mata_pelajaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('periode_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('aktif'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'kelas_hari_check_666350e4',
            "\"hari\" IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')",
          ),
          checkExpression('kelas_status_check_744c4bc7', "\"status\" IN ('aktif', 'dibatalkan')"),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'mata_pelajaran',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deskripsi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenjang', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'mata_pelajaran_jenjang_check_2be2c303',
            "\"jenjang\" IN ('TK', 'SD', 'SMP', 'SMA')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'nilai_progres',
        columns: [
          col('catatan_kualitatif', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dicatat_oleh', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nilai_kuantitatif', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('pendaftaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('tanggal', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'pembayaran',
        columns: [
          col('cicilan_ke', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dibayar_pada', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jatuh_tempo', 'date', { codecRef: { codecId: 'pg/date-string@1' } }),
          col('jumlah', 'numeric', { notNull: true, codecRef: { codecId: 'pg/numeric@1' } }),
          col('pendaftaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('referensi_gateway', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('pending'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('tipe', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'pembayaran_status_check_0ac11c8a',
            "\"status\" IN ('pending', 'berhasil', 'gagal')",
          ),
          checkExpression(
            'pembayaran_tipe_check_5c17d7cc',
            "\"tipe\" IN ('dp', 'cicilan', 'lunas')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'pendaftaran',
        columns: [
          col('anak_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('deleted_at', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('diajukan_pada', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenjang_saat_daftar', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('kelas_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('metode_bayar', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('periode_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('menunggu_pembayaran'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'pendaftaran_jenjang_saat_daftar_check_b576a932',
            "\"jenjang_saat_daftar\" IN ('TK', 'SD', 'SMP', 'SMA')",
          ),
          checkExpression(
            'pendaftaran_metode_bayar_check_a290e8ad',
            "\"metode_bayar\" IN ('lunas', 'dp_cicilan')",
          ),
          checkExpression(
            'pendaftaran_status_check_dc26f40c',
            "\"status\" IN ('menunggu_pembayaran', 'terdaftar', 'tertunggak', 'dibatalkan_timeout', 'dibatalkan_tunggakan', 'dibatalkan_orang_tua', 'dibatalkan_pelanggaran', 'dibatalkan_kuota')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        columns: [
          col('alasan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('catatan_admin', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('diajukan_oleh', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('diproses_oleh', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('diproses_pada', 'timestamptz', { codecRef: { codecId: 'pg/timestamptz-string@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('kategori', 'text', {
            notNull: true,
            default: lit('lainnya'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('pendaftaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('menunggu'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'pengajuan_pembatalan_kategori_check_f1a0d17c',
            "\"kategori\" IN ('kesalahan_sistem', 'salah_nominal_transfer', 'salah_rekening', 'salah_pilih_kelas', 'lainnya')",
          ),
          checkExpression(
            'pengajuan_pembatalan_status_check_64629cf3',
            "\"status\" IN ('menunggu', 'disetujui', 'ditolak')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'periode_pendaftaran',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('dibuka'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('tanggal_mulai', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('tanggal_selesai', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('tanggal_tutup_pendaftaran', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'periode_pendaftaran_status_check_d92f18ce',
            "\"status\" IN ('dibuka', 'ditutup', 'selesai')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'presensi',
        columns: [
          col('catatan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dicatat_oleh', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pendaftaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('tanggal_pertemuan', 'date', {
            notNull: true,
            codecRef: { codecId: 'pg/date-string@1' },
          }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'presensi_status_check_a1129453',
            "\"status\" IN ('hadir', 'izin', 'sakit', 'alpa')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'users',
        columns: [
          col('alamat', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('email_verified_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('name', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nomor_telepon', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('password', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('privasi_disetujui_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('remember_token', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('role', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('wali_disetujui_at', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'users_role_check_5bd793df',
            "\"role\" IN ('admin', 'guru', 'orang_tua')",
          ),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'pembayaran',
        constraint: 'pembayaran_referensi_gateway_key',
        columns: ['referensi_gateway'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        constraint: 'pengajuan_pembatalan_pendaftaran_id_key',
        columns: ['pendaftaran_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'presensi',
        constraint: 'presensi_pendaftaran_id_tanggal_pertemuan_key',
        columns: ['pendaftaran_id', 'tanggal_pertemuan'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_email_key',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'anak',
        index: 'anak_orang_tua_id_idx_1bcc29b8',
        columns: ['orang_tua_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'kelas',
        index: 'kelas_guru_id_idx_502a0782',
        columns: ['guru_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'kelas',
        index: 'kelas_mata_pelajaran_id_idx_2f899638',
        columns: ['mata_pelajaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'kelas',
        index: 'kelas_periode_id_idx_37f33a53',
        columns: ['periode_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'nilai_progres',
        index: 'nilai_progres_dicatat_oleh_idx_c21fd364',
        columns: ['dicatat_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'nilai_progres',
        index: 'nilai_progres_pendaftaran_id_idx_0bda22e6',
        columns: ['pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_pendaftaran_id_idx_0bda22e6',
        columns: ['pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pendaftaran',
        index: 'pendaftaran_anak_id_idx_3569f103',
        columns: ['anak_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pendaftaran',
        index: 'pendaftaran_kelas_id_idx_933496b6',
        columns: ['kelas_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pendaftaran',
        index: 'pendaftaran_periode_id_idx_37f33a53',
        columns: ['periode_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        index: 'pengajuan_pembatalan_diajukan_oleh_idx_bdcdb39f',
        columns: ['diajukan_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        index: 'pengajuan_pembatalan_diproses_oleh_idx_c7a6c546',
        columns: ['diproses_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'presensi',
        index: 'presensi_dicatat_oleh_idx_c21fd364',
        columns: ['dicatat_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'presensi',
        index: 'presensi_pendaftaran_id_idx_0bda22e6',
        columns: ['pendaftaran_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'anak',
        foreignKey: {
          name: 'anak_orang_tua_id_fkey',
          columns: ['orang_tua_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'kelas',
        foreignKey: {
          name: 'kelas_mata_pelajaran_id_fkey',
          columns: ['mata_pelajaran_id'],
          references: { schema: 'public', table: 'mata_pelajaran', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'kelas',
        foreignKey: {
          name: 'kelas_guru_id_fkey',
          columns: ['guru_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'kelas',
        foreignKey: {
          name: 'kelas_periode_id_fkey',
          columns: ['periode_id'],
          references: { schema: 'public', table: 'periode_pendaftaran', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'nilai_progres',
        foreignKey: {
          name: 'nilai_progres_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'nilai_progres',
        foreignKey: {
          name: 'nilai_progres_dicatat_oleh_fkey',
          columns: ['dicatat_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pembayaran',
        foreignKey: {
          name: 'pembayaran_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pendaftaran',
        foreignKey: {
          name: 'pendaftaran_anak_id_fkey',
          columns: ['anak_id'],
          references: { schema: 'public', table: 'anak', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pendaftaran',
        foreignKey: {
          name: 'pendaftaran_kelas_id_fkey',
          columns: ['kelas_id'],
          references: { schema: 'public', table: 'kelas', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pendaftaran',
        foreignKey: {
          name: 'pendaftaran_periode_id_fkey',
          columns: ['periode_id'],
          references: { schema: 'public', table: 'periode_pendaftaran', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        foreignKey: {
          name: 'pengajuan_pembatalan_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        foreignKey: {
          name: 'pengajuan_pembatalan_diajukan_oleh_fkey',
          columns: ['diajukan_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        foreignKey: {
          name: 'pengajuan_pembatalan_diproses_oleh_fkey',
          columns: ['diproses_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'presensi',
        foreignKey: {
          name: 'presensi_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'presensi',
        foreignKey: {
          name: 'presensi_dicatat_oleh_fkey',
          columns: ['dicatat_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
