#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/995245598305cf22ab1099b76e06ef8ea920f813e861021e6cdc9dfa33a651f1/contract';
import startContract from '../../snapshots/995245598305cf22ab1099b76e06ef8ea920f813e861021e6cdc9dfa33a651f1/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/cea3d11ca0d5ed3c33634a96805c18ac5cc9cafd63933e663f4b784f7ba87944/contract';
import endContract from '../../snapshots/cea3d11ca0d5ed3c33634a96805c18ac5cc9cafd63933e663f4b784f7ba87944/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'laporan_perkembangan',
        columns: [
          col('catatan_internal', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('dicatat_oleh', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('diterbitkan_pada', 'timestamptz', {
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('draf', 'bool', {
            notNull: true,
            default: lit(true),
            codecRef: { codecId: 'pg/bool@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('judul', 'text', {
            notNull: true,
            default: lit('Laporan Perkembangan'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('laporan_ortu', 'text', { codecRef: { codecId: 'pg/text@1' } }),
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
      this.createIndex({
        schema: 'public',
        table: 'laporan_perkembangan',
        index: 'laporan_perkembangan_dicatat_oleh_idx_c21fd364',
        columns: ['dicatat_oleh'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'laporan_perkembangan',
        index: 'laporan_perkembangan_pendaftaran_id_idx_0bda22e6',
        columns: ['pendaftaran_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'laporan_perkembangan',
        index: 'laporan_perkembangan_tanggal_idx_9e863ca6',
        columns: ['tanggal'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'laporan_perkembangan',
        foreignKey: {
          name: 'laporan_perkembangan_pendaftaran_id_fkey',
          columns: ['pendaftaran_id'],
          references: { schema: 'public', table: 'pendaftaran', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'laporan_perkembangan',
        foreignKey: {
          name: 'laporan_perkembangan_dicatat_oleh_fkey',
          columns: ['dicatat_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
