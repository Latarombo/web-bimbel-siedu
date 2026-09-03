import Link from "next/link";

const sections: { title: string; links: { label: string; href: string }[] }[] = [
  { title: "A. Public", links: [
    { label: "A1 Landing /", href: "/" },
    { label: "A2 Browse Classes", href: "/classes" },
    { label: "A3 Class Detail (contoh id=1)", href: "/classes/1" },
    { label: "A4 About", href: "/about" },
    { label: "A5 Privacy Policy", href: "/privacy-policy" },
    { label: "A6 Terms", href: "/terms" },
  ]},
  { title: "B. Auth", links: [
    { label: "B1 Login", href: "/login" },
    { label: "B2 Register", href: "/register" },
    { label: "B3 Register — account-info", href: "/register/account-info" },
    { label: "B4 Register — child-info", href: "/register/child-info" },
    { label: "B5 Forgot Password", href: "/forgot-password" },
    { label: "B6 Reset [token] (contoh abc)", href: "/reset-password/abc" },
  ]},
  { title: "C. Parent", links: [
    { label: "C1 Home", href: "/home" },
    { label: "C3 Enrollment [id]", href: "/enrollments/1" },
    { label: "C4 Pay", href: "/enrollments/1/pay" },
    { label: "C5 Payment Result", href: "/enrollments/1/payment-result" },
    { label: "C6 Payments", href: "/payments" },
    { label: "C7 Schedule & Attendance", href: "/schedule-attendance" },
    { label: "C8 Children", href: "/children" },
    { label: "C9 Add Child", href: "/children/new" },
    { label: "C10 Edit Child [id]", href: "/children/1/edit" },
    { label: "C11 Cancel", href: "/enrollments/1/cancel" },
    { label: "C12 Profile", href: "/profile" },
  ]},
  { title: "D. Teacher", links: [
    { label: "D1 Dashboard", href: "/teacher/dashboard" },
    { label: "D2 My Classes", href: "/teacher/classes" },
    { label: "D3 Attendance", href: "/teacher/classes/CLS1/sessions/2026-09-03/attendance" },
    { label: "D4 Grades", href: "/teacher/grades" },
    { label: "D5 Grade Input [enrollmentId]", href: "/teacher/grades/1" },
    { label: "D6 Corrections", href: "/teacher/corrections" },
    { label: "D7 Profile", href: "/teacher/profile" },
  ]},
  { title: "E. Admin", links: [
    { label: "E1 Dashboard", href: "/admin/dashboard" },
    { label: "E2 Subjects", href: "/admin/subjects" },
    { label: "E3 Periods", href: "/admin/periods" },
    { label: "E4 Teachers", href: "/admin/teachers" },
    { label: "E5 Classes", href: "/admin/classes" },
    { label: "E6 Flagged", href: "/admin/enrollments/flagged" },
    { label: "E7 Refunds", href: "/admin/refunds" },
    { label: "E8 Duplicate Children", href: "/admin/duplicate-children" },
    { label: "E9 Corrections", href: "/admin/corrections" },
    { label: "E10 Reports", href: "/admin/reports" },
  ]},
  { title: "F. Sistem", links: [
    { label: "F1 Cron", href: "/api/cron/check-timeout" },
    { label: "F2 Webhook (POST)", href: "/api/webhooks/midtrans" },
  ]},
];

export default function Landing() {
  return (
    <div style={{padding:24,maxWidth:960,margin:"0 auto"}}>
      <h1 style={{fontSize:28,fontWeight:800}}>Siedu — Daftar Halaman</h1>
      <p style={{color:"#666",marginTop:8}}>34 halaman UI + 2 route sistem. Semua placeholder aksesible. Desain menyusul.</p>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16,marginTop:24}}>
        {sections.map(s=>(
          <div key={s.title} style={{border:"1px solid #e5e7eb",borderRadius:12,padding:16}}>
            <h2 style={{fontWeight:700,marginBottom:8}}>{s.title}</h2>
            <ul style={{display:"grid",gap:6}}>
              {s.links.map(l=>(
                <li key={l.href}><Link href={l.href} style={{color:"#2563eb",textDecoration:"underline",fontSize:14}}>{l.label}</Link> <span style={{color:"#999",fontSize:12}}>{l.href}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
