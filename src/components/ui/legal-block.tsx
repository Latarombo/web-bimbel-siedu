/**
 * Peraga blok dokumen hukum (privacy & syarat).
 * Menerima bentuk minimal { jenis, teks?, poin? } supaya type data tiap halaman
 * tetap milik modulnya sendiri (BlokPrivasi / BlokSyarat), cukup struktural sama.
 */

export type BlokHukum =
 | { jenis: "p"; teks: string }
 | { jenis: "ul"; poin: string[] };

export function TeksKaya({ teks }: { teks: string }) {
 const bagian = teks.split(/(\*\*[^*]+\*\*)/g).filter(Boolean);
 return (
 <>
 {bagian.map((b, i) =>
 b.startsWith("**") && b.endsWith("**") ? (
 <strong key={i} className="font-semibold text-foreground">{b.slice(2, -2)}</strong>
 ) : (
 <span key={i}>{b}</span>
 )
 )}
 </>
 );
}

export function BlokHukumView({ blok }: { blok: BlokHukum }) {
 if (blok.jenis === "ul") {
  return (
   /* indent sedikit lebih rapat di HP (pl-4) supaya teks tidak terasa menyempit */
   <ul className="list-disc space-y-2 break-words pl-4 marker:text-muted sm:pl-5">
    {blok.poin.map((p, i) => (
     <li key={i} className="pl-1"><TeksKaya teks={p} /></li>
    ))}
   </ul>
  );
 }
 return <p className="text-pretty break-words"><TeksKaya teks={blok.teks} /></p>;
}
