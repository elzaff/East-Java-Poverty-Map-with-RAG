const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '..');
const notebookRoot = path.resolve(projectRoot, '..', 'NOTEBOOK-DATAFINAL');
const apiRoot = path.join(projectRoot, 'public', 'api');
const runsRoot = path.join(apiRoot, 'runs');

const aggregateRoot = path.join(notebookRoot, 'DL', 'AGGREGATE', 'aggregate_all_models_deliverable');
const mumtazRoot = path.join(notebookRoot, 'DL', 'KABUPATEN(MUMTAZ)', 'mumtaz_all_models_deliverable');
const shapRoot = path.join(notebookRoot, 'DL', 'SHAP');

const NLP_REGIONS = ['Bangkalan', 'Gresik', 'Surabaya'];
const MODEL_ORDER = ['MLP', 'GRU', 'TCN', 'TRANSFORMER'];
const SCENARIO_ORDER = [
  'J1_PCD',
  'J2_IMAGE',
  'J3_PCD_IMAGE',
  'J4_PCD_NLP',
  'J5_FULL',
  'N1_NLP',
  'N2_PCD_NLP',
  'N3_IMAGE_NLP',
  'N4_FULL',
];
const WEIGHT_ORDER = ['w_equal', 'w_density', 'w_luas', 'w_ntl', 'w_poi', 'feature_aggregation'];

const SCENARIO_LABELS = {
  J1_PCD: 'PCD',
  J2_IMAGE: 'Image',
  J3_PCD_IMAGE: 'PCD + Image',
  J4_PCD_NLP: 'PCD + NLP',
  J5_FULL: 'Full',
  N1_NLP: 'NLP',
  N2_PCD_NLP: 'PCD + NLP',
  N3_IMAGE_NLP: 'Image + NLP',
  N4_FULL: 'Full NLP',
};

const FEATURE_LABELS = {
  pcd_NDVI: 'NDVI (Vegetation)',
  pcd_NDBI: 'NDBI (Built-up)',
  pcd_NDWI: 'NDWI (Water)',
  pcd_NTL: 'Night-time Light',
  pcd_VANUI: 'VANUI',
  pcd_luas_wilayah: 'Area',
  pcd_jumlah_penduduk: 'Population',
  pcd_kepadatan_penduduk: 'Population Density',
  pcd_avg_distance_m: 'Avg Distance',
  pcd_air: 'Water Access',
  mask_pcd: 'PCD Availability',
  mask_image: 'Image Availability',
  mask_nlp: 'NLP Availability',
};

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function cleanDir(dir) {
  ensureDir(dir);
  for (const file of fs.readdirSync(dir)) {
    fs.rmSync(path.join(dir, file), { recursive: true, force: true });
  }
}

function readCsv(filePath) {
  const text = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '');
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const headers = lines[0].split(',').map(h => h.trim());
  return { headers, lines: lines.slice(1) };
}

function rowParts(line) {
  return line.split(',').map(v => v.trim());
}

