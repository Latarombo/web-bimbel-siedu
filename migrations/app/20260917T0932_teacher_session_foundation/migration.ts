#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/52f1fa0cb41940ca1fba49354f50d9002f0b0988c802918c6dac20bb268ed641/contract';
import endContract from '../../snapshots/52f1fa0cb41940ca1fba49354f50d9002f0b0988c802918c6dac20bb268ed641/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/84974d020d7845e7285162f3fab97665e461868b497e86e6a80e3bb81af2ffbf/contract';
import startContract from '../../snapshots/84974d020d7845e7285162f3fab97665e461868b497e86e6a80e3bb81af2ffbf/contract.json' with { type: 'json' };
import {
  Migration,
  MigrationCLI,
  checkExpression,
  col,
  fn,
  lit,
  primaryKey,
} from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'peserta_sesi',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pendaftaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sesi_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status_daftar', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'peserta_sesi_status_daftar_check_292b1719',
            "\"status_daftar\" IN ('menunggu_pembayaran', 'terdaftar', 'tertunggak', 'dibatalkan_timeout', 'dibatalkan_tunggakan', 'dibatalkan_orang_tua', 'dibatalkan_kelas')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'sesi_pertemuan',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dibatalkan_alasan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jadwal_item_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jam_mulai', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('jam_selesai', 'time', { notNull: true, codecRef: { codecId: 'pg/time-string@1' } }),
          col('status_sesi', 'text', {
            notNull: true,
            default: lit('terjadwal'),
            codecRef: { codecId: 'pg/text@1' },
          }),
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
          checkExpression('sesi_jam_range_20bc40a8', 'jam_mulai < jam_selesai'),
          checkExpression(
            'sesi_pertemuan_status_sesi_check_55d1b5cb',
            "\"status_sesi\" IN ('terjadwal', 'selesai', 'dibatalkan')",
          ),
        ],
      }),
      this.addColumn({
        schema: 'public',
        table: 'presensi',
        column: col('sesi_pertemuan_id', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
      }),
      this.addColumn({
        schema: 'public',
        table: 'presensi',
        column: col('terlambat', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'peserta_sesi',
        constraint: 'peserta_sesi_sesi_id_pendaftaran_id_key',
        columns: ['sesi_id', 'pendaftaran_id'],
      }),
      this.addUnique({
        schema: 'public',
        table: 'sesi_pertemuan',
        constraint: 'sesi_pertemuan_jadwal_item_id_tanggal_pertemuan_key',
        columns: ['jadwal_item_id', 'tanggal_pertemuan'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'peserta_sesi',
        index: 'peserta_sesi_pendaftaran_id_idx_0bda22e6',
        columns: ['pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'peserta_sesi',
        index: 'peserta_sesi_sesi_id_idx_9e4d5c99',
        columns: ['sesi_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'presensi',
        index: 'presensi_sesi_pertemuan_id_idx_aa4a3c80',
        columns: ['sesi_pertemuan_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sesi_pertemuan',
        index: 'sesi_pertemuan_jadwal_item_id_idx_0812e48c',
        columns: ['jadwal_item_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'sesi_pertemuan',
        index: 'sesi_pertemuan_tanggal_pertemuan_idx_13aea590',
        columns: ['tanggal_pertemuan'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'peserta_sesi',
        foreignKey: {
          name: 'peserta_sesi_sesi_id_fkey',
          columns: ['sesi_id'],
          references: { schema: 'public', table: 'sesi_pertemuan', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'peserta_sesi',
        foreignKey: {
          name: 'peserta_sesi_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'sesi_pertemuan',
        foreignKey: {
          name: 'sesi_pertemuan_jadwal_item_id_fkey',
          columns: ['jadwal_item_id'],
          references: { schema: 'public', table: 'jadwal_item', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'presensi',
        foreignKey: {
          name: 'presensi_sesi_pertemuan_id_fkey',
          columns: ['sesi_pertemuan_id'],
          references: { schema: 'public', table: 'sesi_pertemuan', columns: ['id'] },
          onDelete: 'setNull',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
