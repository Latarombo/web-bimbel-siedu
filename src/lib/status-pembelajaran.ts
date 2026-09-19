export function filterStatusForParent<
  T extends { id: number; status: string; kadaluarsaPada: string }
>({
  statusList,
  receipts,
  parentChildIds,
  activeEnrollmentIds,
  nowIso,
}: {
  statusList: T[];
  receipts: Array<{ statusId: number; anakId: number; pendaftaranId: number }>;
  parentChildIds: number[];
  activeEnrollmentIds: number[];
  nowIso: string;
}): T[] {
  const childSet = new Set(parentChildIds);
  const enrollmentSet = new Set(activeEnrollmentIds);

  const allowedStatusIds = new Set(
    receipts
      .filter((r) => childSet.has(r.anakId) && enrollmentSet.has(r.pendaftaranId))
      .map((r) => r.statusId),
  );

  const seenStatusIds = new Set<number>();
  const results: T[] = [];

  for (const status of statusList) {
    if (!allowedStatusIds.has(status.id)) continue;
    if (status.status !== 'aktif') continue;
    if (status.kadaluarsaPada < nowIso) continue;
    if (seenStatusIds.has(status.id)) continue;
    seenStatusIds.add(status.id);
    results.push(status);
  }

  return results;
}
