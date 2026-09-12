import Image from "next/image";

interface Testimonial {
  id: number;
  schoolName: string;
  teacherName: string;
  teacherTitle: string;
  quote: string;
  photoUrl: string;
}

const testimonials: Testimonial[] = [
  {
    id: 1,
    schoolName: 'SMAN 1 Kersana',
    teacherName: 'Muhammad Ihsan, S.pd',
    teacherTitle: 'Guru Siedu',
    quote:
      'Guru sangat terbantu dengan adanya konten materi yang sudah tersedia di Siedu. Siswa pun mudah memahami materi serta sangat antusias dalam mengikuti pembelajaran harian.',
    photoUrl: '/images/01_Teacher.png',
  },
  {
    id: 2,
    schoolName: 'SMAN 2 Banjarmasin',
    teacherName: 'Ahmad Zulkifli, M.Pd.',
    teacherTitle: 'Guru Siedu',
    quote:
      'Melalui Siedu, saya merasa terbantu dalam mengelola kelas daring, lebih mudah merekap presensi murid, serta lancar membagikan materi berupa modul PPT, e-book, dan video informatif.',
    photoUrl: '/images/02_Teacher.png',
  },
  {
    id: 3,
    schoolName: 'SMK IT Al-Junaediyah',
    teacherName: 'Rangga Pratama, S.Si',
    teacherTitle: 'Guru Siedu',
    quote:
      'Siedu memiliki fitur manajemen tugas dan kuis otomatis yang jarang dimiliki LMS lain. Fitur ini sangat meringankan beban administratif guru sehingga kami bisa fokus membimbing siswa.',
    photoUrl: '/images/03_Teacher.png',
  },
];

export default function TestimonialSection() {
  return (
    <section className="bg-[#0d1a24] py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header — ikut skala h2 halaman (dulu text-5xl/py-20, kegedean) */}
        <div className="text-center mb-12">
          <p className="text-xs font-bold tracking-widest uppercase text-amber-300">Pengajar</p>
          <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Kata guru tentang Siedu
          </h2>
          <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            Pengalaman nyata dari ribuan tenaga pendidik dalam mengoptimalkan
            proses belajar mengajar secara interaktif.
          </p>
        </div>

        {/* Testimonial Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-11 lg:gap-13">
          {testimonials.map((testimonial) => (
            <TestimonialCard key={testimonial.id} data={testimonial} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TestimonialCard({ data }: { data: Testimonial }) {
  return (
    <div className="relative">
      {/* School Badge - overlapping top edge of the card */}
      <div className="absolute -top-8 left-2 z-20">
        <div className="bg-white border border-gray-200 rounded-xl px-4 py-2.5 shadow-sm flex items-center space-x-2.5">
          {/* Icon Gedung Sekolah */}
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <svg
              className="w-4 h-4 text-cyan-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>
          <div>
            <p className="text-xs text-gray-500 leading-tight">Pengajar di</p>
            <p className="text-sm font-semibold text-gray-900 leading-tight">
              {data.schoolName}
            </p>
          </div>
        </div>
      </div>

      {/* Photo block — amber offset behind, white frame in front */}
      <div className="relative">
        <div className="absolute inset-0 bg-amber-300 rounded-2xl translate-x-2.5 translate-y-2.5" aria-hidden="true"></div>
        <div className="relative bg-white rounded-2xl overflow-hidden aspect-498/516">
          <Image
            src={data.photoUrl}
            alt={data.teacherName}
            fill
            sizes="(max-width: 768px) 100vw, 33vw"
            className="object-cover object-top"
          />
        </div>
      </div>

      {/* Quote Box — white, shadow only, overlapping the photo */}
      <div className="relative -mt-8 z-10 px-1">
        <div className="bg-white rounded-2xl p-6 shadow-xl relative border-2 border-cyan-700">
          {/* Quote Icon - lingkaran teal di pojok kiri atas */}
          <div className="absolute -top-5 left-6">
            <div className="w-10 h-10 bg-cyan-700 rounded-full flex items-center justify-center shadow-md">
              <svg
                className="w-5 h-5 text-white"
                fill="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
              </svg>
            </div>
          </div>

          {/* Quote Text */}
          <p className="text-gray-700 leading-relaxed mb-6 mt-2 text-[15px]">
            {data.quote}
          </p>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            <p className="font-bold text-gray-900 text-base">
              {data.teacherName}
            </p>
            <p className="text-sm text-gray-500 mt-0.5">
              {data.teacherTitle}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
