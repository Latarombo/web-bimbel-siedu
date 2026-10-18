#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/62c70b569a6fc3ef54da90968758496e532cf04fa77ebec2d858866d87149531/contract';
import endContract from '../../snapshots/62c70b569a6fc3ef54da90968758496e532cf04fa77ebec2d858866d87149531/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/d5530a44ba157ae16ad531f25db8d75aaa2589bc221aa9aa8d04bb5d67c9e332/contract';
import startContract from '../../snapshots/d5530a44ba157ae16ad531f25db8d75aaa2589bc221aa9aa8d04bb5d67c9e332/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col, fn, primaryKey } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.createTable({
        schema: 'public',
        table: 'password_reset_tokens',
        columns: [
          col('created_at', 'timestamptz', {
            notNull: true,
            default: fn('now()'),
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('email', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
          col('expires_at', 'timestamptz', {
            notNull: true,
            codecRef: { codecId: 'pg/timestamptz-string@1' },
          }),
          col('id', 'SERIAL', { notNull: true, codecRef: { codecId: 'pg/int4@1' } }),
          col('token_hash', 'text', { notNull: true, codecRef: { codecId: 'pg/text@1' } }),
        ],
        constraints: [primaryKey(['id'])],
      }),
      this.addUnique({
        schema: 'public',
        table: 'password_reset_tokens',
        constraint: 'password_reset_tokens_token_hash_key',
        columns: ['token_hash'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'password_reset_tokens',
        index: 'password_reset_tokens_email_idx_46df9cad',
        columns: ['email'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'password_reset_tokens',
        index: 'password_reset_tokens_expires_at_idx_35365ada',
        columns: ['expires_at'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
