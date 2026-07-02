import React, { useMemo } from 'react';
import { LayerId, ScenarioRun, ScenarioMethod } from '../types';
import { Filter, Eye, SlidersHorizontal } from 'lucide-react';
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
    desc: 'Estimasi persentase penduduk miskin sesuai run model aktif.',
    ticks: [
      { pct: 0, label: '0%' },
      { pct: 25, label: '2.5%' },
      { pct: 50, label: '5%' },
      { pct: 75, label: '7.5%' },
      { pct: 100, label: '>=10%' },
    ],
    unit: 'Dipotong pada 10% - area >10% tampil gelap pekat',
  },
  ndvi: {
    stops: ['#7c3a00','#a16207','#ca8a04','#84cc16','#22c55e','#166534'],
    desc: 'Kehijauan lahan dari citra satelit.',
    ticks: [
      { pct: 0, label: '0' },
      { pct: 50, label: '0.25' },
      { pct: 100, label: '0.5+' },
    ],
    unit: 'NDVI Index',
  },
  ndbi: {
    stops: ['#0d0d0d','#1c1917','#78350f','#b45309','#f59e0b','#fde68a'],
    desc: 'Kepadatan area terbangun dari citra satelit.',
    ticks: [
      { pct: 0, label: '-0.2' },
      { pct: 50, label: '-0.05' },
      { pct: 100, label: '0.1+' },
    ],
    unit: 'NDBI Index',
  },
  ndwi: {
    stops: ['#451a03','#92400e','#38bdf8','#0284c7','#075985','#0c4a6e'],
    desc: 'Indeks kebasahan lahan.',
    ticks: [
      { pct: 0, label: '-0.4' },
      { pct: 50, label: '-0.2' },
      { pct: 100, label: '0' },
    ],
    unit: 'NDWI Index',
  },
  ntl: {
    stops: ['#0d0d0b','#1a1a00','#3d2b00','#f59e0b','#fde047','#ffffff'],
    desc: 'Intensitas cahaya malam dari satelit VIIRS.',
    ticks: [
      { pct: 0, label: '0' },
      { pct: 50, label: '12.5' },
      { pct: 100, label: '25+' },
    ],
    unit: 'Radiance',
  },
  vanui: {
    stops: ['#0d0d0d','#2e1065','#6d28d9','#a855f7','#e879f9','#fdf4ff'],
    desc: 'Indeks urbanisasi gabungan cahaya malam dan vegetasi.',
    ticks: [
      { pct: 0, label: '0' },
      { pct: 50, label: '10' },
      { pct: 100, label: '20+' },
    ],
    unit: 'VANUI Index',
  },
};

const LAYER_META: Record<string, LayerMeta> = {
  ...LAYER_META_BASE,
  poverty_delta: {
    stops: ['#166534','#16a34a','#4ade80','#f0fdf4','#fee2e2','#ef4444','#7c2d12'],
    desc: 'Perubahan kemiskinan dibanding tahun sebelumnya. Hijau = membaik, merah = memburuk.',
    ticks: [
      { pct: 0, label: '-2pp' },
      { pct: 50, label: '+/-0' },
      { pct: 100, label: '+2pp' },
    ],
    unit: 'Dijepit +/-2 poin persentase (pp)',
  },
} as Record<string, LayerMeta>;

const LAYER_LIST = [
  { id: 'poverty_risk_score', label: 'Kemiskinan' },
  { id: 'poverty_delta', label: 'Perubahan YoY' },
  { id: 'ndvi', label: 'Vegetasi' },
  { id: 'ndbi', label: 'Bangunan' },
  { id: 'ndwi', label: 'Air' },
  { id: 'ntl', label: 'Cahaya Malam' },
  { id: 'vanui', label: 'Urbanisasi' },
];

