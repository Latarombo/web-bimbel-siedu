#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/73542dcea0fa4b01ae9c5168b7209eb26c36dd2020848e4842bf5a7c1ece57a0/contract';
import startContract from '../../snapshots/73542dcea0fa4b01ae9c5168b7209eb26c36dd2020848e4842bf5a7c1ece57a0/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/e2138287af24b3ce1f66a657f81e0abac6102a391bbf0c7a5d4c1093a2a334a8/contract';
import endContract from '../../snapshots/e2138287af24b3ce1f66a657f81e0abac6102a391bbf0c7a5d4c1093a2a334a8/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  placeholder,
  primaryKey,
  rawSql,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropColumn({ schema: 'public', table: 'anak', column: 'deleted_at' }),
      this.dropColumn({ schema: 'public', table: 'kelas', column: 'deleted_at' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'pendaftaran',
        constraint: 'pendaftaran_status_check_dc26f40c',
      }),
      this.dropColumn({ schema: 'public', table: 'pendaftaran', column: 'deleted_at' }),
      this.dropColumn({ schema: 'public', table: 'pendaftaran', column: 'diajukan_pada' }),
      this.dropConstraint({
        schema: 'public',
        table: 'presensi',
        constraint: 'presensi_pendaftaran_id_tanggal_pertemuan_key',
      }),
      this.dropColumn({ schema: 'public', table: 'users', column: 'remember_token' }),
      this.createTable({
        schema: 'public',
        table: 'jadwal_item',
        columns: [
          col('hari', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jam_mulai', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('jam_selesai', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('kelas_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'jadwal_item_hari_check_666350e4',
            "\"hari\" IN ('Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu')",
          ),
          checkExpression('jadwal_item_jam_range_20bc40a8', 'jam_mulai < jam_selesai'),
        ],
      }),
      // BR#27: pindahkan slot jadwal lama (kelas.hari/jam_*) ke jadwal_item sebelum kolomnya di-drop
      rawSql({
        id: 'backfill-jadwal-item',
        label: 'Backfill jadwal_item from kelas.hari/jam_mulai/jam_selesai',
        operationClass: 'data',
        target: { id: 'postgres' },
        precheck: [],
        execute: [
          {
            description: 'Copy each kelas single-slot schedule into jadwal_item',
            sql: "INSERT INTO public.jadwal_item (hari, jam_mulai, jam_selesai, kelas_id) SELECT k.hari, k.jam_mulai, k.jam_selesai, k.id FROM public.kelas k WHERE NOT EXISTS (SELECT 1 FROM public.jadwal_item ji WHERE ji.kelas_id = k.id)",
            params: [],
          },
        ],
        postcheck: [],
      }),
      this.addColumn({
        schema: 'public',
        table: 'kelas',
        column: col('tenor_maksimum', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'pendaftaran',
        column: col('tenor_bulan', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'kelas',
        column: col('jenjang', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      // BR#27: jenjang pindah dari mata_pelajaran ke kelas — salin sebelum kolom lama di-drop
      rawSql({
        id: 'backfill-kelas-jenjang',
        label: 'Backfill kelas.jenjang from mata_pelajaran.jenjang',
        operationClass: 'data',
        target: { id: 'postgres' },
        precheck: [],
        execute: [
          {
            description: 'Copy jenjang from the subject each class points at',
            sql: "UPDATE public.kelas k SET jenjang = mp.jenjang FROM public.mata_pelajaran mp WHERE k.mata_pelajaran_id = mp.id AND k.jenjang IS NULL AND mp.jenjang IS NOT NULL",
            params: [],
          },
        ],
        postcheck: [],
      }),
      this.setNotNull({ schema: 'public', table: 'kelas', column: 'jenjang' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'mata_pelajaran',
        constraint: 'mata_pelajaran_jenjang_check_2be2c303',
      }),
      this.dropColumn({ schema: 'public', table: 'mata_pelajaran', column: 'jenjang' }),
      this.dropCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_hari_check_666350e4',
      }),
      this.dropColumn({ schema: 'public', table: 'kelas', column: 'hari' }),
      this.dropColumn({ schema: 'public', table: 'kelas', column: 'jam_mulai' }),
      this.dropColumn({ schema: 'public', table: 'kelas', column: 'jam_selesai' }),
      this.addColumn({
        schema: 'public',
        table: 'presensi',
        column: col('jadwal_item_id', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      // BR#27: presensi lama mengikat ke slot tunggal kelas — petakan ke jadwal_item kelas tsb
      rawSql({
        id: 'backfill-presensi-jadwal-item',
        label: 'Backfill presensi.jadwal_item_id from the class single slot',
        operationClass: 'data',
        target: { id: 'postgres' },
        precheck: [],
        execute: [
          {
            description: 'Point each presensi row at its class jadwal_item (only one existed pre-migration)',
            sql: "UPDATE public.presensi p SET jadwal_item_id = ji.id FROM public.jadwal_item ji JOIN public.pendaftaran pd ON pd.kelas_id = ji.kelas_id WHERE pd.id = p.pendaftaran_id AND p.jadwal_item_id IS NULL",
            params: [],
          },
        ],
        postcheck: [],
      }),
      this.setNotNull({ schema: 'public', table: 'presensi', column: 'jadwal_item_id' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'anak',
        constraint: 'anak_dob_not_future_661a6c61',
        expression: 'tanggal_lahir <= CURRENT_DATE',
      }),
      this.addUnique({
        schema: 'public',
        table: 'jadwal_item',
        constraint: 'jadwal_item_kelas_id_hari_jam_mulai_jam_selesai_key',
        columns: ['kelas_id', 'hari', 'jam_mulai', 'jam_selesai'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_biaya_pos_0b501547',
        expression: 'biaya_periode > 0',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_dp_range_66d1fb8a',
        expression: 'biaya_dp IS NULL OR (biaya_dp > 0 AND biaya_dp < biaya_periode)',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_jenjang_check_2be2c303',
        expression: "\"jenjang\" IN ('TK', 'SD', 'SMP', 'SMA')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_kuota_range_84ebdb76',
        expression: 'kuota_minimum <= kuota_maksimum',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_kuota_terisi_e8fa8168',
        expression: 'kuota_terisi <= kuota_maksimum',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_tenor_min_1d9cd717',
        expression: 'tenor_maksimum IS NULL OR tenor_maksimum >= 2',
      }),
      this.addUnique({
        schema: 'public',
        table: 'mata_pelajaran',
        constraint: 'mata_pelajaran_nama_key',
        columns: ['nama'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'nilai_progres',
        constraint: 'nilai_range_0_100_d87bf105',
        expression:
          'nilai_kuantitatif IS NULL OR (nilai_kuantitatif >= 0 AND nilai_kuantitatif <= 100)',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pembayaran',
        constraint: 'pembayaran_cicilan_ke_pos_83bf84c6',
        expression: 'cicilan_ke IS NULL OR cicilan_ke >= 1',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pembayaran',
        constraint: 'pembayaran_jumlah_pos_21936a5f',
        expression: 'jumlah > 0',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pembayaran',
        constraint: 'pembayaran_tipe_cicilan_konsisten_778d0ac4',
        expression: "(tipe = 'cicilan') = (cicilan_ke IS NOT NULL)",
      }),
      this.addUnique({
        schema: 'public',
        table: 'pembayaran',
        constraint: 'pembayaran_pendaftaran_id_cicilan_ke_key',
        columns: ['pendaftaran_id', 'cicilan_ke'],
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pendaftaran',
        constraint: 'pendaftaran_status_check_d52f5656',
        expression:
          "\"status\" IN ('menunggu_pembayaran', 'terdaftar', 'tertunggak', 'dibatalkan_timeout', 'dibatalkan_tunggakan', 'dibatalkan_orang_tua', 'dibatalkan_kelas')",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'pendaftaran',
        constraint: 'pendaftaran_tenor_konsisten_6ab66e2a',
        expression:
          "(metode_bayar = 'dp_cicilan' AND tenor_bulan IS NOT NULL AND tenor_bulan >= 2) OR (metode_bayar = 'lunas' AND tenor_bulan IS NULL)",
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'periode_pendaftaran',
        constraint: 'periode_range_2aedd500',
        expression: 'tanggal_mulai < tanggal_selesai',
      }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'periode_pendaftaran',
        constraint: 'periode_tutup_dbl_selesai_dfb105c1',
        expression: 'tanggal_tutup_pendaftaran <= tanggal_selesai',
      }),
      this.addUnique({
        schema: 'public',
        table: 'presensi',
        constraint: 'presensi_pendaftaran_id_tanggal_pertemuan_jadwal_item_id_key',
        columns: ['pendaftaran_id', 'tanggal_pertemuan', 'jadwal_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'jadwal_item',
        index: 'jadwal_item_hari_idx_23689cb2',
        columns: ['hari'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'jadwal_item',
        index: 'jadwal_item_kelas_id_idx_933496b6',
        columns: ['kelas_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'kelas',
        index: 'kelas_jenjang_idx_e9e99a39',
        columns: ['jenjang'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'kelas',
        index: 'kelas_periode_id_status_idx_0b961910',
        columns: ['periode_id', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_cron_tunggakan_029e89f1',
        columns: ['status', 'jatuh_tempo'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_pendaftaran_id_status_idx_7652c132',
        columns: ['pendaftaran_id', 'status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pendaftaran',
        index: 'pendaftaran_aktif_unique_946279c1',
        columns: ['anak_id', 'kelas_id', 'periode_id'],
        extras: {
          where:
            "(status NOT IN ('dibatalkan_timeout','dibatalkan_tunggakan','dibatalkan_orang_tua','dibatalkan_kelas'))",
          unique: true,
        },
      }),
      this.createIndex({
        schema: 'public',
        table: 'pendaftaran',
        index: 'pendaftaran_cron_timeout_1bbe8adf',
        columns: ['status', 'created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        index: 'pengajuan_pembatalan_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'periode_pendaftaran',
        index: 'periode_pendaftaran_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'presensi',
        index: 'presensi_jadwal_item_id_idx_0812e48c',
        columns: ['jadwal_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_email_lower_17273133',
        expression: 'lower(email)',
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'jadwal_item',
        foreignKey: {
          name: 'jadwal_item_kelas_id_fkey',
          columns: ['kelas_id'],
          references: { schema: 'public', table: 'kelas', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'presensi',
        foreignKey: {
          name: 'presensi_jadwal_item_id_fkey',
          columns: ['jadwal_item_id'],
          references: { schema: 'public', table: 'jadwal_item', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
