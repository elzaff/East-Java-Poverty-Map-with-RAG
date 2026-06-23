const fs = require('fs');
const path = require('path');

const inputCsv = 'C:/Users/ender/OneDrive - Institut Teknologi Sepuluh Nopember/Semester 4/FP/NOTEBOOK-DATAFINAL/DL/AGGREGATE/aggregate_all_models_deliverable/aggregate_all_models_predictions_kecamatan.csv';
const outputJson = path.join(__dirname, '../public/api/data_predictions_kecamatan.json');

const raw = fs.readFileSync(inputCsv, 'utf8').split('\n').filter(x => x.trim().length > 0);
const headers = raw[0].split(',');

const colName2 = headers.indexOf('NAME_2');
const colName3 = headers.indexOf('NAME_3');
const colGid = headers.indexOf('GID_3');
const colYear = headers.indexOf('tahun');
const colPred = headers.indexOf('prediction_kecamatan');

if (colName2 === -1 || colName3 === -1 || colYear === -1 || colPred === -1 || colGid === -1) {
  console.error("Missing columns");
  process.exit(1);
}

const groups = {};

// Group predictions by [NAME_2|NAME_3][year]
for (let i = 1; i < raw.length; i++) {
  const parts = raw[i].split(',');
  const name2 = parts[colName2];
  const name3 = parts[colName3];
  const gid = parts[colGid];
  const year = parseInt(parts[colYear], 10);
  const pred = parseFloat(parts[colPred]);

  if (isNaN(year) || isNaN(pred)) continue;

  const key = `${name2}|${name3}`;
  if (!groups[key]) {
    groups[key] = {
      gid_3: gid,
      name_2: name2,
      name_3: name3,
      years: {}
    };
  }
  
  if (!groups[key].years[year]) {
    groups[key].years[year] = { preds: [] };
  }
  groups[key].years[year].preds.push(pred);
}

const finalData = {};

for (const key in groups) {
  const group = groups[key];
  finalData[key] = {
    gid_3: group.gid_3,
    name_2: group.name_2,
    name_3: group.name_3,
    series: []
  };
  
  const years = Object.keys(group.years).map(Number).sort();
  for (const year of years) {
    const data = group.years[year];
    const n = data.preds.length;
    const mean = data.preds.reduce((a, b) => a + b, 0) / n;
    
    // Calculate standard deviation (error)
    const variance = data.preds.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / n;
    const std = Math.sqrt(variance);

    finalData[key].series.push({
      year: year,
      prediction_dl_percent: parseFloat(mean.toFixed(3)),
      std: parseFloat(std.toFixed(3))
    });
  }
}

fs.writeFileSync(outputJson, JSON.stringify(finalData, null, 2));
console.log('Successfully generated data_predictions_kecamatan.json with correct Aggregate data');
