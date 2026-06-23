const fs = require('fs');
const readline = require('readline');
const path = require('path');

const csvPath = 'c:\\Users\\ender\\OneDrive - Institut Teknologi Sepuluh Nopember\\Semester 4\\FP\\NOTEBOOK-DATAFINAL\\Data-DL\\dl_multimodal_kecamatan_tahun.csv';
const outPath = 'c:\\Users\\ender\\OneDrive - Institut Teknologi Sepuluh Nopember\\Semester 4\\FP\\poverty-map-web\\public\\api\\data_spatial_indicators.json';

async function processData() {
  const fileStream = fs.createReadStream(csvPath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let headers = [];
  const result = {};

  for await (const line of rl) {
    if (headers.length === 0) {
      headers = line.split(',');
      continue;
    }
    
    // Some basic parsing ignoring quoted commas (assuming simple format based on earlier inspection)
    const row = line.split(',');
    
    const getValue = (colName) => {
      const idx = headers.indexOf(colName);
      if (idx === -1) return 0;
      const val = parseFloat(row[idx]);
      return isNaN(val) ? 0 : val;
    };
    
    const name2Idx = headers.indexOf('NAME_2');
    const name3Idx = headers.indexOf('NAME_3');
    if (name2Idx === -1 || name3Idx === -1) continue;
    
    const name2 = row[name2Idx];
    const name3 = row[name3Idx];
    const year = parseInt(getValue('tahun'));
    
    if (!name2 || !name3 || isNaN(year)) continue;

    const ndvi = getValue('pcd_NDVI');
    const ndbi = getValue('pcd_NDBI');
    const ndwi = getValue('pcd_NDWI');
    const ntl = getValue('pcd_NTL');
    const vanui = getValue('pcd_VANUI');

    const key = `${name2}|${name3}`;
    if (!result[key]) {
      result[key] = { series: [] };
    }
    
    result[key].series.push({
      year,
      ndvi,
      ndbi,
      ndwi,
      ntl,
      vanui
    });
  }

  // Generate KAB aggregates
  const kabupatens = [...new Set(Object.keys(result).map(k => k.split('|')[0]))];
  
  kabupatens.forEach(kab => {
    const kabKey = `${kab}`;
    result[kabKey] = { series: [] };
    
    const kabKecs = Object.keys(result).filter(k => k.startsWith(kab + '|'));
    
    const yearlyAgg = {};
    kabKecs.forEach(kec => {
      result[kec].series.forEach(s => {
        if (!yearlyAgg[s.year]) {
          yearlyAgg[s.year] = { count: 0, ndvi: 0, ndbi: 0, ndwi: 0, ntl: 0, vanui: 0 };
        }
        yearlyAgg[s.year].ndvi += s.ndvi;
        yearlyAgg[s.year].ndbi += s.ndbi;
        yearlyAgg[s.year].ndwi += s.ndwi;
        yearlyAgg[s.year].ntl += s.ntl;
        yearlyAgg[s.year].vanui += s.vanui;
        yearlyAgg[s.year].count++;
      });
    });

    for (const [year, data] of Object.entries(yearlyAgg)) {
      if (data.count > 0) {
        result[kabKey].series.push({
          year: parseInt(year),
          ndvi: data.ndvi / data.count,
          ndbi: data.ndbi / data.count,
          ndwi: data.ndwi / data.count,
          ntl: data.ntl / data.count,
          vanui: data.vanui / data.count
        });
      }
    }
  });

  fs.writeFileSync(outPath, JSON.stringify(result, null, 0));
  console.log(`Generated spatial indicators for ${Object.keys(result).length} entities.`);
}

processData().catch(console.error);
