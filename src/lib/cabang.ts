export type Cabang = {
  id: string;
  nama: string;
  wilayah: string;
  alamat: string;
  telepon?: string;
  wa?: string;
  mapsUrl: string;
  lat: number;
  lng: number;
};

export const KANTOR_PUSAT: Cabang = {
  id: "pusat",
  nama: "Kantor Pusat Siedu",
  wilayah: "Kedungkandang, Kota Malang",
  alamat: "Gg. 7 No.47, RT.7/RW.2, Mergosono, Kec. Kedungkandang, Kota Malang, Jawa Timur 65134",
  telepon: "(0341) 752389",
  wa: "6283846480817",
  mapsUrl: "https://maps.google.com/?q=-7.9996,112.6322",
  lat: -7.9996,
  lng: 112.6322,
};

export const DAFTAR_CABANG: Cabang[] = [
  {
    id: "suhat-lowokwaru",
    nama: "Cabang Soekarno-Hatta",
    wilayah: "Lowokwaru, Kota Malang",
    alamat: "Jl. Soekarno Hatta No.28, RT.3/RW.10, Jatimulyo, Kec. Lowokwaru, Kota Malang, Jawa Timur 65141 (dekat Bundaran Pesawat UB)",
    telepon: "0341-491203",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-7.9438,112.6186",
    lat: -7.9438,
    lng: 112.6186,
  },
  {
    id: "klojen-pusat",
    nama: "Cabang Klojen",
    wilayah: "Klojen, Kota Malang",
    alamat: "Jl. Buring No.15, Oro-oro Dowo, Kec. Klojen, Kota Malang, Jawa Timur 65119 (dekat Alun-Alun Tugu Malang)",
    telepon: "0341-364582",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-7.9754,112.6289",
    lat: -7.9754,
    lng: 112.6289,
  },
  {
    id: "sawojajar",
    nama: "Cabang Sawojajar",
    wilayah: "Kedungkandang, Kota Malang",
    alamat: "Jl. Danau Toba Blok E-1 No.12, Sawojajar, Kec. Kedungkandang, Kota Malang, Jawa Timur 65139",
    telepon: "0341-718294",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-7.9735,112.6582",
    lat: -7.9735,
    lng: 112.6582,
  },
  {
    id: "blimbing",
    nama: "Cabang Blimbing",
    wilayah: "Blimbing, Kota Malang",
    alamat: "Jl. Borobudur No.45, Mojolangu, Kec. Lowokwaru / Blimbing, Kota Malang, Jawa Timur 65142 (seberang Pasar Blimbing)",
    telepon: "0341-482915",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-7.9405,112.6384",
    lat: -7.9405,
    lng: 112.6384,
  },
  {
    id: "sukun",
    nama: "Cabang Sukun",
    wilayah: "Sukun, Kota Malang",
    alamat: "Jl. S. Supriadi No.78, Kebonsari, Kec. Sukun, Kota Malang, Jawa Timur 65149 (dekat kampus Unikama)",
    telepon: "0341-801243",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-8.0125,112.6178",
    lat: -8.0125,
    lng: 112.6178,
  },
  {
    id: "singosari",
    nama: "Cabang Singosari",
    wilayah: "Kab. Malang (Utara)",
    alamat: "Jl. Raya Singosari No.88, Pagentan, Kec. Singosari, Kabupaten Malang, Jawa Timur 65153 (dekat Candi Singosari)",
    telepon: "0341-458120",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-7.8932,112.6645",
    lat: -7.8932,
    lng: 112.6645,
  },
  {
    id: "kepanjen",
    nama: "Cabang Kepanjen",
    wilayah: "Kab. Malang (Selatan)",
    alamat: "Jl. Sultan Agung No.34, Kepanjen, Kec. Kepanjen, Kabupaten Malang, Jawa Timur 65163 (dekat Stadion Kanjuruhan)",
    telepon: "0341-392105",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-8.1328,112.5714",
    lat: -8.1328,
    lng: 112.5714,
  },
  {
    id: "kota-batu",
    nama: "Cabang Kota Batu",
    wilayah: "Kota Batu",
    alamat: "Jl. Panglima Sudirman No.52, Ngaglik, Kec. Batu, Kota Batu, Jawa Timur 65311 (dekat Balai Kota Among Tani)",
    telepon: "0341-591448",
    wa: "6283846480817",
    mapsUrl: "https://maps.google.com/?q=-7.8725,112.5273",
    lat: -7.8725,
    lng: 112.5273,
  },
];
