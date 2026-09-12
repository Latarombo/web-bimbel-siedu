#!/usr/bin/env -S node
import type { Contract as Start } from '../../snapshots/5de3f153a07d0c1e86415b33cc852f6f3f763bdd11f34fa8990c1f4ceaa15e10/contract';
import startContract from '../../snapshots/5de3f153a07d0c1e86415b33cc852f6f3f763bdd11f34fa8990c1f4ceaa15e10/contract.json' with { type: 'json' };
import type { Contract as End } from '../../snapshots/c9886aded5f26b69efac22883482a586db165a9ca488f4ede26a96a560351045/contract';
import endContract from '../../snapshots/c9886aded5f26b69efac22883482a586db165a9ca488f4ede26a96a560351045/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, col } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.addColumn({
        schema: 'public',
        table: 'users',
        column: col('google_sub', 'text', { codecRef: { codecId: 'pg/text@1' } }),
      }),
      this.addUnique({
        schema: 'public',
        table: 'users',
        constraint: 'users_google_sub_key',
        columns: ['google_sub'],
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
