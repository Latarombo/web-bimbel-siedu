export default function Page({ params }: { params?: Record<string,string> }) {
  return (
    <div style={{padding:24}}>
      <h1 style={{fontSize:24,fontWeight:700}}>Teacher — My Classes</h1>
      <p style={{color:'#666',marginTop:8}}>Route: <code>/teacher/classes</code></p>
      <p style={{marginTop:12}}>D2 — jadwal + entry presensi</p>
      {params && Object.keys(params).length > 0 ? <pre style={{marginTop:12,background:'#f5f5f5',padding:12}}>{JSON.stringify(params,null,2)}</pre> : null}
      
      <p style={{marginTop:16}}><a href="/" style={{color:'#2563eb',textDecoration:'underline'}}>← Kembali ke /</a></p>
    </div>
  );
}
