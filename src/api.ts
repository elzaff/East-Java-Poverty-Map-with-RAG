import { Kecamatan, TimeseriesDataPoint, ShapValue, LayerId, ModelMetric, ShapEntry } from './types';
import { KECAMATAN_LIST, generateMockTimeseries, generateShapValues, MODEL_COMPARISONS } from './mockData';

export const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

const BASE_URL = ((import.meta as any).env?.BASE_URL || '/').replace(/\/?$/, '/');

async function loadJSON(path: string) {
  const base = ((import.meta as any).env?.BASE_URL || '/').replace(/\/?$/, '/');
  const res = await fetch(`${base}${path}?t=${Date.now()}`);
  if (!res.ok) throw new Error(`Failed to load ${path}`);
  return res.json();
}

let _predKec: Record<string, any> | null = null;
let _predKab: Record<string, any> | null = null;
let _modelMetrics: ModelMetric[] | null = null;
let _shapGlobal: ShapEntry[] | null = null;
let _shapKec: Record<string, any> | null = null;
let _nlpScores: Record<string, any> | null = null;
let _spatialInds: Record<string, any> | null = null;

async function getPredKec() {
  if (!_predKec) _predKec = await loadJSON('api/data_predictions_kecamatan.json');
  return _predKec!;
}
async function getPredKab() {
  if (!_predKab) _predKab = await loadJSON('api/data_predictions_kabupaten.json');
  return _predKab!;
}

export const fetchMumtazMetrics = async (): Promise<ModelMetric[]> => {
  try {
    const res = await fetch(`${BASE_URL}api/data_mumtaz_metrics.json`);
    if (!res.ok) throw new Error('Not found');
    return res.json();
  } catch {
    return [];
  }
};

async function getModelMetrics(): Promise<ModelMetric[]> {
  if (!_modelMetrics) _modelMetrics = await loadJSON('api/data_model_metrics.json');
  return _modelMetrics!;
}
async function getShapGlobal(): Promise<ShapEntry[]> {
  if (!_shapGlobal) _shapGlobal = await loadJSON('api/data_shap_global.json');
  return _shapGlobal!;
}
async function getShapKec() {
  if (!_shapKec) _shapKec = await loadJSON('api/data_shap_kecamatan.json');
  return _shapKec!;
}
async function getNlpScores() {
  if (!_nlpScores) _nlpScores = await loadJSON('api/data_nlp_event_scores.json');
  return _nlpScores!;
}
async function getSpatialInds() {
  if (!_spatialInds) _spatialInds = await loadJSON('api/data_spatial_indicators.json');
  return _spatialInds!;
}

export async function fetchKecamatan(): Promise<Kecamatan[]> {
  await delay(100);
  return KECAMATAN_LIST;
}

export async function fetchLayerData(year: number, layerId: LayerId): Promise<Record<string, number>> {
  const data: Record<string, number> = {};

  if (layerId === 'poverty_risk_score' || layerId === 'estimasi_kemiskinan') {
    try {
      const predKec = await getPredKec();
      for (const [key, entry] of Object.entries(predKec) as any) {
        const series = entry.series.find((s: any) => s.year === year);
        if (series) data[key] = series.prediction_dl_percent;
      }
      return data;
    } catch { /* fallback */ }
  }

  if (layerId === 'prediction_error') {
    try {
      const predKec = await getPredKec();
      for (const [key, entry] of Object.entries(predKec) as any) {
        const series = entry.series.find((s: any) => s.year === year);
        if (series && series.std !== undefined) data[key] = series.std;
      }
      return data;
    } catch { /* fallback */ }
  }

  if (layerId === 'poverty_delta') {
    if (year <= 2018) return {};
    try {
      const predKec = await getPredKec();
      const CLIP = 2; // ±2 percentage points
      for (const [key, entry] of Object.entries(predKec) as any) {
        const cur  = entry.series.find((s: any) => s.year === year);
        const prev = entry.series.find((s: any) => s.year === year - 1);
        if (cur && prev) {
          const delta = cur.prediction_dl_percent - prev.prediction_dl_percent;
          data[key] = (Math.max(-CLIP, Math.min(CLIP, delta)) + CLIP) / (2 * CLIP); // 0=improved, 0.5=same, 1=worsened
        }
      }
      return data;
    } catch { return {}; }
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
    } catch { /* fallback to mock */ }
  }

  const spatialLayers = ['ndvi', 'ndbi', 'ndwi', 'ntl', 'vanui'];
  if (spatialLayers.includes(layerId)) {
    try {
      const spatialInds = await getSpatialInds();
      for (const [key, entry] of Object.entries(spatialInds) as any) {
        const series = entry.series.find((s: any) => s.year === year);
        if (series && series[layerId] !== undefined) {
          data[key] = series[layerId];
        }
      }
      return data;
    } catch { /* fallback to mock */ }
  }

  KECAMATAN_LIST.forEach(kec => {
    const ts = generateMockTimeseries(kec.gid_3).find(d => d.year === year);
    if (ts) data[kec.gid_3] = (ts[layerId as keyof TimeseriesDataPoint] as number) || 0;
  });
  return data;
}

