import Link from "next/link";
export default function Page() {
  return (
    <div style={{padding:24}}>
      <h1 style={{fontSize:24,fontWeight:700}}>Payment History & Status</h1>
      <p style={{color:'#666',marginTop:8}}>Route: <code>/payments</code></p>
      <p style={{marginTop:12}}>C6 — Top-level nav</p>
      
      <p style={{marginTop:16}}><Link href="/" className="text-sm text-brand underline">← Kembali ke /</Link></p>
    </div>
  );
}
