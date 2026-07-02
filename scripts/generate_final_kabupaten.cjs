const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, '../public/data/dashboard_predictions_kabupaten_direct_district.csv');
const file2 = path.join(__dirname, '../public/data/dashboard_predictions_2026_kabupaten_direct_district.csv');
const outputJson = path.join(__dirname, '../public/api/data_predictions_kabupaten.json');

const data = {};

function parseFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8').split('\n').filter(x => x.trim().length > 0);
  const headers = raw[0].split(',').map(h => h.trim());

  const cName2 = headers.indexOf('name_2');
  const cYear = headers.indexOf('year');
  const cPred = headers.indexOf('prediction_kabupaten');
  const cBps = headers.indexOf('bps_poverty_percent');
  const cStd = headers.indexOf('prediction_seed_std');

  for (let i = 1; i < raw.length; i++) {
    const parts = raw[i].split(',').map(p => p.trim());
    const name2 = parts[cName2];
    const year = parseInt(parts[cYear], 10);
    const pred = parseFloat(parts[cPred]);
    let bps = cBps !== -1 ? parseFloat(parts[cBps]) : null;
    if (isNaN(bps)) bps = null;
    let std = cStd !== -1 ? parseFloat(parts[cStd]) : 0;
    if (isNaN(std)) std = 0;

    if (isNaN(year) || isNaN(pred)) continue;

    if (!data[name2]) {
      data[name2] = {
        series: []
      };
    }
    
    // check if year already exists to avoid duplicates
    const existing = data[name2].series.find(s => s.year === year);
    if (!existing) {
      data[name2].series.push({
        year: year,
        bps: bps,
        prediction: pred,
        error: std
      });
    }
  }
}

parseFile(file1);
parseFile(file2);

// Sort series by year
for (const key in data) {
  data[key].series.sort((a, b) => a.year - b.year);
}

fs.writeFileSync(outputJson, JSON.stringify(data, null, 2));
console.log('Successfully generated data_predictions_kabupaten.json from final data');