export async function fetchTimeseries(gid: string, name2?: string, name3?: string): Promise<TimeseriesDataPoint[]> {
  if (name2 && name3 && !gid.endsWith('-KAB')) {
    try {
      const [predKec, nlpScores, predKab, spatialInds] = await Promise.all([
        getPredKec(), 
        getNlpScores().catch(() => ({})),
        getPredKab().catch(() => ({})),
        getSpatialInds().catch(() => ({}))
      ]);
      const key = `${name2}|${name3}`;
      const entry = predKec[key];
      
      const kabEntry = predKab[name2];
      const kabKeys = Object.keys(predKec).filter(k => k.startsWith(name2 + '|'));
      const aggSeries: Record<number, { sum: number, count: number }> = {};
      kabKeys.forEach(k => {
        predKec[k].series.forEach((s: any) => {
          if (!aggSeries[s.year]) aggSeries[s.year] = { sum: 0, count: 0 };
          aggSeries[s.year].sum += s.prediction_dl_percent;
          aggSeries[s.year].count++;
        });
      });

      if (entry) {
        const nlp = nlpScores[key] ?? {};
        const spat = spatialInds[key] ?? { series: [] };
        return entry.series.map((s: any, idx: number, arr: any[]) => {
          const n = nlp[String(s.year)] ?? {};
          const sp = spat.series.find((x: any) => x.year === s.year) ?? { ndvi: 0, ndbi: 0, ndwi: 0, ntl: 0, vanui: 0 };
          const agg = aggSeries[s.year] ? aggSeries[s.year].sum / aggSeries[s.year].count : undefined;
          const kabS = kabEntry?.series?.find((ks: any) => ks.year === s.year);
          const prevS = idx > 0 ? arr[idx - 1] : s;
          const delta = s.prediction_dl_percent - prevS.prediction_dl_percent;
          return {
            year: s.year,
            poverty_risk_score: s.prediction_dl_percent / 100,
            estimasi_kemiskinan: s.prediction_dl_percent,
            poverty_delta: delta,
            prediction_dl: s.prediction_dl_percent / 100,
            prediction_dl_percent: s.prediction_dl_percent,
            prediction_dl_aggregate: agg,
            prediction_dl_mumtaz: kabS?.prediction,
            bps_poverty_percent: kabS?.bps === 0 ? null : kabS?.bps,
            prediction_error: s.std / 100,
            ndvi: sp.ndvi, ndbi: sp.ndbi, ndwi: sp.ndwi, ntl: sp.ntl, vanui: sp.vanui,
            distress_share: n.distress_share ?? 0,
            event_score_ketenagakerjaan: n.event_score_ketenagakerjaan ?? 0,
            event_score_infrastruktur: n.event_score_infrastruktur ?? 0,
            event_score_ekonomi: n.event_score_ekonomi ?? 0,
          };
        });
      }
    } catch {}
  }

  if (gid.endsWith('-KAB') && name2) {
    try {
      const [predKab, spatialInds] = await Promise.all([
        getPredKab(),
        getSpatialInds().catch(() => ({}))
      ]);
      const entry = predKab[name2];
      
      const predKec = await getPredKec();
      const kabKeys = Object.keys(predKec).filter(k => k.startsWith(name2 + '|'));
      const aggSeries: Record<number, { sum: number, count: number }> = {};
      kabKeys.forEach(k => {
        predKec[k].series.forEach((s: any) => {
          if (!aggSeries[s.year]) aggSeries[s.year] = { sum: 0, count: 0 };
          aggSeries[s.year].sum += s.prediction_dl_percent;
          aggSeries[s.year].count++;
        });
      });

      if (entry) {
        const spat = spatialInds[name2] ?? { series: [] };
        return entry.series.map((s: any, idx: number, arr: any[]) => {
          const sp = spat.series.find((x: any) => x.year === s.year) ?? { ndvi: 0, ndbi: 0, ndwi: 0, ntl: 0, vanui: 0 };
          const agg = aggSeries[s.year] ? aggSeries[s.year].sum / aggSeries[s.year].count : undefined;
          const prevS = idx > 0 ? arr[idx - 1] : s;
          const delta = s.prediction - prevS.prediction;
          return {
            year: s.year,
            poverty_risk_score: s.prediction / 100,
            estimasi_kemiskinan: s.prediction,
            poverty_delta: delta,
            prediction_dl: s.prediction / 100,
            prediction_dl_percent: s.prediction,
            prediction_dl_aggregate: agg,
            bps_poverty_percent: s.bps === 0 ? null : s.bps,
            prediction_error: s.error / 100,
            ndvi: sp.ndvi, ndbi: sp.ndbi, ndwi: sp.ndwi, ntl: sp.ntl, vanui: sp.vanui,
            distress_share: 0, event_score_ketenagakerjaan: 0,
            event_score_infrastruktur: 0, event_score_ekonomi: 0
          };
        });
      }
    } catch {}
  }

  return generateMockTimeseries(gid);
}

