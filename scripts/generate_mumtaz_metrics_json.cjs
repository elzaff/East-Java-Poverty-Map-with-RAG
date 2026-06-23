const fs = require('fs');
const path = require('path');

const csvPath = path.join(__dirname, '../../NOTEBOOK-DATAFINAL/Data-DL/mumtaz_all_models_deliverable/mumtaz_all_models_metrics_summary.csv');
const outPath = path.join(__dirname, '../public/api/data_mumtaz_metrics.json');

const csvData = fs.readFileSync(csvPath, 'utf-8');
const lines = csvData.split('\n').map(l => l.trim()).filter(l => l);

const headers = lines[0].split(',');
const col = (name) => headers.indexOf(name);

// method,model,scenario,aggregation_weight,split,evaluation_period,eval_scope,mae_mean,mae_std,mae_count,rmse_mean,rmse_std,rmse_count,r2_mean,r2_std,r2_count,spearman_mean,spearman_std,spearman_count,mape_mean,mape_std,mape_count,persistence_rmse,skill_vs_persistence

const metrics = [];

for (let i = 1; i < lines.length; i++) {
  const parts = lines[i].split(',');
  if (parts.length < headers.length) continue;

  const split = parts[col('split')];
  const evalPeriod = parts[col('evaluation_period')];
  const evalScope = parts[col('eval_scope')];
  const model = parts[col('model')];
  let scenario = parts[col('scenario')];

  // Only take test, combined
  if (split !== 'test' || evalPeriod !== 'combined') continue;

  // We want to map J1_PCD -> J1_PCD, N1_NLP -> N1_NLP, etc.
  // Wait, for J series we want all_available, for N series we want nlp_regions
  let isNSeries = scenario.startsWith('N');
  
  // Actually, we can just use the appropriate eval_scope.
  // In aggregate, J series used all_available, N series used nlp_regions.
  if (!isNSeries && evalScope !== 'all_available') continue;
  if (isNSeries && evalScope !== 'nlp_regions') continue;

  const mae = parseFloat(parts[col('mae_mean')]);
  const rmse = parseFloat(parts[col('rmse_mean')]);
  const r2 = parseFloat(parts[col('r2_mean')]);
  const spearman = parseFloat(parts[col('spearman_mean')]);
  const mape = parseFloat(parts[col('mape_mean')]);

  let label = `${model} - ${scenario}`;
  if (scenario === 'J5_FULL') label = `${model} - PCD + Image + NLP (Full)`;
  if (scenario === 'J1_PCD') label = `${model} - PCD Only`;
  if (scenario === 'J2_IMAGE') label = `${model} - Image Only`;
  if (scenario === 'J3_PCD_IMAGE') label = `${model} - PCD + Image`;
  if (scenario === 'J4_PCD_NLP') label = `${model} - PCD + NLP`;
  if (scenario === 'N1_NLP') label = `${model} - NLP Only`;
  if (scenario === 'N2_PCD_NLP') label = `${model} - PCD + NLP (NLP base)`;
  if (scenario === 'N3_IMAGE_NLP') label = `${model} - Image + NLP`;
  if (scenario === 'N4_FULL') label = `${model} - NLP Full`;

  const is_production = (model === 'MLP' && scenario === 'J3_PCD_IMAGE'); // As per bab5_bab6, this is absolute best for Mumtaz.
  const is_gru_j5 = (model === 'GRU' && scenario === 'J5_FULL'); // This is the prod model for Aggregate.

  metrics.push({
    model: model === 'GLOBAL_MEAN' ? 'GLOBAL_TRAIN_MEAN' : model,
    scenario,
    label,
    mae: parseFloat(mae.toFixed(3)),
    rmse: parseFloat(rmse.toFixed(3)),
    r2: parseFloat(r2.toFixed(4)),
    spearman: parseFloat(spearman.toFixed(4)),
    mape: parseFloat(mape.toFixed(2)),
    is_production: is_production || is_gru_j5
  });
}

fs.writeFileSync(outPath, JSON.stringify(metrics, null, 2));
console.log('Wrote to', outPath);
