#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/28d661cef68b212fc9eae3cca2b532187cb03d2615d94a754aeecf4debd8264d/contract';
import endContract from '../../snapshots/28d661cef68b212fc9eae3cca2b532187cb03d2615d94a754aeecf4debd8264d/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/52f1fa0cb41940ca1fba49354f50d9002f0b0988c802918c6dac20bb268ed641/contract';
import startContract from '../../snapshots/52f1fa0cb41940ca1fba49354f50d9002f0b0988c802918c6dac20bb268ed641/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, lit, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'catatan_pertemuan',
        columns: [
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
          col('materi', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('pr', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('sesi_id', 'int4', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'catatan_pertemuan',
        constraint: 'catatan_pertemuan_sesi_id_key',
        columns: ['sesi_id'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'catatan_pertemuan',
        index: 'catatan_pertemuan_dicatat_oleh_idx_c21fd364',
        columns: ['dicatat_oleh'],
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'catatan_pertemuan',
        foreignKey: {
          name: 'catatan_pertemuan_sesi_id_fkey',
          columns: ['sesi_id'],
          references: { schema: 'public', table: 'sesi_pertemuan', columns: ['id'] },
          onDelete: 'cascade',
        },
      }),
      this.addForeignKey({
        schema: 'public',
        table: 'catatan_pertemuan',
        foreignKey: {
          name: 'catatan_pertemuan_dicatat_oleh_fkey',
          columns: ['dicatat_oleh'],
          references: { schema: 'public', table: 'users', columns: ['id'] },
          onDelete: 'restrict',
        },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