export async function fetchXai(gid: string, year: number, name2?: string, name3?: string): Promise<ShapValue[]> {
  if (name2 && name3 && !gid.endsWith('-KAB')) {
    try {
      const shapKec = await getShapKec();
      const key = `${name2}|${name3}`;
      const entry = shapKec[key];
      if (entry && entry[String(year)]) {
        return entry[String(year)].map((s: any) => ({
          feature: s.label || s.feature,
          value: s.shap_value,
          actual_value: s.abs_shap
        }));
      }
    } catch {}
  }
  return generateShapValues(gid, year);
}

export async function fetchModelMetrics(): Promise<ModelMetric[]> {
  try {
    return await getModelMetrics();
  } catch {
    return MODEL_COMPARISONS as any;
  }
}

export async function fetchShapGlobal(): Promise<ShapEntry[]> {
  try {
    return await getShapGlobal();
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
  // fallback mock (RAG endpoint not configured)
  await delay(1500);
  const p = prompt.toLowerCase();
  if (p.includes('naik') || p.includes('kenapa') || p.includes('why'))
    return 'Berdasarkan analisis NLP dan fitur spasial (GRU J3_PCD_IMAGE), peningkatan risiko kemiskinan didorong oleh meningkatnya NDBI (Built-up Index) dan penurunan NTL (Night-Time Light). Dokumen RPJMD juga mencatat kerentanan pada sektor industri lokal.';
  if (p.includes('bandingkan') || p.includes('compare'))
    return 'Gresik menunjukkan resiliensi melalui NTL tinggi dan NDBI stabil. Beberapa kecamatan Bangkalan menunjukkan penurunan aktivitas ekonomi (VANUI rendah) dan peningkatan distress_share, mengindikasikan perbedaan laju pemulihan pasca-2021.';
  return `[RAG offline — set VITE_RAG_ENDPOINT] Analisis GRU J5_FULL (PCD + IMAGE + NLP) menunjukkan kombinasi NDBI (built-up) dan NTL (cahaya malam) sebagai driver utama. Model mencapai RMSE ≈ 0.78, R² ≈ 0.964, Spearman 0.989 pada test set 2024–2025.${contextGid ? ` Konteks: ${contextGid}` : ''}`;
}
