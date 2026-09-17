#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/31983e5d9e869fb95d56412948f1adfd642702baa3ccb783a24cd72d939ef090/contract';
import startContract from '../../snapshots/31983e5d9e869fb95d56412948f1adfd642702baa3ccb783a24cd72d939ef090/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/84974d020d7845e7285162f3fab97665e461868b497e86e6a80e3bb81af2ffbf/contract';
import endContract from '../../snapshots/84974d020d7845e7285162f3fab97665e461868b497e86e6a80e3bb81af2ffbf/contract.json' with { type: 'json' };
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
        table: 'pesan_kontak',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('jenjang', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('nama', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('pesan', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('sekolah', 'text', { codecRef: { codecId: 'pg/text@1' } }),
          col('status', 'text', {
            notNull: true,
            default: lit('baru'),
            codecRef: { codecId: 'pg/text@1' },
          }),
          col('subjek', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('telepon', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('updated_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
        ],
        constraints: [
          primaryKey(['id']),
          checkExpression(
            'pesan_kontak_jenjang_check_2be2c303',
            "\"jenjang\" IN ('TK', 'SD', 'SMP', 'SMA')",
          ),
          checkExpression(
            'pesan_kontak_status_check_7600466d',
            "\"status\" IN ('baru', 'diproses', 'selesai')",
          ),
        ],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pesan_kontak',
        index: 'pesan_kontak_created_at_idx_225d8c0f',
        columns: ['created_at'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pesan_kontak',
        index: 'pesan_kontak_status_idx_e98638ab',
        columns: ['status'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
