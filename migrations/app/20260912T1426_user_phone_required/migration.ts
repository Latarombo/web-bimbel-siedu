#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/31983e5d9e869fb95d56412948f1adfd642702baa3ccb783a24cd72d939ef090/contract';
import endContract from '../../snapshots/31983e5d9e869fb95d56412948f1adfd642702baa3ccb783a24cd72d939ef090/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/c9886aded5f26b69efac22883482a586db165a9ca488f4ede26a96a560351045/contract';
import startContract from '../../snapshots/c9886aded5f26b69efac22883482a586db165a9ca488f4ede26a96a560351045/contract.json' with { type: 'json' };
import { Migration, MigrationCLI, rawSql } from '@prisma/orm-postgres/migration';

// BR#32: users.nomor_telepon menjadi wajib (NOT NULL).
// DataTransform di-render sebagai op mentah (full op shape via rawSql):
// 1) backfill: warisi nomor anak pertama yang terisi, fallback placeholder
// dev-only; 2) postcheck anti-null; lalu setNotNull terstruktur.
const BACKFILL = `
UPDATE public.users u
SET nomor_telepon = COALESCE(
 (
 SELECT NULLIF(a.nomor_telepon, '')
 FROM public.anak a
 WHERE a.orang_tua_id = u.id
 AND NULLIF(a.nomor_telepon, '') IS NOT NULL
 ORDER BY a.id
 LIMIT 1
 ),
 '+62-000-0000-0000'
 )
WHERE u.nomor_telepon IS NULL OR trim(u.nomor_telepon) = ''
`;

const VIOLATION =
 "SELECT 1 FROM public.users WHERE nomor_telepon IS NULL OR trim(nomor_telepon) = '' LIMIT 1";

export default class M extends Migration<Start, End> {
 override readonly startContractJson = startContract;
 override readonly endContractJson = endContract;

 override get operations() {
 return [
 rawSql({
 id: 'data_migration.handle-nulls-users-nomor_telepon',
 label: 'Data transform: backfill users.nomor_telepon (BR#32)',
 operationClass: 'data',
 target: { id: 'postgres' },
 precheck: [
 {
 description: 'Ensure backfill statement is valid on this schema',
 sql: 'SELECT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3) AS ok',
 params: ['public', 'users', 'nomor_telepon'],
 },
 ],
 execute: [{ description: 'Backfill kosong/NULL dengan nomor anak atau placeholder', sql: BACKFILL, params: [] }],
 postcheck: [
 {
 description: 'Verify tidak ada users dengan nomor_telepon kosong',
 sql: `SELECT NOT EXISTS (${VIOLATION}) AS ok`,
 params: [],
 },
 ],
 }),
 this.setNotNull({ schema: 'public', table: 'users', column: 'nomor_telepon' }),
 ];
 }
}

MigrationCLI.run(import.meta.url, M);
