export function filterStatusForParent<
  T extends { id: number; kelasId: number; status: string; kadaluarsaPada: string }
>({
  statusList,
  activeClassIds,
  nowIso,
}: {
  statusList: T[];
  activeClassIds: number[];
  nowIso: string;
}): T[] {
  const classSet = new Set(activeClassIds);
  const seenStatusIds = new Set<number>();
  const results: T[] = [];

  for (const status of statusList) {
    if (!classSet.has(status.kelasId)) continue;
    if (status.status !== 'aktif') continue;
    if (status.kadaluarsaPada < nowIso) continue;
    if (seenStatusIds.has(status.id)) continue;
    seenStatusIds.add(status.id);
    results.push(status);
  }

  return results;
}
