#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/28d661cef68b212fc9eae3cca2b532187cb03d2615d94a754aeecf4debd8264d/contract';
import startContract from '../../snapshots/28d661cef68b212fc9eae3cca2b532187cb03d2615d94a754aeecf4debd8264d/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/a1da32ff5803ec3bf54d246c683daac601b4c56c2e4e00aad4b40b463668f8bf/contract';
import endContract from '../../snapshots/a1da32ff5803ec3bf54d246c683daac601b4c56c2e4e00aad4b40b463668f8bf/contract.json' with { type: 'json' };
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
        table: 'audit_perubahan',
        columns: [
          col('aksi', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('aktor_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('alasan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('entitas', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entitas_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('sebelum', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sesudah', 'text', { codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'pengajuan_koreksi',
        columns: [
          col('alasan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('catatan_admin', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('data_sebelum', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('data_usulan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('diproses_oleh', 'int4', { codecRef: { codecId: 'pg/int4@1' } }),
          col('entitas', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('entitas_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('guru_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
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
            'pengajuan_koreksi_status_check_64629cf3',
            "\"status\" IN ('menunggu', 'disetujui', 'ditolak')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_perubahan',
        index: 'audit_perubahan_aktor_id_idx_09d2e67e',
        columns: ['aktor_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'audit_perubahan',
        index: 'audit_perubahan_entitas_entitas_id_idx_e0afe73f',
        columns: ['entitas', 'entitas_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pengajuan_koreksi',
        index: 'pengajuan_koreksi_diproses_oleh_idx_c7a6c546',
        columns: ['diproses_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pengajuan_koreksi',
        index: 'pengajuan_koreksi_guru_id_idx_502a0782',
        columns: ['guru_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pengajuan_koreksi',
        index: 'pengajuan_koreksi_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'audit_perubahan',
        foreignKey: {
          name: 'audit_perubahan_aktor_id_fkey',
          columns: ['aktor_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pengajuan_koreksi',
        foreignKey: {
          name: 'pengajuan_koreksi_guru_id_fkey',
          columns: ['guru_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'pengajuan_koreksi',
        foreignKey: {
          name: 'pengajuan_koreksi_diproses_oleh_fkey',
          columns: ['diproses_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
