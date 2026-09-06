import Link from "next/link";
export default async function Page({ params }: { params: Promise<Record<string,string>> }) {
  const p = await params;
  return (
    <div style={{padding:24}}>
      <h1 style={{fontSize:24,fontWeight:700}}>Payment Confirmation</h1>
      <p style={{color:'#666',marginTop:8}}>Route: <code>/enrollments/[id]/payment-result</code></p>
      <pre style={{marginTop:12,background:'#f5f5f5',padding:12}}>{JSON.stringify(p,null,2)}</pre>
      <p style={{marginTop:12}}>Placeholder — Payment Confirmation. Desain menyusul.</p>
      <p style={{marginTop:16}}><Link href="/" className="text-sm text-brand underline">← Kembali ke /</Link></p>
    </div>
  );
}
