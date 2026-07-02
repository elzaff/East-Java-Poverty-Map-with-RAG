import {
  Kecamatan,
  TimeseriesDataPoint,
  ShapValue,
  LayerId,
  ModelMetric,
  ShapEntry,
  ScenarioIndex,
  ScenarioRun,
  RunData,
} from './types';
import { KECAMATAN_LIST, generateMockTimeseries, MODEL_COMPARISONS } from './mockData';

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const BASE_URL = ((import.meta as any).env?.BASE_URL || '/').replace(/\/?$/, '/');
const DEFAULT_RUN_ID = 'aggregate__GRU__J5_FULL__w_equal';

async function loadJSON(path: string) {
  const res = await fetch(`${BASE_URL}${path}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

let _scenarioIndex: ScenarioIndex | null = null;
const _runCache: Record<string, RunData> = {};
let _modelMetrics: ModelMetric[] | null = null;
let _directDistrictMetrics: ModelMetric[] | null = null;
let _nlpScores: Record<string, any> | null = null;
let _spatialInds: Record<string, any> | null = null;

function runId(run?: ScenarioRun | null) {
  return run?.id || _scenarioIndex?.default_run_id || DEFAULT_RUN_ID;
}

async function getNlpScores() {
  if (!_nlpScores) _nlpScores = await loadJSON('api/data_nlp_event_scores.json');
  return _nlpScores!;
}

async function getSpatialInds() {
  if (!_spatialInds) _spatialInds = await loadJSON('api/data_spatial_indicators.json');
  return _spatialInds!;
}

export async function fetchScenarioIndex(): Promise<ScenarioIndex> {
  if (!_scenarioIndex) _scenarioIndex = await loadJSON('api/data_scenario_runs.json');
  return _scenarioIndex!;
}

export async function fetchScenarioRunData(run?: ScenarioRun | null): Promise<RunData> {
  const id = runId(run);
  if (!_runCache[id]) _runCache[id] = await loadJSON(`api/runs/${id}.json`);
  return _runCache[id];
}

export async function fetchScenarioRuns(): Promise<ScenarioRun[]> {
  const index = await fetchScenarioIndex();
  return index.runs;
}

export const fetchDirectDistrictMetrics = async (): Promise<ModelMetric[]> => {
  if (_directDistrictMetrics) return _directDistrictMetrics;
  try {
    const runs = await fetchScenarioRuns();
    _directDistrictMetrics = runs
      .filter(run => run.method === 'direct_district' && run.metrics)
      .map(run => ({
        model: run.model,
        scenario: run.scenario,
        label: run.label,
        mae: run.metrics?.mae ?? 0,
        rmse: run.metrics?.rmse ?? 0,
        r2: run.metrics?.r2 ?? 0,
        spearman: run.metrics?.spearman ?? 0,
        mape: run.metrics?.mape ?? 0,
        is_production: run.is_production,
      }));
    return _directDistrictMetrics;
  } catch {
    return [];
  }
};

async function getModelMetrics(): Promise<ModelMetric[]> {
  if (_modelMetrics) return _modelMetrics;
  try {
    const runs = await fetchScenarioRuns();
    _modelMetrics = runs
      .filter(run => run.method === 'aggregate' && run.metrics)
      .map(run => ({
        model: run.model,
        scenario: run.scenario,
        label: run.label,
        mae: run.metrics?.mae ?? 0,
        rmse: run.metrics?.rmse ?? 0,
        r2: run.metrics?.r2 ?? 0,
        spearman: run.metrics?.spearman ?? 0,
        mape: run.metrics?.mape ?? 0,
        is_production: run.is_production,
      }));
    return _modelMetrics;
  } catch {
    _modelMetrics = await loadJSON('api/data_model_metrics.json');
    return _modelMetrics!;
  }
}

export async function fetchKecamatan(): Promise<Kecamatan[]> {
  await delay(100);
  return KECAMATAN_LIST;
}

function seriesValue(series: any[] | undefined, year: number, field: string) {
  return series?.find((s: any) => s.year === year)?.[field];
}

function applyDelta(data: Record<string, number>, key: string, series: any[], year: number, field: string) {
  const cur = series.find((s: any) => s.year === year);
  const prev = series.find((s: any) => s.year === year - 1);
  if (!cur || !prev) return;
  const delta = cur[field] - prev[field];
  const clip = 2;
  data[key] = (Math.max(-clip, Math.min(clip, delta)) + clip) / (2 * clip);
}

export async function fetchLayerData(
  year: number,
  layerId: LayerId,
  activeRun?: ScenarioRun | null,
): Promise<Record<string, number>> {
  const data: Record<string, number> = {};

  if (
    layerId === 'poverty_risk_score' ||
    layerId === 'estimasi_kemiskinan' ||
    layerId === 'prediction_error' ||
    layerId === 'poverty_delta'
  ) {
    try {
      const runData = await fetchScenarioRunData(activeRun);
      const isAggregate = runData.meta.method === 'aggregate';

      if (isAggregate) {
        for (const [key, entry] of Object.entries(runData.kecamatan)) {
          if (layerId === 'poverty_delta') {
            applyDelta(data, key, entry.series, year, 'prediction_dl_percent');
          } else {
            const field = layerId === 'prediction_error' ? 'std' : 'prediction_dl_percent';
            const value = seriesValue(entry.series, year, field);
            if (value !== undefined) data[key] = value;
          }
        }
      }

      for (const [name2, entry] of Object.entries(runData.kabupaten)) {
        if (layerId === 'poverty_delta') {
          applyDelta(data, name2, entry.series, year, 'prediction');
        } else {
          const field = layerId === 'prediction_error' ? 'error' : 'prediction';
          const value = seriesValue(entry.series, year, field);
          if (value !== undefined) data[name2] = value;
        }
      }

      return data;
    } catch {
      return {};
    }
  }

  const nlpLayers = ['distress_share', 'event_score_ketenagakerjaan', 'event_score_infrastruktur', 'event_score_ekonomi'];
  if (nlpLayers.includes(layerId)) {
    try {
      const nlpScores = await getNlpScores();
      for (const [key, byYear] of Object.entries(nlpScores) as any) {
        const yearData = byYear[String(year)];
        if (yearData) data[key] = yearData[layerId] ?? 0;
      }
      return data;
    } catch {}
  }

  const spatialLayers = ['ndvi', 'ndbi', 'ndwi', 'ntl', 'vanui'];
  if (spatialLayers.includes(layerId)) {
    try {
      const spatialInds = await getSpatialInds();
      for (const [key, entry] of Object.entries(spatialInds) as any) {
        const series = entry.series.find((s: any) => s.year === year);
        if (series && series[layerId] !== undefined) data[key] = series[layerId];
      }
      return data;
    } catch {}
  }

  KECAMATAN_LIST.forEach(kec => {
    const ts = generateMockTimeseries(kec.gid_3).find(d => d.year === year);
    if (ts) data[kec.gid_3] = (ts[layerId as keyof TimeseriesDataPoint] as number) || 0;
  });
  return data;
}

function spatialFor(spatialInds: Record<string, any>, key: string, year: number) {
  const spat = spatialInds[key] ?? { series: [] };
  return spat.series.find((x: any) => x.year === year) ?? {
    ndvi: 0,
    ndbi: 0,
    ndwi: 0,
    ntl: 0,
    vanui: 0,
  };
}

function nlpFor(nlpScores: Record<string, any>, key: string, year: number) {
  return nlpScores[key]?.[String(year)] ?? {};
}

function buildPoint(
  s: any,
  idx: number,
  arr: any[],
  predField: 'prediction_dl_percent' | 'prediction',
  method: 'aggregate' | 'direct_district',
  sp: any,
  n: any,
  kabS?: any,
): TimeseriesDataPoint {
  const prediction = predField === 'prediction' ? s.prediction : s.prediction_dl_percent;
  const uncertainty = predField === 'prediction' ? s.error : s.std;
  const prev = idx > 0 ? arr[idx - 1] : s;
  const prevPrediction = predField === 'prediction' ? prev.prediction : prev.prediction_dl_percent;
  const delta = prediction - prevPrediction;

  return {
    year: s.year,
    poverty_risk_score: prediction / 100,
    estimasi_kemiskinan: prediction,
    poverty_delta: delta,
    prediction_dl: prediction / 100,
    prediction_dl_percent: prediction,
    prediction_dl_aggregate: method === 'aggregate' ? kabS?.prediction : undefined,
    prediction_dl_direct_district: method === 'direct_district' ? prediction : undefined,
    bps_poverty_percent: (kabS?.bps ?? s.bps) === 0 ? null : (kabS?.bps ?? s.bps),
    prediction_error: uncertainty / 100,
    ndvi: sp.ndvi,
    ndbi: sp.ndbi,
    ndwi: sp.ndwi,
    ntl: sp.ntl,
    vanui: sp.vanui,
    distress_share: n.distress_share ?? 0,
    event_score_ketenagakerjaan: n.event_score_ketenagakerjaan ?? 0,
    event_score_infrastruktur: n.event_score_infrastruktur ?? 0,
    event_score_ekonomi: n.event_score_ekonomi ?? 0,
  };
}

export async function fetchTimeseries(
  gid: string,
  name2?: string,
  name3?: string,
  activeRun?: ScenarioRun | null,
): Promise<TimeseriesDataPoint[]> {
  try {
    const [runData, nlpScores, spatialInds] = await Promise.all([
      fetchScenarioRunData(activeRun),
      getNlpScores().catch(() => ({})),
      getSpatialInds().catch(() => ({})),
    ]);

    if (name2 && name3 && !gid.endsWith('-KAB') && runData.meta.method === 'aggregate') {
      const key = `${name2}|${name3}`;
      const entry = runData.kecamatan[key];
      const kabEntry = runData.kabupaten[name2];
      if (!entry) return [];
      return entry.series.map((s, idx, arr) => {
        const year = s.year;
        return buildPoint(
          s,
          idx,
          arr,
          'prediction_dl_percent',
          'aggregate',
          spatialFor(spatialInds, key, year),
          nlpFor(nlpScores, key, year),
          kabEntry?.series?.find((ks: any) => ks.year === year),
        );
      });
    }

    if (name2) {
      const entry = runData.kabupaten[name2];
      if (!entry) return [];
      return entry.series.map((s, idx, arr) => {
        const year = s.year;
        const spatialKey = gid.endsWith('-KAB') ? name2 : `${name2}|${name3}`;
        return buildPoint(
          s,
          idx,
          arr,
          'prediction',
          runData.meta.method,
          spatialFor(spatialInds, spatialKey, year),
          nlpFor(nlpScores, spatialKey, year),
          s,
        );
      });
    }
  } catch {}

  return generateMockTimeseries(gid);
}

export async function fetchXai(
  gid: string,
  year: number,
  name2?: string,
  name3?: string,
  activeRun?: ScenarioRun | null,
): Promise<ShapValue[]> {
  try {
    const runData = await fetchScenarioRunData(activeRun);
    const yearKey = String(year);
    const isKabupaten = gid.endsWith('-KAB') || runData.meta.method === 'direct_district';

    const localSource = !isKabupaten && name2 && name3
      ? runData.shap_kecamatan[`${name2}|${name3}`]?.[yearKey]
      : name2
        ? runData.shap_kabupaten[name2]?.[yearKey]
        : undefined;
    const globalSource = runData.shap_global ?? [];
    const source = localSource && localSource.length > 0 ? localSource : globalSource;

    if (!source || source.length === 0) return [];
    return source
      .map((s: ShapEntry) => {
        const signedValue = s.shap_value ?? s.mean_signed_shap ?? 0;
        return {
          feature: s.label || s.feature,
          value: signedValue,
          actual_value: s.abs_shap ?? s.mean_abs_shap ?? Math.abs(signedValue),
        };
      })
      .sort((a, b) => b.actual_value - a.actual_value)
      .slice(0, 12);
  } catch {
    return [];
  }
}

export async function fetchModelMetrics(): Promise<ModelMetric[]> {
  try {
    return await getModelMetrics();
  } catch {
    return MODEL_COMPARISONS as any;
  }
}

export async function fetchShapGlobal(activeRun?: ScenarioRun | null): Promise<ShapEntry[]> {
  try {
    const runData = await fetchScenarioRunData(activeRun);
    return runData.shap_global || [];
  } catch {
    return [];
  }
}

const RAG_ENDPOINT = (import.meta as any).env?.VITE_RAG_ENDPOINT as string | undefined;

export async function ragChat(prompt: string, contextGid: string | null): Promise<string> {
  if (RAG_ENDPOINT) {
    const res = await fetch(RAG_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: prompt, context: contextGid ?? '' }),
    });
    if (!res.ok) throw new Error(`RAG ${res.status}`);
    const data = await res.json();
    return data.answer ?? data.error ?? 'Tidak ada respons dari model.';
  }
  await delay(1500);
  const p = prompt.toLowerCase();
  if (p.includes('naik') || p.includes('kenapa') || p.includes('why'))
    return 'Berdasarkan analisis NLP dan fitur spasial, peningkatan risiko kemiskinan didorong oleh perubahan indikator spasial serta sinyal berita pada skenario aktif. Nilai SHAP hanya menjelaskan prediksi model, bukan sebab kausal.';
  if (p.includes('bandingkan') || p.includes('compare'))
    return 'Bandingkan hasil melalui selector skenario di sidebar kiri. Seri N hanya memuat Surabaya, Gresik, dan Bangkalan; seri J memuat seluruh kabupaten/kota Jawa Timur.';
  return `[RAG offline - set VITE_RAG_ENDPOINT] Analisis memakai skenario aktif di dashboard. Konteks: ${contextGid ?? 'tidak ada'}.`;
}
