#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/bb8ea2d00a9f4c3651d93a6b83cc839f274d50c53cf136702115d061b6a18e3b/contract';
import endContract from '../../snapshots/bb8ea2d00a9f4c3651d93a6b83cc839f274d50c53cf136702115d061b6a18e3b/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/cea3d11ca0d5ed3c33634a96805c18ac5cc9cafd63933e663f4b784f7ba87944/contract';
import startContract from '../../snapshots/cea3d11ca0d5ed3c33634a96805c18ac5cc9cafd63933e663f4b784f7ba87944/contract.json' with { type: 'json' };
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
        table: 'laporan_foto_status',
        columns: [
          col('alasan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('catatan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pelapor_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.createTable({
        schema: 'public',
        table: 'status_pembelajaran',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dibuat_oleh', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('diterbitkan_pada', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('kadaluarsa_pada', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('kelas_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('konten_teks', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('media_urls', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
            'status_pembelajaran_status_check_1d7b8e43',
            "\"status\" IN ('aktif', 'diarsipkan', 'ditarik_admin', 'dihapus_guru')",
          ),
        ],
      }),
      this.createTable({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        columns: [
          col('anak_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('pendaftaran_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('status_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addColumn({
        schema: 'public',
        table: 'anak',
        column: col('persetujuan_foto', 'bool', {
          notNull: true,
          default: lit(false),
          codecRef: { codecId: 'pg/bool@1' },
        }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        constraint: 'status_pembelajaran_penerima_status_id_pendaftaran_id_key',
        columns: ['status_id', 'pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'laporan_foto_status',
        index: 'laporan_foto_status_pelapor_id_idx_f6f78854',
        columns: ['pelapor_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'laporan_foto_status',
        index: 'laporan_foto_status_status_id_idx_060dbe68',
        columns: ['status_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'status_pembelajaran',
        index: 'status_pembelajaran_dibuat_oleh_idx_3489b1c4',
        columns: ['dibuat_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'status_pembelajaran',
        index: 'status_pembelajaran_diterbitkan_pada_idx_3532551f',
        columns: ['diterbitkan_pada'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'status_pembelajaran',
        index: 'status_pembelajaran_kelas_id_idx_933496b6',
        columns: ['kelas_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'status_pembelajaran',
        index: 'status_pembelajaran_status_idx_e98638ab',
        columns: ['status'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        index: 'status_pembelajaran_penerima_anak_id_idx_3569f103',
        columns: ['anak_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        index: 'status_pembelajaran_penerima_pendaftaran_id_idx_0bda22e6',
        columns: ['pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        index: 'status_pembelajaran_penerima_status_id_idx_060dbe68',
        columns: ['status_id'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'laporan_foto_status',
        foreignKey: {
          name: 'laporan_foto_status_status_id_fkey',
          columns: ['status_id'],
          references: { schema: 'public', table: 'status_pembelajaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'laporan_foto_status',
        foreignKey: {
          name: 'laporan_foto_status_pelapor_id_fkey',
          columns: ['pelapor_id'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'status_pembelajaran',
        foreignKey: {
          name: 'status_pembelajaran_kelas_id_fkey',
          columns: ['kelas_id'],
          references: { schema: 'public', table: 'kelas', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'status_pembelajaran',
        foreignKey: {
          name: 'status_pembelajaran_dibuat_oleh_fkey',
          columns: ['dibuat_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        foreignKey: {
          name: 'status_pembelajaran_penerima_status_id_fkey',
          columns: ['status_id'],
          references: { schema: 'public', table: 'status_pembelajaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        foreignKey: {
          name: 'status_pembelajaran_penerima_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'status_pembelajaran_penerima',
        foreignKey: {
          name: 'status_pembelajaran_penerima_anak_id_fkey',
          columns: ['anak_id'],
          references: { schema: 'public', table: 'anak', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
