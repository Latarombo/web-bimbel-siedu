import Link from "next/link";

export default function HeroSection() {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Grid Pattern Background */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      ></div>

      {/* Content Container */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          {/* Left Column - Text Content */}
          <div className="order-2 lg:order-1 text-center lg:text-left">
            {/* Heading */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              <span className="text-gray-900">Bimbingan Belajar </span>
              <br className="hidden sm:block" />
              <span className="text-gray-900">Lebih </span>
              <span className="text-amber-500">Mudah, Teratur, </span>
              <br className="hidden sm:block" />
              <span className="text-amber-500">dan Terpantau</span>
            </h1>

            {/* Subheading */}
            <p className="text-gray-600 text-base sm:text-lg leading-relaxed mb-8 max-w-xl mx-auto lg:mx-0">
              Kelola pendaftaran kelas, pembayaran, jadwal, presensi, hingga
              perkembangan belajar anak dalam satu platform.
            </p>

            {/* Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Link
                href="/register"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors duration-200 shadow-md hover:shadow-lg min-w-[180px]"
              >
                Daftar sekarang
              </Link>
              <Link
                href="/classes"
                className="inline-flex items-center justify-center px-8 py-3.5 bg-white hover:bg-gray-50 text-gray-800 font-semibold rounded-lg border-2 border-gray-300 hover:border-gray-400 transition-colors duration-200 min-w-[180px]"
              >
                Lihat Kelas
              </Link>
            </div>
          </div>

          {/* Right Column - Image with Blob */}
          <div className="order-1 lg:order-2 relative flex justify-center lg:justify-end">
            <div className="relative w-full max-w-lg lg:max-w-none">
              {/* Blue Blob Shape (SVG) */}
              <svg
                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] -z-10"
                viewBox="0 0 500 500"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M250,50 C350,50 420,100 440,180 C460,260 430,340 370,400 C310,460 220,470 150,430 C80,390 40,320 50,240 C60,160 150,50 250,50 Z"
                  fill="#2563eb"
                />
              </svg>

              {/* Student Image */}
              <img
                src="/images/right-hero.png"
                alt="Siswa tersenyum dengan tablet"
                className="relative w-full h-auto object-contain drop-shadow-xl"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
