#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/7829a85fcbccf9a83afe3a47e17ed5c7fec0f1b6f3638ad4f13c7e3f29a8c39e/contract';
import endContract from '../../snapshots/7829a85fcbccf9a83afe3a47e17ed5c7fec0f1b6f3638ad4f13c7e3f29a8c39e/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/b008c632efad262ec1527d3a9d46b387b7fbad37d1dbd6720be7cffde1e9a9d3/contract';
import startContract from '../../snapshots/b008c632efad262ec1527d3a9d46b387b7fbad37d1dbd6720be7cffde1e9a9d3/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'anak',
        column: col('tingkat', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_nomor_telepon_key',
        columns: ['nomor_telepon'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
