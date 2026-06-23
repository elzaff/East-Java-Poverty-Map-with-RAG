const fs = require('fs');
const path = require('path');

const file1 = path.join(__dirname, '../public/data/dashboard_predictions_kecamatan.csv');
const file2 = path.join(__dirname, '../public/data/dashboard_predictions_2026_kecamatan.csv');
const outputJson = path.join(__dirname, '../public/api/data_predictions_kecamatan.json');

const data = {};

function parseFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, 'utf8').split('\n').filter(x => x.trim().length > 0);
  const headers = raw[0].split(',').map(h => h.trim());

  const cGid = headers.indexOf('gid_3');
  const cName2 = headers.indexOf('name_2');
  const cName3 = headers.indexOf('name_3');
  const cYear = headers.indexOf('year');
  const cPred = headers.indexOf('prediction_dl_percent');
  const cStd = headers.indexOf('prediction_dl_seed_std');

  for (let i = 1; i < raw.length; i++) {
    const parts = raw[i].split(',').map(p => p.trim());
    const gid = parts[cGid];
    const name2 = parts[cName2];
    const name3 = parts[cName3];
    const year = parseInt(parts[cYear], 10);
    const pred = parseFloat(parts[cPred]);
    let std = cStd !== -1 ? parseFloat(parts[cStd]) : 0;
    if (isNaN(std)) std = 0;

    if (isNaN(year) || isNaN(pred)) continue;

    const key = `${name2}|${name3}`;
    if (!data[key]) {
      data[key] = {
        gid_3: gid,
        name_2: name2,
        name_3: name3,
        series: []
      };
    }
    
    // check if year already exists to avoid duplicates
    const existing = data[key].series.find(s => s.year === year);
    if (!existing) {
      data[key].series.push({
        year: year,
        prediction_dl_percent: pred,
        std: std
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
console.log('Successfully generated data_predictions_kecamatan.json from final data');
