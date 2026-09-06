/** Konsumsi AsyncIterable hasil db.runtime().query / ORM .all() ke array. */
export async function collect<T>(src: AsyncIterable<T>): Promise<T[]> {
  const out: T[] = [];
  for await (const r of src) out.push(r);
  return out;
}