function csvCell(value) {
  if (value === null || value === undefined) return '';
  const text = String(value);
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function num(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function fixed(value, digits = 3) {
  return Number.isFinite(value) ? Number(value.toFixed(digits)) : null;
}

function std(values, mean) {
  if (values.length <= 1) return 0;
  const variance = values.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function safeId(...parts) {
  return parts.join('__').replace(/[^A-Za-z0-9_]+/g, '_');
}

function scenarioSeries(scenario) {
  return scenario.startsWith('N') ? 'N' : 'J';
}

function labelFeature(feature) {
  if (FEATURE_LABELS[feature]) return FEATURE_LABELS[feature];
  if (feature.startsWith('nlp_freq_')) return `NLP: ${feature.replace('nlp_freq_', '').replace(/_/g, ' ')}`;
  if (feature.startsWith('img_emb_')) return `Image embedding ${feature.replace('img_emb_', '')}`;
  return feature.replace(/^pcd_/, '').replace(/_/g, ' ');
}

function runLabel(meta) {
  const base = `${meta.model} ${meta.scenario}`;
  if (meta.method === 'aggregate' && meta.aggregation_weight && meta.aggregation_weight !== 'w_equal') {
    return `${base} (${meta.aggregation_weight.replace('w_', '')})`;
  }
  return base;
}

function createRun(method, model, scenario, aggregationWeight) {
  const id = safeId(method, model, scenario, aggregationWeight);
  const metricWeight = method === 'aggregate' ? aggregationWeight : 'feature_aggregation';
  return {
    id,
    method,
    model,
    scenario,
    scenario_label: SCENARIO_LABELS[scenario] || scenario,
    scenario_series: scenarioSeries(scenario),
    aggregation_weight: aggregationWeight,
    supported_regions: [],
    supports_kecamatan: method === 'aggregate',
    has_shap_kecamatan: false,
    has_shap_kabupaten: false,
    has_shap_global: false,
    is_default: id === 'aggregate__GRU__J5_FULL__w_equal',
    is_production: id === 'aggregate__GRU__J5_FULL__w_equal',
    metrics: null,
    metric_weight: metricWeight,
    label: '',
  };
}

function ensureRun(runs, method, model, scenario, aggregationWeight) {
  const id = safeId(method, model, scenario, aggregationWeight);
  if (!runs.has(id)) {
    const meta = createRun(method, model, scenario, aggregationWeight);
    meta.label = runLabel(meta);
    runs.set(id, {
      meta,
      kecamatan: {},
      kabupaten: {},
      shap_kecamatan: {},
      shap_kabupaten: {},
      shap_global: [],
      _regions: new Set(),
    });
  }
  return runs.get(id);
}

function pushGroupedSeries(container, key, base, year, prediction, uncertainty, bps) {
  if (!container[key]) {
    container[key] = { ...base, _years: {} };
  }
  if (!container[key]._years[year]) {
    container[key]._years[year] = { predictions: [], uncertainties: [], bps: null };
  }
  container[key]._years[year].predictions.push(prediction);
  if (Number.isFinite(uncertainty)) container[key]._years[year].uncertainties.push(uncertainty);
  if (bps !== null && bps !== undefined && Number.isFinite(bps)) container[key]._years[year].bps = bps;
}

function finalizeEntityMap(container, predictionKey) {
  const out = {};
  for (const [key, entry] of Object.entries(container)) {
    const result = {};
    for (const [field, value] of Object.entries(entry)) {
      if (field !== '_years') result[field] = value;
    }
    result.series = Object.entries(entry._years)
      .map(([yearText, values]) => {
        const mean = values.predictions.reduce((sum, value) => sum + value, 0) / values.predictions.length;
        const spread = std(values.predictions, mean);
        const row = { year: Number(yearText) };
        if (predictionKey === 'prediction_dl_percent') {
          row.prediction_dl_percent = fixed(mean);
          row.std = fixed(spread);
        } else {
          row.prediction = fixed(mean);
          row.error = fixed(spread);
          row.bps = values.bps === null ? null : fixed(values.bps);
        }
        return row;
      })
      .sort((a, b) => a.year - b.year);
    const y2024 = result.series.find(row => row.year === 2024);
    const y2025 = result.series.find(row => row.year === 2025);
    const has2026 = result.series.some(row => row.year === 2026);
    if (y2024 && y2025 && !has2026) {
      if (predictionKey === 'prediction_dl_percent') {
        const projected = Math.max(0, y2025.prediction_dl_percent + (y2025.prediction_dl_percent - y2024.prediction_dl_percent));
        result.series.push({
          year: 2026,
          prediction_dl_percent: fixed(projected),
          std: y2025.std,
          prediction_type: 'linear_projection_from_2024_2025',
        });
      } else {
        const projected = Math.max(0, y2025.prediction + (y2025.prediction - y2024.prediction));
        result.series.push({
          year: 2026,
          prediction: fixed(projected),
          error: y2025.error,
          bps: null,
          prediction_type: 'linear_projection_from_2024_2025',
        });
      }
    }
    out[key] = result;
  }
  return out;
}

function addAggregateKecamatan(runs) {
  const csv = readCsv(path.join(aggregateRoot, 'aggregate_all_models_predictions_kecamatan.csv'));
  const col = name => csv.headers.indexOf(name);
  const idx = {
    model: col('model'),
    scenario: col('scenario'),
    seed: col('seed'),
    gid: col('GID_3'),
    name2: col('NAME_2'),
    name3: col('NAME_3'),
    year: col('tahun'),
    pred: col('prediction_kecamatan'),
    weight: col('aggregation_weight'),
  };

  for (const line of csv.lines) {
    const parts = rowParts(line);
    const model = parts[idx.model];
    if (!MODEL_ORDER.includes(model)) continue;
    const scenario = parts[idx.scenario];
    const weight = parts[idx.weight] || 'w_equal';
    const year = Number(parts[idx.year]);
    const pred = Number(parts[idx.pred]);
    if (!Number.isFinite(year) || !Number.isFinite(pred)) continue;

    const run = ensureRun(runs, 'aggregate', model, scenario, weight);
    const name2 = parts[idx.name2];
    const name3 = parts[idx.name3];
    const key = `${name2}|${name3}`;
    run._regions.add(name2);
    pushGroupedSeries(
      run.kecamatan,
      key,
      { gid_3: parts[idx.gid], name_2: name2, name_3: name3 },
      year,
      pred,
      null,
      null,
    );
  }
}

function addAggregateKabupaten(runs) {
  const csv = readCsv(path.join(aggregateRoot, 'aggregate_all_models_predictions_kabupaten.csv'));
  const col = name => csv.headers.indexOf(name);
  const idx = {
    model: col('model'),
    scenario: col('scenario'),
    name2: col('NAME_2'),
    year: col('tahun'),
    pred: col('prediction_kabupaten'),
    bps: col('target_bps'),
    weight: col('aggregation_weight'),
  };

  for (const line of csv.lines) {
    const parts = rowParts(line);
    const model = parts[idx.model];
    if (!MODEL_ORDER.includes(model)) continue;
    const scenario = parts[idx.scenario];
    const weight = parts[idx.weight] || 'w_equal';
    const year = Number(parts[idx.year]);
    const pred = Number(parts[idx.pred]);
    const bps = num(parts[idx.bps]);
    if (!Number.isFinite(year) || !Number.isFinite(pred)) continue;

    const run = ensureRun(runs, 'aggregate', model, scenario, weight);
    const name2 = parts[idx.name2];
    run._regions.add(name2);
    pushGroupedSeries(run.kabupaten, name2, {}, year, pred, null, bps);
  }
}

function addMumtazKabupaten(runs) {
  const csv = readCsv(path.join(mumtazRoot, 'mumtaz_all_models_predictions_kabupaten.csv'));
  const col = name => csv.headers.indexOf(name);
  const idx = {
    model: col('model'),
    scenario: col('scenario'),
    name2: col('NAME_2'),
    year: col('tahun'),
    pred: col('prediction_kabupaten'),
    bps: col('target_bps'),
  };

  for (const line of csv.lines) {
    const parts = rowParts(line);
    const model = parts[idx.model];
    if (!MODEL_ORDER.includes(model)) continue;
    const scenario = parts[idx.scenario];
    const year = Number(parts[idx.year]);
    const pred = Number(parts[idx.pred]);
    const bps = num(parts[idx.bps]);
    if (!Number.isFinite(year) || !Number.isFinite(pred)) continue;

    const run = ensureRun(runs, 'mumtaz', model, scenario, 'feature_aggregation');
    const name2 = parts[idx.name2];
    run._regions.add(name2);
    pushGroupedSeries(run.kabupaten, name2, {}, year, pred, null, bps);
  }
}

function addMetrics(runs, method, filePath) {
  const csv = readCsv(filePath);
  const col = name => csv.headers.indexOf(name);
  const idx = {
    model: col('model'),
    scenario: col('scenario'),
    weight: col('aggregation_weight'),
    split: col('split'),
    period: col('evaluation_period'),
    scope: col('eval_scope'),
    mae: col('mae_mean'),
    rmse: col('rmse_mean'),
    r2: col('r2_mean'),
    spearman: col('spearman_mean'),
    mape: col('mape_mean'),
  };

  for (const line of csv.lines) {
    const parts = rowParts(line);
    const model = parts[idx.model];
    if (!MODEL_ORDER.includes(model)) continue;
    const scenario = parts[idx.scenario];
    const weight = method === 'aggregate' ? (parts[idx.weight] || 'w_equal') : 'feature_aggregation';
    const split = parts[idx.split];
    const period = parts[idx.period];
    const scope = parts[idx.scope];
    const wantedScope = scenario.startsWith('N') ? 'nlp_regions' : 'all_available';
    if (split !== 'test' || period !== 'combined' || scope !== wantedScope) continue;

    const id = safeId(method, model, scenario, weight);
    const run = runs.get(id);
    if (!run) continue;
    run.meta.metrics = {
      mae: fixed(Number(parts[idx.mae]), 3),
      rmse: fixed(Number(parts[idx.rmse]), 3),
      r2: fixed(Number(parts[idx.r2]), 4),
      spearman: fixed(Number(parts[idx.spearman]), 4),
      mape: fixed(Number(parts[idx.mape]), 2),
    };
  }
}

function topRows(rows, maxRows = 8) {
  return rows
    .sort((a, b) => Math.abs(b.shap_value) - Math.abs(a.shap_value))
    .slice(0, maxRows)
    .map(row => ({
      feature: row.feature,
      modality: row.modality,
      label: labelFeature(row.feature),
      shap_value: fixed(row.shap_value, 4),
      abs_shap: fixed(Math.abs(row.shap_value), 4),
    }));
}

function addShapMaps(runs) {
  const aggregateId = safeId('aggregate', 'GRU', 'J5_FULL', 'w_equal');
  const aggregateRun = runs.get(aggregateId);
  if (aggregateRun) {
    const kecPath = path.join(shapRoot, 'shap_values_kecamatan_tahun.csv');
    if (fs.existsSync(kecPath)) {
      const csv = readCsv(kecPath);
      const col = name => csv.headers.indexOf(name);
      const idx = {
        name2: col('NAME_2'),
        name3: col('NAME_3'),
        year: col('tahun'),
        feature: col('feature'),
        modality: col('modality'),
        value: col('shap_value'),
      };
      const grouped = {};
      for (const line of csv.lines) {
        const parts = rowParts(line);
        const key = `${parts[idx.name2]}|${parts[idx.name3]}`;
        const year = String(parts[idx.year]);
        if (!grouped[key]) grouped[key] = {};
        if (!grouped[key][year]) grouped[key][year] = [];
        grouped[key][year].push({
          feature: parts[idx.feature],
          modality: parts[idx.modality],
          shap_value: Number(parts[idx.value]),
        });
      }
      for (const [key, years] of Object.entries(grouped)) {
        aggregateRun.shap_kecamatan[key] = {};
        for (const [year, rows] of Object.entries(years)) {
          aggregateRun.shap_kecamatan[key][year] = topRows(rows);
        }
      }
      aggregateRun.meta.has_shap_kecamatan = true;
    }

    const kabPath = path.join(shapRoot, 'shap_values_kabupaten_tahun.csv');
    if (fs.existsSync(kabPath)) {
      const csv = readCsv(kabPath);
      const col = name => csv.headers.indexOf(name);
      const idx = {
        name2: col('NAME_2'),
        year: col('tahun'),
        feature: col('feature'),
        modality: col('modality'),
        value: col('shap_value'),
      };
      const grouped = {};
      for (const line of csv.lines) {
        const parts = rowParts(line);
        const key = parts[idx.name2];
        const year = String(parts[idx.year]);
        if (!grouped[key]) grouped[key] = {};
        if (!grouped[key][year]) grouped[key][year] = [];
        grouped[key][year].push({
          feature: parts[idx.feature],
          modality: parts[idx.modality],
          shap_value: Number(parts[idx.value]),
        });
      }
      for (const [key, years] of Object.entries(grouped)) {
        aggregateRun.shap_kabupaten[key] = {};
        for (const [year, rows] of Object.entries(years)) {
          aggregateRun.shap_kabupaten[key][year] = topRows(rows);
        }
      }
      aggregateRun.meta.has_shap_kabupaten = true;
    }

    const globalPath = path.join(shapRoot, 'shap_global_importance.csv');
    if (fs.existsSync(globalPath)) {
      const csv = readCsv(globalPath);
      const col = name => csv.headers.indexOf(name);
      const idx = {
        feature: col('feature'),
        modality: col('modality'),
        meanAbs: col('mean_abs_shap'),
        meanSigned: col('mean_signed_shap'),
      };
      aggregateRun.shap_global = csv.lines.map(line => {
        const parts = rowParts(line);
        return {
          feature: parts[idx.feature],
          modality: parts[idx.modality],
          label: labelFeature(parts[idx.feature]),
          mean_abs_shap: fixed(Number(parts[idx.meanAbs]), 4),
          mean_signed_shap: fixed(Number(parts[idx.meanSigned]), 4),
        };
      }).slice(0, 50);
      aggregateRun.meta.has_shap_global = true;
    }
  }

  const mumtazPath = path.join(shapRoot, 'shap_values_kabupaten_tahun_mumtaz.csv');
  if (fs.existsSync(mumtazPath)) {
    const csv = readCsv(mumtazPath);
    const col = name => csv.headers.indexOf(name);
    const idx = {
      model: col('model'),
      scenario: col('scenario'),
      name2: col('NAME_2'),
      year: col('tahun'),
      feature: col('feature'),
      modality: col('modality'),
      value: col('shap_value'),
    };
    const byRun = {};
    const globalRows = {};
    for (const line of csv.lines) {
      const parts = rowParts(line);
      const id = safeId('mumtaz', parts[idx.model], parts[idx.scenario], 'feature_aggregation');
      if (!runs.has(id)) continue;
      const name2 = parts[idx.name2];
      const year = String(parts[idx.year]);
      const row = {
        feature: parts[idx.feature],
        modality: parts[idx.modality],
        shap_value: Number(parts[idx.value]),
      };
      if (!byRun[id]) byRun[id] = {};
      if (!byRun[id][name2]) byRun[id][name2] = {};
      if (!byRun[id][name2][year]) byRun[id][name2][year] = [];
      byRun[id][name2][year].push(row);

      const gkey = `${id}|${row.feature}|${row.modality}`;
      if (!globalRows[gkey]) globalRows[gkey] = { id, feature: row.feature, modality: row.modality, values: [] };
      globalRows[gkey].values.push(Math.abs(row.shap_value));
    }
    for (const [id, districtMap] of Object.entries(byRun)) {
      const run = runs.get(id);
      for (const [name2, years] of Object.entries(districtMap)) {
        run.shap_kabupaten[name2] = {};
        for (const [year, rows] of Object.entries(years)) {
          run.shap_kabupaten[name2][year] = topRows(rows);
        }
      }
      run.meta.has_shap_kabupaten = true;
    }
    for (const row of Object.values(globalRows)) {
      const run = runs.get(row.id);
      if (!run) continue;
      const mean = row.values.reduce((sum, value) => sum + value, 0) / row.values.length;
      run.shap_global.push({
        feature: row.feature,
        modality: row.modality,
        label: labelFeature(row.feature),
        mean_abs_shap: fixed(mean, 4),
        mean_signed_shap: null,
      });
      run.meta.has_shap_global = true;
    }
    for (const run of runs.values()) {
      run.shap_global.sort((a, b) => (b.mean_abs_shap ?? 0) - (a.mean_abs_shap ?? 0));
      run.shap_global = run.shap_global.slice(0, 50);
    }
  }
}

function addBatchGlobalShap(runs) {
  const summaryPath = path.join(shapRoot, 'batch_outputs', 'batch_shap_global_importance_summary.csv');
  if (!fs.existsSync(summaryPath)) return;

  const csv = readCsv(summaryPath);
  const col = name => csv.headers.indexOf(name);
  const idx = {
    runId: col('run_id'),
    feature: col('feature'),
    featureLabel: col('feature_label'),
    modality: col('modality'),
    meanAbs: col('mean_abs_shap'),
    meanSigned: col('mean_signed_shap'),
  };
  const grouped = {};
  for (const line of csv.lines) {
    const parts = rowParts(line);
    const id = parts[idx.runId];
    if (!runs.has(id)) continue;
    if (!grouped[id]) grouped[id] = [];
    grouped[id].push({
      feature: parts[idx.feature],
      modality: parts[idx.modality],
      label: parts[idx.featureLabel] || labelFeature(parts[idx.feature]),
      mean_abs_shap: fixed(Number(parts[idx.meanAbs]), 6),
      mean_signed_shap: fixed(Number(parts[idx.meanSigned]), 6),
    });
  }

  for (const [id, rows] of Object.entries(grouped)) {
    const run = runs.get(id);
    run.shap_global = rows
      .sort((a, b) => (b.mean_abs_shap ?? 0) - (a.mean_abs_shap ?? 0))
      .slice(0, 50);
    run.meta.has_shap_global = run.shap_global.length > 0;
  }
}

function finalizeRuns(runs) {
  for (const run of runs.values()) {
    run.meta.supported_regions = Array.from(run._regions).sort((a, b) => a.localeCompare(b));
    run.kecamatan = finalizeEntityMap(run.kecamatan, 'prediction_dl_percent');
    run.kabupaten = finalizeEntityMap(run.kabupaten, 'prediction');
    delete run._regions;
  }
}

function orderValue(list, value) {
  const idx = list.indexOf(value);
  return idx === -1 ? list.length + 1 : idx;
}

function prediction2026Rows(run) {
  const rows = [];
  const common = {
    run_id: run.meta.id,
    method: run.meta.method,
    model: run.meta.model,
    scenario: run.meta.scenario,
    scenario_label: run.meta.scenario_label,
    scenario_series: run.meta.scenario_series,
    aggregation_weight: run.meta.aggregation_weight,
  };

  for (const [entityKey, entity] of Object.entries(run.kecamatan)) {
    const row2026 = entity.series.find(row => row.year === 2026);
    if (!row2026) continue;
    rows.push({
      ...common,
      region_level: 'kecamatan',
      regency: entity.name_2,
      district: entity.name_3,
      entity_key: entityKey,
      year: 2026,
      prediction: row2026.prediction_dl_percent,
      uncertainty: row2026.std,
      bps: '',
      prediction_type: row2026.prediction_type || 'model_output',
    });
  }

  for (const [entityKey, entity] of Object.entries(run.kabupaten)) {
    const row2026 = entity.series.find(row => row.year === 2026);
    if (!row2026) continue;
    rows.push({
      ...common,
      region_level: 'kabupaten',
      regency: entity.name_2 || entityKey,
      district: '',
      entity_key: entityKey,
      year: 2026,
      prediction: row2026.prediction,
      uncertainty: row2026.error,
      bps: row2026.bps,
      prediction_type: row2026.prediction_type || 'model_output',
    });
  }

  return rows;
}

function writeOutput(runs) {
  ensureDir(apiRoot);
  cleanDir(runsRoot);
  const runMetas = Array.from(runs.values()).map(run => run.meta).sort((a, b) => {
    const method = a.method.localeCompare(b.method);
    if (method !== 0) return method;
    const model = orderValue(MODEL_ORDER, a.model) - orderValue(MODEL_ORDER, b.model);
    if (model !== 0) return model;
    const scenario = orderValue(SCENARIO_ORDER, a.scenario) - orderValue(SCENARIO_ORDER, b.scenario);
    if (scenario !== 0) return scenario;
    return orderValue(WEIGHT_ORDER, a.aggregation_weight) - orderValue(WEIGHT_ORDER, b.aggregation_weight);
  });

  for (const run of runs.values()) {
    const out = {
      meta: run.meta,
      kecamatan: run.kecamatan,
      kabupaten: run.kabupaten,
      shap_kecamatan: run.shap_kecamatan,
      shap_kabupaten: run.shap_kabupaten,
      shap_global: run.shap_global,
    };
    fs.writeFileSync(path.join(runsRoot, `${run.meta.id}.json`), JSON.stringify(out));
  }

  const index = {
    default_run_id: 'aggregate__GRU__J5_FULL__w_equal',
    nlp_regions: NLP_REGIONS,
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025, 2026],
    runs: runMetas,
  };
  fs.writeFileSync(path.join(apiRoot, 'data_scenario_runs.json'), JSON.stringify(index, null, 2));

  const predictionHeaders = [
    'run_id',
    'method',
    'model',
    'scenario',
    'scenario_label',
    'scenario_series',
    'aggregation_weight',
    'region_level',
    'regency',
    'district',
    'entity_key',
    'year',
    'prediction',
    'uncertainty',
    'bps',
    'prediction_type',
  ];
  const predictionRows = Array.from(runs.values()).flatMap(prediction2026Rows);
  fs.writeFileSync(
    path.join(apiRoot, 'scenario_predictions_2026.csv'),
    [
      predictionHeaders.join(','),
      ...predictionRows.map(row => predictionHeaders.map(header => csvCell(row[header])).join(',')),
    ].join('\n'),
  );

  console.log(`Generated ${runMetas.length} scenario run files in ${runsRoot}`);
}

function main() {
  const runs = new Map();
  addAggregateKecamatan(runs);
  addAggregateKabupaten(runs);
  addMumtazKabupaten(runs);
  addMetrics(runs, 'aggregate', path.join(aggregateRoot, 'aggregate_all_models_metrics_summary.csv'));
  addMetrics(runs, 'mumtaz', path.join(mumtazRoot, 'mumtaz_all_models_metrics_summary.csv'));
  addShapMaps(runs);
  addBatchGlobalShap(runs);
  finalizeRuns(runs);
  writeOutput(runs);
}

main();
