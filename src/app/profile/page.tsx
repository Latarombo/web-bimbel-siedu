import Link from "next/link";
export default function Page() {
  return (
    <div style={{padding:24}}>
      <h1 style={{fontSize:24,fontWeight:700}}>Edit Account Profile</h1>
      <p style={{color:'#666',marginTop:8}}>Route: <code>/profile</code></p>
      <p style={{marginTop:12}}>C12 — Di dropdown Parent</p>
      
      <p style={{marginTop:16}}><Link href="/" className="text-sm text-brand underline">← Kembali ke /</Link></p>
    </div>
  );
}
