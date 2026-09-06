import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.d';
import contractJson from './contract.json' with { type: 'json' };

type Db = ReturnType<typeof postgres<Contract>>;

// Singleton: Next dev HMR re-import module ini berulang; tanpa cache global,
// tiap re-import bikin pool baru (serverless idem).
const globalForDb = globalThis as unknown as { __sieduDb?: Db };

export const db: Db = (globalForDb.__sieduDb ??= postgres<Contract>({
  contractJson,
  url: process.env['DATABASE_URL'],
}));
