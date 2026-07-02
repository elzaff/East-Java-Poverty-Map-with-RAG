export type City = 'Surabaya' | 'Gresik' | 'Bangkalan';

export type ScenarioMethod = 'aggregate' | 'direct_district';

export interface Kecamatan {
  gid_3: string;
  name_3: string;
  name_2: City;
  lng: number;
  lat: number;
}

export type LayerId =
  | 'poverty_risk_score'
  | 'poverty_delta'
  | 'estimasi_kemiskinan'
  | 'prediction_error'
  | 'ndvi'
  | 'ndbi'
  | 'ndwi'
  | 'ntl'
  | 'vanui'
  | 'distress_share'
  | 'event_score_ketenagakerjaan'
  | 'event_score_infrastruktur'
  | 'event_score_ekonomi';

export interface TimeseriesDataPoint {
  year: number;
  poverty_risk_score: number;
  estimasi_kemiskinan: number;
  poverty_delta?: number;
  prediction_dl: number;
  prediction_dl_percent?: number;
  prediction_dl_aggregate?: number;
  prediction_dl_direct_district?: number;
  bps_poverty_percent?: number | null;
  ndvi: number;
  ndbi: number;
  ndwi: number;
  ntl: number;
  vanui: number;
  distress_share: number;
  [key: string]: number | undefined | null;
}

export interface KecamatanPredSeries {
  year: number;
  prediction_dl_percent: number;
  std: number;
}

export interface KabupatenPredSeries {
  year: number;
  bps: number | null;
  prediction: number;
  error: number;
}

export interface ScenarioMetrics {
  mae: number | null;
  rmse: number | null;
  r2: number | null;
  spearman: number | null;
  mape: number | null;
}

export interface ScenarioRun {
  id: string;
  method: ScenarioMethod;
  model: string;
  scenario: string;
  scenario_label: string;
  scenario_series: 'J' | 'N';
  aggregation_weight: string;
  supported_regions: string[];
  supports_kecamatan: boolean;
  has_shap_kecamatan: boolean;
  has_shap_kabupaten: boolean;
  has_shap_global: boolean;
  is_default: boolean;
  is_production: boolean;
  label: string;
  metric_weight: string;
  metrics: ScenarioMetrics | null;
}

export interface ScenarioIndex {
  default_run_id: string;
  nlp_regions: string[];
  years: number[];
  runs: ScenarioRun[];
}

export interface RunData {
  meta: ScenarioRun;
  kecamatan: Record<string, {
    gid_3: string;
    name_2: string;
    name_3: string;
    series: KecamatanPredSeries[];
  }>;
  kabupaten: Record<string, {
    series: KabupatenPredSeries[];
  }>;
  shap_kecamatan: Record<string, Record<string, ShapEntry[]>>;
  shap_kabupaten: Record<string, Record<string, ShapEntry[]>>;
  shap_global: ShapEntry[];
}

export interface ModelMetric {
  model: string;
  scenario: string;
  label: string;
  mae: number;
  rmse: number;
  r2: number;
  spearman: number;
  mape: number;
  is_production: boolean;
}

export interface ShapEntry {
  feature: string;
  modality: string;
  label: string;
  shap_value?: number;
  abs_shap?: number;
  mean_abs_shap?: number;
  mean_signed_shap?: number | null;
}

export interface ShapValue {
  feature: string;
  value: number;
  actual_value: number;
}

export interface ModelMetrics {
  name: string;
  rmse: number;
  mae: number;
  mape: number;
  r2: number;
  status: 'Run' | 'Failed' | 'Pending';
  trainingTime: string;
  params: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'analyst';
  content: string;
  drivers?: string[];
  chips?: string[];
  caveat?: string;
}
