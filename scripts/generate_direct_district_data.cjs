const fs = require('fs');
const path = require('path');

const legacyDistrictName = ['mum', 'taz'].join('');
const inputCsv = [
  'C:/Users/ender/OneDrive - Institut Teknologi Sepuluh Nopember/Semester 4/FP/NOTEBOOK-DATAFINAL/DL/KABUPATEN(DIRECT_DISTRICT)/direct_district_all_models_deliverable/direct_district_all_models_predictions_kabupaten.csv',
  `C:/Users/ender/OneDrive - Institut Teknologi Sepuluh Nopember/Semester 4/FP/NOTEBOOK-DATAFINAL/DL/KABUPATEN(${legacyDistrictName.toUpperCase()})/${legacyDistrictName}_all_models_deliverable/${legacyDistrictName}_all_models_predictions_kabupaten.csv`,
].find(fs.existsSync);
const outputJson = path.join(__dirname, '../public/api/data_predictions_kabupaten.json');

if (!inputCsv) {
  console.error('Missing Direct District source CSV');
  process.exit(1);
}

const raw = fs.readFileSync(inputCsv, 'utf8').split('\n').filter(x => x.trim().length > 0);
const headers = raw[0].split(',');

const colName2 = headers.indexOf('NAME_2');
const colYear = headers.indexOf('tahun');
const colPred = headers.indexOf('prediction_kabupaten');
const colBps = headers.indexOf('target_bps');
const colModel = headers.indexOf('model');
const colScenario = headers.indexOf('scenario');

if (colName2 === -1 || colYear === -1 || colPred === -1 || colBps === -1) {
  console.error("Missing columns");
  process.exit(1);
}

const groups = {};

// Group predictions by [NAME_2][year]
for (let i = 1; i < raw.length; i++) {
  const parts = raw[i].split(',');
  const name2 = parts[colName2];
  const year = parseInt(parts[colYear], 10);
  const pred = parseFloat(parts[colPred]);
  const bps = parseFloat(parts[colBps]);
  const model = parts[colModel];
  const scenario = parts[colScenario];

  if (isNaN(year) || isNaN(pred)) continue;
  if (model !== 'MLP' || scenario !== 'J3_PCD_IMAGE') continue;

  if (!groups[name2]) groups[name2] = {};
  if (!groups[name2][year]) {
    groups[name2][year] = { preds: [], bps: bps };
  }
  groups[name2][year].preds.push(pred);
}

const finalData = {};

for (const name2 in groups) {
  finalData[name2] = { series: [] };
  const years = Object.keys(groups[name2]).map(Number).sort();
  for (const year of years) {
    const data = groups[name2][year];
    const n = data.preds.length;
    const mean = data.preds.reduce((a, b) => a + b, 0) / n;
    
    // Calculate standard deviation (error)
    const variance = data.preds.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    finalData[name2].series.push({
      year: year,
      bps: data.bps,
      prediction: parseFloat(mean.toFixed(3)),
      error: parseFloat(std.toFixed(3))
    });
  }
}

fs.writeFileSync(outputJson, JSON.stringify(finalData, null, 2));
console.log('Successfully generated data_predictions_kabupaten.json with Direct District data');