const EAST_JAVA_REGENCIES = [
  { value: 'All', label: 'Semua Jawa Timur' },
  { value: 'Bangkalan', label: 'Kab. Bangkalan' },
  { value: 'Banyuwangi', label: 'Kab. Banyuwangi' },
  { value: 'Batu', label: 'Kota Batu' },
  { value: 'Blitar', label: 'Kab. Blitar' },
  { value: 'Bojonegoro', label: 'Kab. Bojonegoro' },
  { value: 'Bondowoso', label: 'Kab. Bondowoso' },
  { value: 'Gresik', label: 'Kab. Gresik' },
  { value: 'Jember', label: 'Kab. Jember' },
  { value: 'Jombang', label: 'Kab. Jombang' },
  { value: 'Kediri', label: 'Kab. Kediri' },
  { value: 'KotaBlitar', label: 'Kota Blitar' },
  { value: 'KotaKediri', label: 'Kota Kediri' },
  { value: 'KotaMadiun', label: 'Kota Madiun' },
  { value: 'KotaMalang', label: 'Kota Malang' },
  { value: 'KotaMojokerto', label: 'Kota Mojokerto' },
  { value: 'KotaPasuruan', label: 'Kota Pasuruan' },
  { value: 'KotaProbolinggo', label: 'Kota Probolinggo' },
  { value: 'Lamongan', label: 'Kab. Lamongan' },
  { value: 'Lumajang', label: 'Kab. Lumajang' },
  { value: 'Madiun', label: 'Kab. Madiun' },
  { value: 'Magetan', label: 'Kab. Magetan' },
  { value: 'Malang', label: 'Kab. Malang' },
  { value: 'Mojokerto', label: 'Kab. Mojokerto' },
  { value: 'Nganjuk', label: 'Kab. Nganjuk' },
  { value: 'Ngawi', label: 'Kab. Ngawi' },
  { value: 'Pacitan', label: 'Kab. Pacitan' },
  { value: 'Pamekasan', label: 'Kab. Pamekasan' },
  { value: 'Pasuruan', label: 'Kab. Pasuruan' },
  { value: 'Ponorogo', label: 'Kab. Ponorogo' },
  { value: 'Probolinggo', label: 'Kab. Probolinggo' },
  { value: 'Sampang', label: 'Kab. Sampang' },
  { value: 'Sidoarjo', label: 'Kab. Sidoarjo' },
  { value: 'Situbondo', label: 'Kab. Situbondo' },
  { value: 'Sumenep', label: 'Kab. Sumenep' },
  { value: 'Surabaya', label: 'Kota Surabaya' },
  { value: 'Trenggalek', label: 'Kab. Trenggalek' },
  { value: 'Tuban', label: 'Kab. Tuban' },
  { value: 'Tulungagung', label: 'Kab. Tulungagung' },
];

interface LeftSidebarProps {
  activeLayer: LayerId;
  setActiveLayer: (l: LayerId) => void;
  cityFilter: string;
  setCityFilter: (c: string) => void;
  year: number;
  viewLevel: 'kecamatan' | 'kabupaten';
  setViewLevel: (v: 'kecamatan' | 'kabupaten') => void;
  scenarioRuns: ScenarioRun[];
  activeRun: ScenarioRun | null;
  onRunChange: (run: ScenarioRun) => void;
}

function selectRun(
  runs: ScenarioRun[],
  method: ScenarioMethod,
  model?: string,
  scenario?: string,
  weight?: string,
) {
  const candidates = runs.filter(run =>
    run.method === method &&
    (!model || run.model === model) &&
    (!scenario || run.scenario === scenario) &&
    (!weight || run.aggregation_weight === weight)
  );
  return candidates.find(run => run.is_default) ?? candidates[0] ?? null;
}

