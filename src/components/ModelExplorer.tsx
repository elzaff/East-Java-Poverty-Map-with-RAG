import React, { useEffect, useState, useMemo } from 'react';
import { X, Cpu } from 'lucide-react';
import { ModelMetric } from '../types';
import { fetchModelMetrics, fetchMumtazMetrics } from '../api';
import { twMerge } from 'tailwind-merge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ModelExplorerProps {
  onClose: () => void;
}

const MODEL_GROUPS = ['GRU', 'MLP', 'TCN', 'TRANSFORMER', 'GLOBAL_TRAIN_MEAN', 'LAST_TRAIN_YEAR'];

export function ModelExplorer({ onClose }: ModelExplorerProps) {
  const [activeTab, setActiveTab] = useState<'aggregate' | 'mumtaz'>('aggregate');
  const [aggregateMetrics, setAggregateMetrics] = useState<ModelMetric[]>([]);
  const [mumtazMetrics, setMumtazMetrics] = useState<ModelMetric[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  useEffect(() => {
    fetchModelMetrics().then(setAggregateMetrics);
    fetchMumtazMetrics().then(setMumtazMetrics);
  }, []);

  const metrics = activeTab === 'aggregate' ? aggregateMetrics : mumtazMetrics;

  const groups = useMemo(() => {
    const seen = new Set<string>();
    metrics.forEach(m => seen.add(m.model));
    return ['ALL', ...MODEL_GROUPS.filter(g => seen.has(g))];
  }, [metrics]);

  const filtered = useMemo(() => {
    if (selectedGroup === 'ALL') return metrics;
    return metrics.filter(m => m.model === selectedGroup);
  }, [metrics, selectedGroup]);

  const chartData = useMemo(() => {
    return filtered.slice(0, 12).map(m => ({
      label: m.label.length > 28 ? m.label.slice(0, 28) + '…' : m.label,
      mae: m.mae,
      r2: m.r2,
      is_production: m.is_production
    }));
  }, [filtered]);

  return (
    <div className="absolute inset-0 bg-[#0a0a0b]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-[#111114] border border-white/10 rounded-lg shadow-2xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-3">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#e4e4e7]">
              <h2 className="text-xl font-sans font-bold text-white tracking-tight leading-none mb-1">Intelligence Architecture</h2>
              <p className="text-[10px] text-white/40">MODEL ENSEMBLE BENCHMARKS — GRU J5_FULL (PRODUCTION)</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content Area */}
        <div className="flex flex-1 overflow-hidden">
          
          {/* Main Content (Left) */}
          <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar space-y-6">
                     {/* Tabs */}
            <div className="flex border-b border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('aggregate')}
                className={twMerge(
                  "px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2",
                  activeTab === 'aggregate' ? "border-[#f87171] text-white" : "border-transparent text-white/40 hover:text-white/70"
                )}
              >
                1. Aggregate Weak Supervision (Utama)
              </button>
              <button
                onClick={() => setActiveTab('mumtaz')}
                className={twMerge(
                  "px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2",
                  activeTab === 'mumtaz' ? "border-[#fbbf24] text-[#fbbf24]" : "border-transparent text-white/40 hover:text-white/70"
                )}
              >
                2. Direct District / Mumtaz (Benchmark)
              </button>
            </div>

            {/* Architecture description */}
            {activeTab === 'aggregate' ? (
              <div className="bg-[#f87171]/5 border border-[#f87171]/20 p-4 rounded-lg space-y-4">
                <h3 className="text-[10px] text-[#f87171] mb-2 font-bold tracking-widest uppercase">AGGREGATE WEAK SUPERVISION (UTAMA)</h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans">
                  Integrasi multimodal dari data spasial (PCD), citra satelit (CNN), dan teks berita (NLP). Model menebak kemiskinan di tingkat kecamatan secara mandiri, lalu diagregasi secara populasi untuk dicocokkan dengan label target BPS tingkat kabupaten.
                </p>
                
                <div className="border-t border-[#f87171]/20 pt-3">
                  <h3 className="text-[10px] text-[#f87171] mb-2 font-bold tracking-widest uppercase">MODEL PADA PETA AGGREGATE: GRU J5_FULL</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-sans">
                    Arsitektur GRU digunakan karena kemampuannya membaca pola sekuensial deret waktu. Model ini dipilih untuk sistem produksi utama karena secara konsisten menyaingi <em>baseline</em> pada evaluasi MAE, memberikan resolusi tingkat kecamatan secara valid, serta <em>explainability</em> faktor ekonomi.
                  </p>
                </div>

                <div className="border-t border-[#f87171]/20 pt-3">
                  <h3 className="text-[10px] text-[#f87171] mb-2 font-bold tracking-widest uppercase">MENGAPA R² SANGAT TINGGI TETAPI ERROR (MAE) MASIH CUKUP BESAR?</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-sans">
                    Nilai R² yang fantastis (&gt;0.9) membuktikan model sangat cerdas dalam memetakan <strong>kesenjangan struktural absolut</strong> antar wilayah (misalnya: dengan mudah membedakan kota maju seperti Surabaya vs area rentan seperti Sampang). Namun, menebak pergeseran koma persentase angka kemiskinan tahun-ke-tahun secara persis sangatlah rentan fluktuasi lokal, yang membuat nilai absolut Error MAE tetap menyumbang angka yang terbilang lumayan.
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-[#fbbf24]/5 border border-[#fbbf24]/20 p-4 rounded-lg space-y-4">
                <h3 className="text-[10px] text-[#fbbf24] mb-2 font-bold tracking-widest uppercase">VALIDASI BENCHMARK MUMTAZ (DIRECT DISTRICT)</h3>
                <p className="text-sm text-white/70 leading-relaxed font-sans">
                  Ini adalah skenario pengujian komparatif. Berbeda dengan Aggregate, metode Mumtaz memaksakan asumsi heuristik bahwa <em>semua kecamatan memiliki angka tingkat kemiskinan yang sama persis dengan kabupatennya</em>. Model kemudian dilatih langsung pada tingkat kabupaten (hanya 304 observasi).
                </p>
                
                <div className="border-t border-[#fbbf24]/20 pt-3">
                  <h3 className="text-[10px] text-[#fbbf24] mb-2 font-bold tracking-widest uppercase">MODEL PADA PETA MUMTAZ: MLP J3_PCD_IMAGE</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-sans">
                    Saat Anda mengaktifkan mode Mumtaz di peta utama, layar merender tebakan <strong>MLP J3_PCD_IMAGE</strong>. Mengapa? Karena pada ukuran dataset Mumtaz yang sangat kerdil ini (304 data), algoritma simpel seperti Multilayer Perceptron (MLP) justru mengungguli arsitektur kompleks GRU. Meski demikian, MLP tidak dipakai sebagai sistem utama karena ia abai pada fitur deret waktu.
                  </p>
                </div>

                <div className="border-t border-[#fbbf24]/20 pt-3">
                  <h3 className="text-[10px] text-[#fbbf24] mb-2 font-bold tracking-widest uppercase">MENGAPA R² SANGAT TINGGI TETAPI ERROR (MAE) MASIH CUKUP BESAR?</h3>
                  <p className="text-sm text-white/70 leading-relaxed font-sans">
                    Sama seperti Aggregate, R² yang stabil tinggi menandakan model MLP ini mampu mengurutkan (<em>ranking</em>) kabupaten dari yang terluas hingga termiskin secara presisi struktural. Tetapi, pemaksaan asumsi bahwa kemiskinan di setiap kecamatan adalah seragam justru membutakan model dari variasi riil lapangan, menyebabkan deviasi Error Absolut (MAE) membengkak ketimbang Aggregate.
                  </p>
                </div>
              </div>
            )}

          {/* Group filter */}
          <div className="flex gap-2 flex-wrap">
            {groups.map(g => (
              <button
                key={g}
                onClick={() => setSelectedGroup(g)}
                className={twMerge(
                  "px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded border transition-colors",
                  selectedGroup === g
                    ? "bg-red-500/20 border-red-500/50 text-red-400"
                    : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
                )}
              >
                {g}
              </button>
            ))}
          </div>

          {/* R² Bar Chart */}
          {chartData.length > 0 && (
            <div>
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Perbandingan Error MAE (Semakin Rendah Semakin Baik)</h3>
              <div className="h-56 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                    <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
                    <YAxis dataKey="label" type="category" width={180} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                      formatter={(v: any) => [Number(v).toFixed(3), 'MAE']}
                    />
                    <Bar dataKey="mae" radius={[0, 2, 2, 0]}>
                      {chartData.map((entry, i) => (
                        <Cell key={i} fill={entry.is_production ? '#ef4444' : 'rgba(255,255,255,0.2)'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Metrics Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                  <th className="p-3 font-medium">Model</th>
                  <th className="p-3 font-medium">Skenario</th>
                  <th className="p-3 font-medium text-right">R² ↑</th>
                  <th className="p-3 font-medium text-right">MAE ↓</th>
                  <th className="p-3 font-medium text-right">RMSE ↓</th>
                  <th className="p-3 font-medium text-right">Spearman</th>
                  <th className="p-3 font-medium text-right">MAPE%</th>
                  <th className="p-3 font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="text-sm text-white/80">
                {filtered.map((row, i) => (
                  <tr
                    key={i}
                    className={twMerge(
                      "border-b border-white/5 hover:bg-white/5 transition-colors",
                      row.is_production && "bg-red-500/5"
                    )}
                  >
                    <td className="p-3 font-medium font-mono text-[11px] flex items-center gap-2">
                      {row.is_production && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                      {row.model}
                    </td>
                    <td className="p-3 text-[11px] text-white/60">{row.scenario}</td>
                    <td className={twMerge("p-3 text-right font-mono text-[11px]", row.is_production ? "text-red-400 font-bold" : (row.r2 != null && row.r2 > 0.9) ? "text-white" : "text-white/50")}>
                      {row.r2 != null ? row.r2.toFixed(4) : '-'}
                    </td>
                    <td className="p-3 text-right font-mono text-[11px]">{row.mae != null ? row.mae.toFixed(3) : '-'}</td>
                    <td className="p-3 text-right font-mono text-[11px]">{row.rmse != null ? row.rmse.toFixed(3) : '-'}</td>
                    <td className="p-3 text-right font-mono text-[11px]">{row.spearman != null ? row.spearman.toFixed(4) : '-'}</td>
                    <td className="p-3 text-right font-mono text-[11px]">{row.mape != null ? row.mape.toFixed(2) : '-'}</td>
                    <td className="p-3">
                      {row.is_production ? (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border bg-red-500/10 border-red-500/30 text-red-400 uppercase tracking-widest">
                          PRODUKSI
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border bg-white/5 border-white/10 text-white/30 uppercase tracking-widest">
                          Benchmark
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="bg-black/40 border border-white/10 p-4 rounded-lg mt-6">
              <h4 className="text-[10px] font-bold text-white/40 flex justify-between uppercase tracking-widest">
                <span>PIPELINE INFERENCE MASA DEPAN (USULAN)</span>
                <span className="text-green-500">ARSITEKTUR SCALABLE</span>
              </h4>
              <p className="mt-2 text-xs text-white/50 font-sans leading-relaxed">
                Implementasi di masa depan untuk memindahkan komputasi berat (prediksi DL, embedding citra, inferensi LLM RAG, generasi SHAP) ke GPU serverless (misal: Modal), sehingga memisahkan beban query model dari layer frontend aplikasi web.
              </p>
            </div>
          </div>
          </div>

          {/* Right Sidebar Glossary */}
          <div className="w-80 shrink-0 bg-[#0f172a] border-l border-[#1e293b] p-6 overflow-y-auto custom-scrollbar shadow-xl z-10 flex flex-col gap-8">
            
            <div className="space-y-3">
              <h3 className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase flex items-center gap-2 border-b border-[#1e293b] pb-2">
                Skenario Data
              </h3>
              <div className="text-[11px] text-slate-300 font-sans space-y-2">
                <div className="pb-1">
                  <p className="text-[#38bdf8] font-bold mb-1">Kode Evaluasi (Seri J vs N):</p>
                  <p>• <strong className="text-white">Seri J:</strong> Evaluasi di seluruh Jawa Timur (38 Kab/Kota).</p>
                  <p>• <strong className="text-white">Seri N:</strong> Evaluasi khusus di 3 kota NLP (Surabaya, Gresik, Bangkalan).</p>
                </div>
                <div className="pt-2 border-t border-[#1e293b]">
                  <p className="text-[#38bdf8] font-bold mb-1">Kode Kombinasi Fitur (1 - 5):</p>
                  <p>• <strong className="text-white">1_PCD:</strong> Spasial (Data tabular numerik, spt tingkat cahaya/vegetasi)</p>
                  <p>• <strong className="text-white">2_IMAGE:</strong> Citra Satelit (Pola visual keruangan ekstraksi CNN)</p>
                  <p>• <strong className="text-white">3_PCD_IMAGE:</strong> Spasial + Citra Satelit</p>
                  <p>• <strong className="text-white">4_PCD_NLP:</strong> Spasial + Teks Berita</p>
                  <p>• <strong className="text-white">5_FULL:</strong> Multimodal Penuh (Spasial + Citra + Berita)</p>
                </div>
                <div className="pt-2 border-t border-[#1e293b]">
                  <p>• <strong className="text-white">N1_NLP:</strong> Hanya Teks Berita</p>
                  <p>• <strong className="text-white">N2 / N3 / N4:</strong> Kombinasi fitur ablasi khusus untuk area NLP.</p>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] text-[#a78bfa] font-bold tracking-widest uppercase flex items-center gap-2 border-b border-[#1e293b] pb-2">
                Algoritma Model
              </h3>
              <div className="text-[11px] text-slate-300 font-sans space-y-2">
                <p>• <strong className="text-white">GRU:</strong> Gated Recurrent Unit (Terbaik u/ time-series pendek)</p>
                <p>• <strong className="text-white">MLP:</strong> Multilayer Perceptron</p>
                <p>• <strong className="text-white">TCN:</strong> Temporal ConvNet</p>
                <p>• <strong className="text-white">TRANSFORMER:</strong> Self-Attention</p>
                <p className="pt-2">• <strong className="text-white">GLOBAL_TRAIN_MEAN:</strong> Baseline Rata-rata Kemiskinan Global</p>
                <p>• <strong className="text-white">LAST_TRAIN_YEAR:</strong> Baseline Persistence (Tebakan angka kemiskinan tahun lalu)</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] text-[#fbbf24] font-bold tracking-widest uppercase flex items-center gap-2 border-b border-[#1e293b] pb-2">
                Metrik Evaluasi
              </h3>
              <div className="text-[11px] text-slate-300 font-sans space-y-2 leading-relaxed">
                <p>• <strong className="text-white">MAE:</strong> Margin Error absolut (semakin rendah = semakin akurat).</p>
                <p>• <strong className="text-white">R²:</strong> Skor determinasi. Negatif jika lebih buruk dari baseline tebakan rata-rata.</p>
                <p>• <strong className="text-white">RMSE:</strong> Root Mean Square Error (Sensitif terhadap error ekstrem).</p>
                <p>• <strong className="text-white">Spearman:</strong> Akurasi ranking. 1 berarti urutan ranking kemiskinan wilayah 100% tepat.</p>
                <p>• <strong className="text-white">MAPE%:</strong> Persentase tingkat kesalahan relatif terhadap data aktual.</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] text-[#10b981] font-bold tracking-widest uppercase flex items-center gap-2 border-b border-[#1e293b] pb-2">
                Cara Memvalidasi Modelmu
              </h3>
              <div className="text-[11px] text-slate-300 font-sans space-y-2 leading-relaxed">
                <p>
                  Untuk memastikan modelmu memang akurat dan tidak terjebak di <strong>Bias Sistematis / Offset Konstan</strong>:
                </p>
                <p>
                  1. <strong className="text-white">Pastikan R² Positif & Tinggi:</strong> Jika model sekadar menebak rata-rata berulang kali secara stagnan (bias sistematis), R² akan anjlok ≤ 0.
                </p>
                <p>
                  2. <strong className="text-white">Perhatikan Spearman:</strong> Jika model hanya bermalas-malasan menyalin angka tahun sebelumnya persis tanpa belajar (offset konstan temporal), ia akan kesulitan mengidentifikasi pergeseran ranking (distribusi riil lapangan), membuat korelasi Spearman-nya statis atau rendah dibanding kenyataan.
                </p>
                <p className="text-white/60 italic mt-2 text-[10px]">
                  *Kesimpulan: Model yang sehat harus mampu mengungguli metrik baseline LAST_TRAIN_YEAR di segala parameter.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
