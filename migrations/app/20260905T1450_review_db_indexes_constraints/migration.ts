#!/usr/bin/env -S node
import type { Contract as End } from '../../snapshots/5de3f153a07d0c1e86415b33cc852f6f3f763bdd11f34fa8990c1f4ceaa15e10/contract';
import endContract from '../../snapshots/5de3f153a07d0c1e86415b33cc852f6f3f763bdd11f34fa8990c1f4ceaa15e10/contract.json' with { type: 'json' };
import type { Contract as Start } from '../../snapshots/e2138287af24b3ce1f66a657f81e0abac6102a391bbf0c7a5d4c1093a2a334a8/contract';
import startContract from '../../snapshots/e2138287af24b3ce1f66a657f81e0abac6102a391bbf0c7a5d4c1093a2a334a8/contract.json' with { type: 'json' };
import { Migration, MigrationCLI } from '@prisma/orm-postgres/migration';

export default class M extends Migration<Start, End> {
  override readonly startContractJson = startContract;
  override readonly endContractJson = endContract;

  override get operations() {
    return [
      this.dropIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_cron_tunggakan_029e89f1',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_pendaftaran_id_idx_0bda22e6',
      }),
      this.dropIndex({
        schema: 'public',
        table: 'pendaftaran',
        index: 'pendaftaran_cron_timeout_1bbe8adf',
      }),
      this.dropConstraint({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        constraint: 'pengajuan_pembatalan_pendaftaran_id_key',
      }),
      this.dropIndex({ schema: 'public', table: 'users', index: 'users_email_lower_17273133' }),
      this.addCheckConstraint({
        schema: 'public',
        table: 'kelas',
        constraint: 'kelas_tenor_butuh_dp_f6c5d8b3',
        expression: '(biaya_dp IS NULL) = (tenor_maksimum IS NULL)',
      }),
      this.createIndex({
        schema: 'public',
        table: 'anak',
        index: 'anak_tanggal_lahir_idx_7a61a1ac',
        columns: ['tanggal_lahir'],
      }),
      this.createIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_cron_tunggakan_f89b2577',
        columns: ['jatuh_tempo'],
        extras: { where: "(status = 'pending')" },
      }),
      this.createIndex({
        schema: 'public',
        table: 'pembayaran',
        index: 'pembayaran_dp_lunas_unik_ee66e35c',
        columns: ['pendaftaran_id'],
        extras: { where: '(cicilan_ke IS NULL)', unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'pendaftaran',
        index: 'pendaftaran_cron_timeout_c6400a54',
        columns: ['created_at'],
        extras: { where: "(status = 'menunggu_pembayaran')" },
      }),
      this.createIndex({
        schema: 'public',
        table: 'pengajuan_pembatalan',
        index: 'pengajuan_menunggu_unik_00d4f7ff',
        columns: ['pendaftaran_id'],
        extras: { where: "(status = 'menunggu')", unique: true },
      }),
      this.createIndex({
        schema: 'public',
        table: 'users',
        index: 'users_email_lower_f84d49fd',
        expression: 'lower(email)',
        extras: { unique: true },
      }),
    ];
  }
}

MigrationCLI.run(import.meta.url, M);