export function LeftSidebar({
  activeLayer,
  setActiveLayer,
  cityFilter,
  setCityFilter,
  year,
  viewLevel,
  setViewLevel,
  scenarioRuns,
  activeRun,
  onRunChange,
}: LeftSidebarProps) {
  const meta = LAYER_META[activeLayer];
  const method = activeRun?.method ?? 'aggregate';

  const methodRuns = useMemo(
    () => scenarioRuns.filter(run => run.method === method),
    [scenarioRuns, method],
  );
  const modelOptions = useMemo(
    () => Array.from(new Set(methodRuns.map(run => run.model))),
    [methodRuns],
  );
  const scenarioOptions = useMemo(
    () => Array.from(new Set(methodRuns.filter(run => run.model === activeRun?.model).map(run => run.scenario))),
    [methodRuns, activeRun],
  );
  const weightOptions = useMemo(
    () => methodRuns
      .filter(run => run.model === activeRun?.model && run.scenario === activeRun?.scenario)
      .map(run => run.aggregation_weight),
    [methodRuns, activeRun],
  );

  const regionOptions = useMemo(() => {
    if (!activeRun || activeRun.scenario_series !== 'N') return EAST_JAVA_REGENCIES;
    const allowed = new Set(['All', ...activeRun.supported_regions]);
    return EAST_JAVA_REGENCIES.filter(region => allowed.has(region.value));
  }, [activeRun]);

  const changeMethod = (nextMethod: ScenarioMethod) => {
    const next = selectRun(
      scenarioRuns,
      nextMethod,
      activeRun?.model,
      activeRun?.scenario,
      nextMethod === 'aggregate' ? activeRun?.aggregation_weight : 'feature_aggregation',
    ) ?? selectRun(scenarioRuns, nextMethod);
    if (next) onRunChange(next);
  };

  const changeModel = (model: string) => {
    const next = selectRun(scenarioRuns, method, model, activeRun?.scenario, activeRun?.aggregation_weight)
      ?? selectRun(scenarioRuns, method, model);
    if (next) onRunChange(next);
  };

  const changeScenario = (scenario: string) => {
    const next = selectRun(scenarioRuns, method, activeRun?.model, scenario, activeRun?.aggregation_weight)
      ?? selectRun(scenarioRuns, method, activeRun?.model, scenario);
    if (next) onRunChange(next);
  };

  const changeWeight = (weight: string) => {
    const next = selectRun(scenarioRuns, method, activeRun?.model, activeRun?.scenario, weight);
    if (next) onRunChange(next);
  };

  return (
    <div className="w-64 sm:w-72 h-full bg-[#111114] border-r border-white/10 flex flex-col z-40 shrink-0 custom-scrollbar overflow-y-auto">
      <div className="p-4 border-b border-white/10">
        <h3 className="text-[10px] font-bold text-white/40 mb-3 flex items-center gap-2 uppercase tracking-widest">
          <SlidersHorizontal size={14} /> Run Model
        </h3>

        <div className="grid grid-cols-2 gap-2 bg-black/40 p-1 rounded-lg border border-white/5 mb-3">
          {(['aggregate', 'direct_district'] as ScenarioMethod[]).map(item => (
            <button
              key={item}
              onClick={() => changeMethod(item)}
              className={twMerge(
                'px-2 py-2 rounded text-[10px] font-semibold uppercase tracking-wider transition-all',
                method === item
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-white/40 hover:text-white/70 border border-transparent',
              )}
            >
              {item === 'aggregate' ? 'Aggregate' : 'Direct District'}
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <select
            value={activeRun?.model ?? ''}
            onChange={event => changeModel(event.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white/80 text-xs rounded px-3 py-2 focus:outline-none focus:border-red-500/50"
          >
            {modelOptions.map(model => <option key={model} value={model}>{model}</option>)}
          </select>

          <select
            value={activeRun?.scenario ?? ''}
            onChange={event => changeScenario(event.target.value)}
            className="w-full bg-black/40 border border-white/10 text-white/80 text-xs rounded px-3 py-2 focus:outline-none focus:border-red-500/50"
          >
            {scenarioOptions.map(scenario => <option key={scenario} value={scenario}>{scenario}</option>)}
          </select>

          {weightOptions.length > 1 && (
            <select
              value={activeRun?.aggregation_weight ?? ''}
              onChange={event => changeWeight(event.target.value)}
              className="w-full bg-black/40 border border-white/10 text-white/80 text-xs rounded px-3 py-2 focus:outline-none focus:border-red-500/50"
            >
              {weightOptions.map(weight => <option key={weight} value={weight}>{weight}</option>)}
            </select>
          )}
        </div>

        <div className="mt-3 grid grid-cols-2 gap-2 text-[9px] uppercase tracking-wider">
          <div className="bg-white/5 border border-white/10 rounded px-2 py-1 text-white/50">
            Seri {activeRun?.scenario_series ?? '-'}
          </div>
          <div className={twMerge(
            'bg-white/5 border rounded px-2 py-1',
            activeRun?.has_shap_kecamatan || activeRun?.has_shap_kabupaten || activeRun?.has_shap_global
              ? 'border-emerald-500/30 text-emerald-300'
              : 'border-white/10 text-white/30',
          )}>
            SHAP {activeRun?.has_shap_kecamatan || activeRun?.has_shap_kabupaten || activeRun?.has_shap_global ? 'Ada' : 'Kosong'}
          </div>
        </div>
      </div>

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
                'px-3 py-2 rounded text-[10px] font-semibold uppercase tracking-wider transition-all capitalize',
                viewLevel === v
                  ? 'bg-red-500/20 text-red-300 border border-red-500/40'
                  : 'text-white/40 hover:text-white/70 border border-transparent',
              )}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 border-b border-white/10">
        <h3 className="text-[10px] font-bold text-white/40 mb-3 flex items-center gap-2 uppercase tracking-widest">
          <Filter size={14} /> Filter Wilayah
        </h3>
        <select
          value={cityFilter}
          onChange={e => setCityFilter(e.target.value)}
          className="w-full bg-black/40 border border-white/10 text-white/80 text-xs rounded px-3 py-2 focus:outline-none focus:border-red-500/50 cursor-pointer hover:border-white/20"
        >
          {regionOptions.map(reg => (
            <option key={reg.value} value={reg.value}>{reg.label}</option>
          ))}
        </select>
        {activeRun?.scenario_series === 'N' && (
          <p className="text-[9px] text-amber-300/70 mt-2 leading-relaxed">
            Seri N hanya tersedia untuk Surabaya, Gresik, dan Bangkalan.
          </p>
        )}
      </div>

      <div className="p-4 flex-1 flex flex-col gap-4">
        <div>
          <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-3">
            Indikator | {year}
          </h3>
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
                    'px-2 py-0.5 text-[9px] rounded-full border transition-all font-medium',
                    isActive
                      ? 'text-white border-white/30 bg-white/10'
                      : 'text-white/40 border-white/10 hover:text-white/70 hover:border-white/20',
                  )}
                  style={isActive ? { borderColor: accentColor + 'aa', background: accentColor + '22' } : {}}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>

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
