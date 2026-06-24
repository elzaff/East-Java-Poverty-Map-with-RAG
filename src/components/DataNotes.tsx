import React from 'react';
import { X, Satellite, FileText, BarChart2, AlertTriangle, Brain, Info, MapPin } from 'lucide-react';

interface DataNotesProps {
  onClose: () => void;
}

const Section = ({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) => (
  <section className="space-y-3">
    <h3 className="flex items-center gap-2 text-sm font-bold text-white tracking-tight">
      <Icon size={16} className="text-red-400 shrink-0" /> {title}
    </h3>
    <div className="text-sm text-white/70 leading-relaxed space-y-2 pl-6">{children}</div>
  </section>
);

const Tag = ({ children }: { children: React.ReactNode }) => (
  <code className="bg-white/10 text-white/90 px-1.5 py-0.5 rounded text-[11px] font-mono">{children}</code>
);

export function DataNotes({ onClose }: DataNotesProps) {
  return (
    <div className="absolute inset-0 bg-[#0a0a0b]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-[#111114] border border-white/10 rounded-lg shadow-2xl w-full max-w-4xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight mb-1">Tentang Data & Metodologi</h2>
            <p className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Sumber data, cara kerja model, dan batasan interpretasi</p>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar space-y-8">

          <Section icon={Info} title="Apa yang Ditampilkan di Peta?">
            <p>
              Nilai di peta adalah <strong className="text-white">Poverty Risk Score</strong> — estimasi persentase penduduk miskin per kecamatan per tahun dari model deep learning.
            </p>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>
                <strong className="text-white">Poverty Risk Score</strong> — angka dalam persen. Contoh: 18.5 berarti model memperkirakan ~18.5% penduduk kecamatan tersebut berada di bawah garis kemiskinan.
              </li>
              <li>
                <strong className="text-white">Poverty Delta</strong> — selisih skor dibanding tahun sebelumnya. Merah = memburuk, hijau = membaik.
              </li>
              <li>
                <strong className="text-white">Prediction Error (Std)</strong> — standar deviasi dari 3 run pelatihan berbeda. Kecil = prediksi konsisten.
              </li>
            </ul>
          </Section>

          <Section icon={AlertTriangle} title="Metode Estimasi: Aggregate vs Direct District (Mumtaz)">
            <p>
              Di Indonesia, <strong className="text-white">tidak ada data kemiskinan resmi tingkat kecamatan</strong> yang dipublikasikan secara konsisten. BPS hanya merilis angka di tingkat Kabupaten/Kota. Oleh karena itu, aplikasi ini menyajikan dua jenis estimasi tingkat kecamatan:
            </p>
            <div className="space-y-3 mt-3">
              <div className="bg-white/5 border border-white/10 p-3 rounded">
                <h4 className="text-white font-bold text-[11px] mb-1">1. Estimasi Aggregate (Model Deep Learning Utama)</h4>
                <p className="text-[11px] text-white/70 leading-relaxed mb-1">
                  Ini adalah hasil prediksi dari model AI (GRU J5_FULL). Karena tidak ada target angka kecamatan untuk diajarkan ke AI, model dilatih menggunakan pendekatan <strong>Aggregate Weak Supervision</strong>.
                </p>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  <strong>Cara Perhitungan:</strong> Model menebak angka kemiskinan untuk setiap kecamatan secara independen berdasarkan citra satelitnya. Kemudian, tebakan seluruh kecamatan di dalam satu kabupaten tersebut <em>dirata-ratakan</em> (di-aggregate). Jika rata-ratanya meleset dari data resmi BPS kabupaten, model akan dihukum dan memperbaiki tebakan kecamatannya secara iteratif hingga selaras.
                </p>
              </div>
              
              <div className="bg-white/5 border border-white/10 p-3 rounded">
                <h4 className="text-white font-bold text-[11px] mb-1">2. Estimasi Direct District (Mumtaz / Benchmark)</h4>
                <p className="text-[11px] text-white/70 leading-relaxed mb-1">
                  Ini adalah metode pengujian pembanding (baseline eksperimen). Metode ini mengasumsikan bahwa setiap kecamatan memiliki angka kemiskinan yang <strong>sama persis</strong> dengan angka kabupatennya (Supervisi Langsung).
                </p>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  <strong>Cara Perhitungan:</strong> Jika BPS merilis angka kemiskinan Kabupaten Gresik adalah 11%, maka metode ini secara kaku menganggap semua kecamatan di Gresik pasti kemiskinannya 11%, terlepas dari apakah kecamatan tersebut adalah pusat industri maju atau pedesaan kumuh.
                </p>
              </div>
            </div>
            <p className="text-yellow-400/70 text-[10px] mt-2">
              Kedua metode ini adalah estimasi matematis. Gunakan sebagai pisau analisis spasial, bukan sebagai pencacahan penduduk absolut.
            </p>
          </Section>

          <Section icon={MapPin} title="Cakupan Wilayah & Keterbatasan NLP">
            <p>
              Model mencakup <strong className="text-white">663 kecamatan di seluruh Jawa Timur</strong> untuk fitur citra satelit. Namun data berita dan NLP hanya tersedia untuk 3 wilayah studi:
            </p>
            <ul className="list-disc pl-4 space-y-1.5">
              <li><strong className="text-white">Surabaya</strong> — 31 kecamatan</li>
              <li><strong className="text-white">Gresik</strong> — 17 kecamatan</li>
              <li><strong className="text-white">Bangkalan</strong> — 17 kecamatan</li>
            </ul>
            <p>
              Di luar 65 kecamatan ini, tab XAI hanya menampilkan kontribusi fitur citra satelit (PCD/IMAGE). Event score NLP tidak tersedia untuk kecamatan lain di Jawa Timur.
            </p>
          </Section>

          <Section icon={Satellite} title="Fitur Citra Satelit (PCD)">
            <p>
              Fitur spasial-temporal dihitung dari citra satelit multitemporal (~30 m/pixel) per kecamatan per tahun (2018–2026):
            </p>
            <ul className="list-disc pl-4 space-y-1.5">
              <li><Tag>NDBI</Tag> <strong className="text-white">Built-up Index</strong> — kepadatan area terbangun. <em>Driver terkuat model (SHAP #1).</em></li>
              <li><Tag>NTL</Tag> <strong className="text-white">Night-Time Light</strong> — cahaya malam dari satelit VIIRS. Proxy aktivitas ekonomi.</li>
              <li><Tag>NDVI</Tag> <strong className="text-white">Vegetation Index</strong> — kerapatan vegetasi. Tinggi di lahan pertanian/hutan.</li>
              <li><Tag>NDWI</Tag> <strong className="text-white">Water Index</strong> — keberadaan air permukaan (sungai, tambak, lahan basah).</li>
              <li><Tag>VANUI</Tag> <strong className="text-white">Urban Index</strong> — kombinasi NTL dan NDVI untuk mengukur derajat urbanisasi.</li>
            </ul>
            <p className="text-white/40 text-[11px]">Sumber: Sentinel-2 (optical), VIIRS DNLR (NTL), dataset temporal 2018–2026.</p>
          </Section>

          <Section icon={FileText} title="Fitur Teks & Berita (NLP)">
            <p>
              Berita lokal dan dokumen perencanaan (RPJMD, BPS) diproses dengan <em>Large Language Model</em> (LLM) dan IndoBERT untuk menghasilkan sinyal *event* per wilayah per tahun yang digunakan oleh model Deep Learning.
            </p>
            <div className="space-y-4 mt-3">
              <div>
                <h4 className="text-white font-bold text-[11px] mb-2">12 Topik Pemberitaan (Event Scores)</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5 pl-2 border-l-2 border-white/10">
                  <div className="text-[11px]"><Tag>Ketenagakerjaan</Tag> <span className="text-white/60">Pengangguran, PHK, upah</span></div>
                  <div className="text-[11px]"><Tag>Harga_Pangan_Inflasi</Tag> <span className="text-white/60">Sembako naik, inflasi</span></div>
                  <div className="text-[11px]"><Tag>Bencana_Kerentanan</Tag> <span className="text-white/60">Banjir, kekeringan</span></div>
                  <div className="text-[11px]"><Tag>Kesehatan</Tag> <span className="text-white/60">Akses RS, gizi buruk, stunting</span></div>
                  <div className="text-[11px]"><Tag>Pendidikan</Tag> <span className="text-white/60">Putus sekolah, biaya</span></div>
                  <div className="text-[11px]"><Tag>Perumahan_Sanitasi</Tag> <span className="text-white/60">Rumah kumuh, sanitasi</span></div>
                  <div className="text-[11px]"><Tag>Infrastruktur_Akses</Tag> <span className="text-white/60">Jalan rusak, air bersih, listrik</span></div>
                  <div className="text-[11px]"><Tag>Perlindungan_Sosial</Tag> <span className="text-white/60">Bansos, PKH, BLT</span></div>
                  <div className="text-[11px]"><Tag>Ekonomi_Lokal_UMKM</Tag> <span className="text-white/60">Pasar tradisional, UMKM</span></div>
                  <div className="text-[11px]"><Tag>Investasi_Industri</Tag> <span className="text-white/60">Pabrik baru, modal masuk</span></div>
                  <div className="text-[11px]"><Tag>Kebijakan_Anggaran</Tag> <span className="text-white/60">APBD, program pemda</span></div>
                  <div className="text-[11px]"><Tag>Konflik_Sosial</Tag> <span className="text-white/60">Kriminalitas, vandalisme</span></div>
                </div>
              </div>

              <div>
                <h4 className="text-white font-bold text-[11px] mb-1">Indikator Komposit (Atribut Berita)</h4>
                <p className="text-[11px] text-white/70 mb-1.5">Selain klasifikasi topik, setiap artikel berita diekstraksi nilai kualitatifnya yang kemudian diagregasi menjadi fitur komposit:</p>
                <ul className="list-disc pl-4 space-y-1.5 text-[11px] text-white/70">
                  <li><Tag>Sentiment</Tag> Sentimen artikel (Negative, Neutral, Positive, Mixed).</li>
                  <li><Tag>Severity</Tag> Tingkat keparahan kejadian (Low, Medium, High).</li>
                  <li><Tag>Poverty Relevance</Tag> Kaitan dengan kemiskinan (Direct, Indirect, None).</li>
                  <li><Tag>distress_share</Tag> <strong className="text-white">Proporsi Berita Negatif</strong> — Dihitung dari rasio jumlah berita dengan <em>Sentiment = Negative</em> yang digabungkan dengan bobot keparahan kejadian di suatu daerah. Semakin tinggi nilainya, semakin banyak kejadian merugikan di wilayah tersebut pada tahun tersebut.</li>
                </ul>
              </div>
            </div>
            <p className="text-white/40 text-[11px] mt-2">
              RAG corpus: RPJMD + BPS + berita lokal + narasi SHAP XAI (71.053 chunks). Generator: Qwen2.5-7B-Instruct (RAGAS faithfulness 0.893).
            </p>
          </Section>

          <Section icon={Brain} title="Model Produksi: GRU J5_FULL">
            <p>
              Model yang digunakan adalah <strong className="text-white">GRU (Gated Recurrent Unit)</strong> skenario <Tag>J5_FULL</Tag> (full multimodal):
            </p>
            <ul className="list-disc pl-4 space-y-1.5">
              <li>Input: fitur PCD tabular + embedding CNN citra satelit (32-dim) + 12 fitur NLP event score topik berita</li>
              <li>Arsitektur: GRU temporal per kecamatan (urutan 2018→2026) + agregasi ke target BPS kabupaten</li>
              <li>Performa test gabungan 2024–2025: <strong className="text-white">RMSE ≈ 0.78 poin%</strong>, R² ≈ 0.964, Spearman ≈ 0.989</li>
              <li>Dipilih dari ablasi 9 skenario × 4 model berdasarkan validation RMSE 2023</li>
            </ul>
            <p>
              Skenario J5 mencakup seluruh 663 kecamatan Jawa Timur. Spearman 0.989 berarti <em>ranking</em> kemiskinan antar-kecamatan hampir sempurna — sangat andal untuk prioritisasi wilayah meski MAE absolut dekat baseline persistence.
            </p>
          </Section>

          <Section icon={BarChart2} title="XAI: Interpretasi Faktor (SHAP)">
            <p>
              Tab XAI menampilkan kontribusi fitur terhadap prediksi menggunakan <strong className="text-white">SHAP (SHapley Additive exPlanations)</strong>:
            </p>
            <ul className="list-disc pl-4 space-y-1.5">
              <li><span className="text-red-400 font-medium">Bar merah (nilai positif)</span> — fitur ini <em>menaikkan</em> estimasi kemiskinan kecamatan tersebut</li>
              <li><span className="text-green-400 font-medium">Bar hijau (nilai negatif)</span> — fitur ini <em>menurunkan</em> estimasi kemiskinan</li>
              <li>Panjang bar = besarnya kontribusi dalam satuan poin persen</li>
            </ul>
            <div className="bg-yellow-500/10 border border-yellow-500/20 p-3 rounded-lg mt-2">
              <p className="text-yellow-400/90 text-[12px] font-medium">Perhatian: SHAP bukan bukti kausal</p>
              <p className="text-yellow-400/70 text-[11px] mt-1">
                Nilai SHAP menjelaskan <em>prediksi model</em>, bukan hubungan sebab-akibat dengan kemiskinan nyata. NDBI tinggi membuat model memprediksi kemiskinan lebih tinggi — tapi bukan berarti bangunan padat <em>menyebabkan</em> kemiskinan. Ini adalah penjelasan model, bukan penjelasan realitas sosial.
              </p>
            </div>
          </Section>

          <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-lg flex gap-3">
            <AlertTriangle size={20} className="text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-red-400">Batasan & Disclaimer</h4>
              <ul className="text-sm text-red-400/80 space-y-1 list-disc pl-4">
                <li>Semua nilai adalah <strong>estimasi model</strong>, bukan data resmi BPS atau pemerintah.</li>
                <li>Prediksi 2025 dan 2026 adalah ekstrapolasi — tidak ada BPS sebagai pembanding.</li>
                <li>Event score NLP hanya valid untuk 65 kecamatan di 3 kota studi.</li>
                <li>Tidak cocok sebagai dasar keputusan kebijakan publik tunggal tanpa validasi lapangan.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
