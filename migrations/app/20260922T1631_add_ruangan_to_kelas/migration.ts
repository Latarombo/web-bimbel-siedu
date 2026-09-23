#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/7829a85fcbccf9a83afe3a47e17ed5c7fec0f1b6f3638ad4f13c7e3f29a8c39e/contract';
import startContract from '../../snapshots/7829a85fcbccf9a83afe3a47e17ed5c7fec0f1b6f3638ad4f13c7e3f29a8c39e/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/d5530a44ba157ae16ad531f25db8d75aaa2589bc221aa9aa8d04bb5d67c9e332/contract';
import endContract from '../../snapshots/d5530a44ba157ae16ad531f25db8d75aaa2589bc221aa9aa8d04bb5d67c9e332/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'kelas',
        column: col('ruangan', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
