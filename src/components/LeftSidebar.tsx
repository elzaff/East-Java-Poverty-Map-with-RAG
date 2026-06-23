import React from 'react';
import { LayerId } from '../types';
import { Filter, Eye } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface LayerMeta {
  stops: string[];
  desc: string;
  ticks: { pct: number; label: string }[];
  unit: string;
}

const POVERTY_STOPS = ['#ffe44d','#ffd000','#ffb800','#ffa000','#ff7700','#ff4400','#ee1111','#cc0000','#880000','#2d0000'];

const LAYER_META_BASE: Record<string, LayerMeta> = {
  poverty_risk_score: {
    stops: POVERTY_STOPS,
    desc: 'Estimasi persentase penduduk miskin per kecamatan. Kuning = rendah, merah gelap = tinggi.',
    ticks: [
      { pct: 0,   label: '0%' },
      { pct: 25,  label: '2.5%' },
      { pct: 50,  label: '5%' },
      { pct: 75,  label: '7.5%' },
      { pct: 100, label: '≥10%' },
    ],
    unit: 'Dipotong pada 10% — area >10% tampil gelap pekat',
  },
  ndvi: {
    stops: ['#7c3a00','#a16207','#ca8a04','#84cc16','#22c55e','#166534'],
    desc: 'Kehijauan lahan dari citra satelit.',
    ticks: [
      { pct: 0,   label: '0' },
      { pct: 50,  label: '0.25' },
      { pct: 100, label: '0.5+' },
    ],
    unit: 'NDVI Index',
  },
  ndbi: {
    stops: ['#0d0d0d','#1c1917','#78350f','#b45309','#f59e0b','#fde68a'],
    desc: 'Kepadatan area terbangun dari citra satelit.',
    ticks: [
      { pct: 0,   label: '-0.2' },
      { pct: 50,  label: '-0.05' },
      { pct: 100, label: '0.1+' },
    ],
    unit: 'NDBI Index',
  },
  ndwi: {
    stops: ['#451a03','#92400e','#38bdf8','#0284c7','#075985','#0c4a6e'],
    desc: 'Indeks kebasahan lahan.',
    ticks: [
      { pct: 0,   label: '-0.4' },
      { pct: 50,  label: '-0.2' },
      { pct: 100, label: '0' },
    ],
    unit: 'NDWI Index',
  },
  ntl: {
    stops: ['#0d0d0b','#1a1a00','#3d2b00','#f59e0b','#fde047','#ffffff'],
    desc: 'Intensitas cahaya malam dari satelit VIIRS.',
    ticks: [
      { pct: 0,   label: '0' },
      { pct: 50,  label: '12.5' },
      { pct: 100, label: '25+' },
    ],
    unit: 'Radiance',
  },
  vanui: {
    stops: ['#0d0d0d','#2e1065','#6d28d9','#a855f7','#e879f9','#fdf4ff'],
    desc: 'Indeks urbanisasi gabungan cahaya malam dan vegetasi.',
    ticks: [
      { pct: 0,   label: '0' },
      { pct: 50,  label: '10' },
      { pct: 100, label: '20+' },
    ],
    unit: 'VANUI Index',
  },
};

const LAYER_META: Record<string, LayerMeta> = {
  ...LAYER_META_BASE,
  poverty_delta: {
    stops: ['#166534','#16a34a','#4ade80','#f0fdf4','#fee2e2','#ef4444','#7c2d12'],
    desc: 'Perubahan kemiskinan dibanding tahun sebelumnya. Hijau = membaik (turun), merah = memburuk (naik).',
    ticks: [
      { pct: 0,   label: '−2pp' },
      { pct: 50,  label: '±0' },
      { pct: 100, label: '+2pp' },
    ],
    unit: 'Dijepit ±2 poin persentase (pp)',
  },
} as Record<string, LayerMeta>;

const LAYER_LIST = [
  { id: 'poverty_risk_score', label: 'Kemiskinan' },
  { id: 'poverty_delta',      label: 'Perubahan YoY' },
  { id: 'ndvi',               label: 'Vegetasi' },
  { id: 'ndbi',               label: 'Bangunan' },
  { id: 'ndwi',               label: 'Air' },
  { id: 'ntl',                label: 'Cahaya Malam' },
  { id: 'vanui',              label: 'Urbanisasi' },
];

interface LeftSidebarProps {
  activeLayer: LayerId;
  setActiveLayer: (l: LayerId) => void;
  cityFilter: string;
  setCityFilter: (c: string) => void;
  year: number;
  viewLevel: 'kecamatan' | 'kabupaten';
  setViewLevel: (v: 'kecamatan' | 'kabupaten') => void;
}

