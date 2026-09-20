#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/b008c632efad262ec1527d3a9d46b387b7fbad37d1dbd6720be7cffde1e9a9d3/contract';
import endContract from '../../snapshots/b008c632efad262ec1527d3a9d46b387b7fbad37d1dbd6720be7cffde1e9a9d3/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/bb8ea2d00a9f4c3651d93a6b83cc839f274d50c53cf136702115d061b6a18e3b/contract';
import startContract from '../../snapshots/bb8ea2d00a9f4c3651d93a6b83cc839f274d50c53cf136702115d061b6a18e3b/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'kelas',
        column: col('tingkat', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.createIndex({
        schema: 'public',
        table: 'kelas',
        index: 'kelas_tingkat_idx_b687b73a',
        columns: ['tingkat'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
