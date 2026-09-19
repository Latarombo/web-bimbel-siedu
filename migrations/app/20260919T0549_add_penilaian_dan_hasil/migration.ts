#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/995245598305cf22ab1099b76e06ef8ea920f813e861021e6cdc9dfa33a651f1/contract';
import endContract from '../../snapshots/995245598305cf22ab1099b76e06ef8ea920f813e861021e6cdc9dfa33a651f1/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/a1da32ff5803ec3bf54d246c683daac601b4c56c2e4e00aad4b40b463668f8bf/contract';
import startContract from '../../snapshots/a1da32ff5803ec3bf54d246c683daac601b4c56c2e4e00aad4b40b463668f8bf/contract.json' with { type: 'json' };
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
        table: 'hasil_penilaian',
        columns: [
          col('catatan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nilai', 'numeric', { codecRef: { codecId: 'pg/numeric@1' } }),
          col('pendaftaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('penilaian_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status_hasil', 'text', {
            notNull: true,
            default: lit('belum_dinilai'),
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
          checkExpression('hasil_penilaian_non_negatif_4a34f6d6', 'nilai IS NULL OR nilai >= 0'),
          checkExpression(
            'hasil_penilaian_status_hasil_check_989d6ff8',
            "\"status_hasil\" IN ('belum_dinilai', 'dinilai', 'tidak_ikut')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'penilaian',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dibuat_oleh', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('diterbitkan_pada', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('draf', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('kelas_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('nilai_maksimum', 'numeric', {
            notNull: true,
            default: lit('100'),
            codecRef: { codecId: 'pg/numeric@1' },
          }),
          col('tanggal', 'date', { notNull: true, codecRef: { codecId: 'pg/date-string@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression('penilaian_maksimum_positif_fba317bb', 'nilai_maksimum > 0'),
        ],
      }),
      this.addUnique({
        schema: 'public',
        table: 'hasil_penilaian',
        constraint: 'hasil_penilaian_penilaian_id_pendaftaran_id_key',
        columns: ['penilaian_id', 'pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'hasil_penilaian',
        index: 'hasil_penilaian_pendaftaran_id_idx_0bda22e6',
        columns: ['pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'hasil_penilaian',
        index: 'hasil_penilaian_penilaian_id_idx_f5bdb1b3',
        columns: ['penilaian_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'penilaian',
        index: 'penilaian_dibuat_oleh_idx_3489b1c4',
        columns: ['dibuat_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'penilaian',
        index: 'penilaian_kelas_id_idx_933496b6',
        columns: ['kelas_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'penilaian',
        index: 'penilaian_tanggal_idx_9e863ca6',
        columns: ['tanggal'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'hasil_penilaian',
        foreignKey: {
          name: 'hasil_penilaian_penilaian_id_fkey',
          columns: ['penilaian_id'],
          references: { schema: 'public', table: 'penilaian', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'hasil_penilaian',
        foreignKey: {
          name: 'hasil_penilaian_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'penilaian',
        foreignKey: {
          name: 'penilaian_kelas_id_fkey',
          columns: ['kelas_id'],
          references: { schema: 'public', table: 'kelas', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'penilaian',
        foreignKey: {
          name: 'penilaian_dibuat_oleh_fkey',
          columns: ['dibuat_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