export function LeftSidebar({
  activeLayer, setActiveLayer,
  cityFilter, setCityFilter,
  year, viewLevel, setViewLevel
}: LeftSidebarProps) {

  const eastJavaRegencies = [
    { value: 'All',        label: 'Semua Jawa Timur' },
    { value: 'Surabaya',   label: 'Kota Surabaya' },
    { value: 'Gresik',     label: 'Kab. Gresik' },
    { value: 'Bangkalan',  label: 'Kab. Bangkalan' },
    { value: 'Sidoarjo',   label: 'Kab. Sidoarjo' },
    { value: 'Malang',     label: 'Kab. Malang' },
    { value: 'Jember',     label: 'Kab. Jember' },
    { value: 'Banyuwangi', label: 'Kab. Banyuwangi' },
    { value: 'Kediri',     label: 'Kab. Kediri' },
    { value: 'Mojokerto',  label: 'Kab. Mojokerto' },
    { value: 'Sampang',    label: 'Kab. Sampang' },
    { value: 'Pamekasan',  label: 'Kab. Pamekasan' },
    { value: 'Sumenep',    label: 'Kab. Sumenep' },
  ];

  const meta = LAYER_META[activeLayer];

  return (
    <div className="w-64 sm:w-72 h-full bg-[#111114] border-r border-white/10 flex flex-col z-40 shrink-0 custom-scrollbar overflow-y-auto">

      {/* View Level */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-[10px] font-bold text-white/40 mb-3 flex items-center gap-2 uppercase tracking-widest">
          <Eye size={14} /> Tampilan Wilayah
        </h3>
        <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-lg border border-white/5">
          {(['kecamatan', 'kabupaten'] as const).map(v => (
            <button
              key={v}
              onClick={() => setViewLevel(v)}
              className={twMerge(
                "px-3 py-2 rounded text-[10px] font-semibold uppercase tracking-wider transition-all capitalize",
                viewLevel === v
                  ? "bg-red-500/20 text-red-300 border border-red-500/40"
                  : "text-white/40 hover:text-white/70 border border-transparent"
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      {/* Region Filter */}
      <div className="p-4 border-b border-white/10">
        <h3 className="text-[10px] font-bold text-white/40 mb-3 flex items-center gap-2 uppercase tracking-widest">
          <Filter size={14} /> Filter Wilayah
        </h3>
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="w-full bg-black/40 border border-white/10 text-white/80 text-xs rounded px-3 py-2 focus:outline-none focus:border-red-500/50 cursor-pointer hover:border-white/20"
        >
          {eastJavaRegencies.map(reg => (
            <option key={reg.value} value={reg.value}>{reg.label}</option>
          ))}
        </select>
      </div>

      {/* Gradient Legend + compact layer switcher */}
      <div className="p-4 flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
            Indikator · {year}
          </h3>
          {/* Compact layer pills */}
          <div className="flex gap-1 flex-wrap">
            {LAYER_LIST.map(item => {
              const isActive = activeLayer === item.id;
              const m = LAYER_META[item.id];
              const accentColor = m?.stops[3] ?? '#888';
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveLayer(item.id as LayerId)}
                  title={item.label}
                  className={twMerge(
                    "px-2 py-0.5 text-[9px] rounded-full border transition-all font-medium",
                    isActive
                      ? "text-white border-white/30 bg-white/10"
                      : "text-white/40 border-white/10 hover:text-white/70 hover:border-white/20"
                  )}
                  style={isActive ? { borderColor: accentColor + 'aa', background: accentColor + '22' } : {}}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Gradient bar */}
        {meta && (
          <div>
            <div
              className="h-4 w-full rounded-md shadow-inner"
              style={{ background: `linear-gradient(to right, ${meta.stops.join(', ')})` }}
            />
            <div className="relative mt-1 h-5">
              {meta.ticks.map((t, i) => (
                <span
                  key={i}
                  className="absolute text-[9px] font-mono text-white/50 -translate-x-1/2"
                  style={{ left: `${t.pct}%` }}
                >
                  {t.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {meta && (
          <div className="space-y-1.5">
            <p className="text-[10px] text-white/40 leading-relaxed">{meta.desc}</p>
            <p className="text-[9px] text-white/20 font-mono">{meta.unit}</p>
          </div>
        )}
      </div>
    </div>
  );
}
