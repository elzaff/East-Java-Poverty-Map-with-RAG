import React, { useEffect, useState, useMemo } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { ScenarioRun } from '../types';
import { fetchScenarioRuns } from '../api';
import { twMerge } from 'tailwind-merge';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface ModelExplorerProps {
  onClose: () => void;
  activeRun: ScenarioRun | null;
  onRunChange: (run: ScenarioRun) => void;
}

const MODEL_GROUPS = ['GRU', 'MLP', 'TCN', 'TRANSFORMER'];

export function ModelExplorer({ onClose, activeRun, onRunChange }: ModelExplorerProps) {
  const [activeTab, setActiveTab] = useState<'aggregate' | 'mumtaz'>('aggregate');
  const [runs, setRuns] = useState<ScenarioRun[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string>('ALL');

  useEffect(() => {
    fetchScenarioRuns().then(setRuns);
  }, []);

  const metrics = useMemo(() => runs.filter(run => run.method === activeTab && run.metrics), [runs, activeTab]);

  const groups = useMemo(() => {
    const seen = new Set<string>();
    metrics.forEach(m => seen.add(m.model));
    return ['ALL', ...MODEL_GROUPS.filter(g => seen.has(g))];
  }, [metrics]);

  const filtered = useMemo(() => {
    const rows = selectedGroup === 'ALL' ? metrics : metrics.filter(m => m.model === selectedGroup);
    return [...rows].sort((a, b) => (a.metrics?.mae ?? 999) - (b.metrics?.mae ?? 999));
  }, [metrics, selectedGroup]);

  const chartData = useMemo(() => {
    return filtered.slice(0, 12).map(m => ({
      label: m.label.length > 28 ? m.label.slice(0, 28) + '...' : m.label,
      mae: m.metrics?.mae ?? 0,
      active: activeRun?.id === m.id,
      hasShap: m.has_shap_kecamatan || m.has_shap_kabupaten || m.has_shap_global,
    }));
  }, [filtered, activeRun]);

  const activateRun = (run: ScenarioRun) => {
    onRunChange(run);
    onClose();
  };

  return (
    <div className="absolute inset-0 bg-[#0a0a0b]/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 sm:p-8">
      <div className="bg-[#111114] border border-white/10 rounded-lg shadow-2xl w-full max-w-6xl max-h-full flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-4 sm:p-6 border-b border-white/10 flex items-center justify-between bg-transparent">
          <div className="flex items-center gap-3">
            <div className="text-[10px] uppercase font-bold tracking-widest text-[#e4e4e7]">
              <h2 className="text-xl font-sans font-bold text-white tracking-tight leading-none mb-1">Intelligence Architecture</h2>
              <p className="text-[10px] text-white/40">Semua skenario Aggregate dan Direct District | klik Tampilkan untuk memuat ke peta</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-white/40 hover:text-white hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-auto p-4 sm:p-6 custom-scrollbar space-y-6">
            <div className="flex border-b border-white/10 mb-4">
              <button
                onClick={() => setActiveTab('aggregate')}
                className={twMerge(
                  'px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2',
                  activeTab === 'aggregate' ? 'border-[#f87171] text-white' : 'border-transparent text-white/40 hover:text-white/70',
                )}
              >
                Aggregate Weak Supervision
              </button>
              <button
                onClick={() => setActiveTab('mumtaz')}
                className={twMerge(
                  'px-4 py-2 text-[11px] font-bold uppercase tracking-widest transition-colors border-b-2',
                  activeTab === 'mumtaz' ? 'border-[#fbbf24] text-[#fbbf24]' : 'border-transparent text-white/40 hover:text-white/70',
                )}
              >
                Direct District
              </button>
            </div>

            <div className={twMerge(
              'border p-4 rounded-lg space-y-3',
              activeTab === 'aggregate' ? 'bg-[#f87171]/5 border-[#f87171]/20' : 'bg-[#fbbf24]/5 border-[#fbbf24]/20',
            )}>
              <h3 className={twMerge(
                'text-[10px] mb-2 font-bold tracking-widest uppercase',
                activeTab === 'aggregate' ? 'text-[#f87171]' : 'text-[#fbbf24]',
              )}>
                {activeTab === 'aggregate' ? 'AGGREGATE WEAK SUPERVISION' : 'DIRECT DISTRICT'}
              </h3>
              <p className="text-sm text-white/70 leading-relaxed font-sans">
                {activeTab === 'aggregate'
                  ? 'Mode utama memprediksi tingkat kecamatan, lalu agregasi ke kabupaten untuk evaluasi. Skenario J mencakup Jawa Timur; skenario N hanya wilayah NLP.'
                  : 'Mode benchmark melatih prediksi langsung tingkat kabupaten. Pada tampilan kecamatan, angka kabupaten diproyeksikan ke kecamatan dalam kabupaten yang sama.'}
              </p>
              <p className="text-xs text-white/45">
                Run aktif: {activeRun ? `${activeRun.method} | ${activeRun.model} | ${activeRun.scenario} | ${activeRun.aggregation_weight}` : '-'}
              </p>
            </div>

            <div className="flex gap-2 flex-wrap">
              {groups.map(g => (
                <button
                  key={g}
                  onClick={() => setSelectedGroup(g)}
                  className={twMerge(
                    'px-3 py-1 text-[10px] font-mono uppercase tracking-widest rounded border transition-colors',
                    selectedGroup === g
                      ? 'bg-red-500/20 border-red-500/50 text-red-400'
                      : 'bg-white/5 border-white/10 text-white/40 hover:text-white/70',
                  )}
                >
                  {g}
                </button>
              ))}
            </div>

            {chartData.length > 0 && (
              <div>
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">Perbandingan Error MAE (Semakin Rendah Semakin Baik)</h3>
                <div className="h-56 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 0, right: 40, left: 10, bottom: 0 }}>
                      <XAxis type="number" domain={[0, 'auto']} tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
                      <YAxis dataKey="label" type="category" width={180} tick={{ fontSize: 8, fill: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }} formatter={(v: any) => [Number(v).toFixed(3), 'MAE']} />
                      <Bar dataKey="mae" radius={[0, 2, 2, 0]}>
                        {chartData.map((entry, i) => (
                          <Cell key={i} fill={entry.active ? '#ef4444' : entry.hasShap ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-bold text-white/40 uppercase tracking-widest">
                    <th className="p-3 font-medium">Model</th>
                    <th className="p-3 font-medium">Skenario</th>
                    <th className="p-3 font-medium">Weight</th>
                    <th className="p-3 font-medium text-right">R2</th>
                    <th className="p-3 font-medium text-right">MAE</th>
                    <th className="p-3 font-medium text-right">RMSE</th>
                    <th className="p-3 font-medium text-right">Spearman</th>
                    <th className="p-3 font-medium">SHAP</th>
                    <th className="p-3 font-medium">Peta</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-white/80">
                  {filtered.map(row => (
                    <tr
                      key={row.id}
                      className={twMerge(
                        'border-b border-white/5 hover:bg-white/5 transition-colors',
                        activeRun?.id === row.id && 'bg-red-500/5',
                      )}
                    >
                      <td className="p-3 font-medium font-mono text-[11px] flex items-center gap-2">
                        {activeRun?.id === row.id && <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />}
                        {row.model}
                      </td>
                      <td className="p-3 text-[11px] text-white/60">{row.scenario}</td>
                      <td className="p-3 text-[11px] text-white/50">{row.aggregation_weight}</td>
                      <td className="p-3 text-right font-mono text-[11px]">{row.metrics?.r2 != null ? row.metrics.r2.toFixed(4) : '-'}</td>
                      <td className="p-3 text-right font-mono text-[11px]">{row.metrics?.mae != null ? row.metrics.mae.toFixed(3) : '-'}</td>
                      <td className="p-3 text-right font-mono text-[11px]">{row.metrics?.rmse != null ? row.metrics.rmse.toFixed(3) : '-'}</td>
                      <td className="p-3 text-right font-mono text-[11px]">{row.metrics?.spearman != null ? row.metrics.spearman.toFixed(4) : '-'}</td>
                      <td className="p-3">
                        <span className={twMerge(
                          'inline-flex items-center gap-1 text-[9px] font-mono px-2 py-0.5 rounded border uppercase tracking-widest',
                          row.has_shap_kecamatan || row.has_shap_kabupaten || row.has_shap_global
                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                            : 'bg-white/5 border-white/10 text-white/30',
                        )}>
                          {row.has_shap_kecamatan || row.has_shap_kabupaten || row.has_shap_global ? 'Ada' : 'Belum'}
                        </span>
                      </td>
                      <td className="p-3">
                        <button
                          onClick={() => activateRun(row)}
                          className={twMerge(
                            'inline-flex items-center gap-1 text-[9px] font-mono px-2 py-1 rounded border uppercase tracking-widest transition-colors',
                            activeRun?.id === row.id
                              ? 'bg-red-500/10 border-red-500/30 text-red-300'
                              : 'bg-white/5 border-white/10 text-white/50 hover:text-white hover:border-white/30',
                          )}
                        >
                          {activeRun?.id === row.id && <CheckCircle2 size={11} />}
                          {activeRun?.id === row.id ? 'Aktif' : 'Tampilkan'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="w-80 shrink-0 bg-[#0f172a] border-l border-[#1e293b] p-6 overflow-y-auto custom-scrollbar shadow-xl z-10 flex flex-col gap-8">
            <div className="space-y-3">
              <h3 className="text-[10px] text-[#38bdf8] font-bold tracking-widest uppercase flex items-center gap-2 border-b border-[#1e293b] pb-2">
                Skenario Data
              </h3>
              <div className="text-[11px] text-slate-300 font-sans space-y-2">
                <p><strong className="text-white">Seri J:</strong> seluruh Jawa Timur.</p>
                <p><strong className="text-white">Seri N:</strong> hanya Surabaya, Gresik, Bangkalan.</p>
                <p><strong className="text-white">J5 weight:</strong> Aggregate punya varian w_equal, w_density, w_luas, w_ntl, dan w_poi.</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] text-[#a78bfa] font-bold tracking-widest uppercase flex items-center gap-2 border-b border-[#1e293b] pb-2">
                Algoritma Model
              </h3>
              <div className="text-[11px] text-slate-300 font-sans space-y-2">
                <p><strong className="text-white">GRU:</strong> Gated Recurrent Unit.</p>
                <p><strong className="text-white">MLP:</strong> Multilayer Perceptron.</p>
                <p><strong className="text-white">TCN:</strong> Temporal ConvNet.</p>
                <p><strong className="text-white">TRANSFORMER:</strong> Self-Attention.</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] text-[#fbbf24] font-bold tracking-widest uppercase flex items-center gap-2 border-b border-[#1e293b] pb-2">
                Catatan SHAP
              </h3>
              <div className="text-[11px] text-slate-300 font-sans space-y-2 leading-relaxed">
                <p>Panel XAI memakai SHAP lokal jika tersedia, lalu fallback ke SHAP global hasil batch untuk run aktif.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
