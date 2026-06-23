import { Kecamatan, TimeseriesDataPoint, ShapValue, ModelMetrics } from './types';

export const JAWA_TIMUR_REGENCY_COORDINATES = [
  { id: 'SBY', name: 'Surabaya', lng: 112.7521, lat: -7.2575, isCore: true },
  { id: 'GRS', name: 'Gresik', lng: 112.6555, lat: -7.1564, isCore: true },
  { id: 'BNG', name: 'Bangkalan', lng: 112.7351, lat: -7.0455, isCore: true },
  { id: 'SDA', name: 'Sidoarjo', lng: 112.7183, lat: -7.4522 },
  { id: 'MJK', name: 'Mojokerto', lng: 112.4333, lat: -7.4667 },
  { id: 'JMB', name: 'Jombang', lng: 112.2333, lat: -7.5500 },
  { id: 'BJN', name: 'Bojonegoro', lng: 111.8833, lat: -7.1500 },
  { id: 'TBN', name: 'Tuban', lng: 112.0667, lat: -6.9000 },
  { id: 'LMG', name: 'Lamongan', lng: 112.4167, lat: -7.1167 },
  { id: 'MLG', name: 'Malang', lng: 112.6304, lat: -7.9819 },
  { id: 'PAS', name: 'Pasuruan', lng: 112.9033, lat: -7.6417 },
  { id: 'PRO', name: 'Probolinggo', lng: 113.2167, lat: -7.7500 },
  { id: 'LUM', name: 'Lumajang', lng: 113.2244, lat: -8.1331 },
  { id: 'JBR', name: 'Jember', lng: 113.7001, lat: -8.1724 },
  { id: 'BYW', name: 'Banyuwangi', lng: 114.3692, lat: -8.2192 },
  { id: 'BND', name: 'Bondowoso', lng: 113.8217, lat: -7.9133 },
  { id: 'SIT', name: 'Situbondo', lng: 113.9833, lat: -7.7000 },
  { id: 'KDR', name: 'Kediri', lng: 112.0119, lat: -7.8167 },
  { id: 'NGJ', name: 'Nganjuk', lng: 111.9000, lat: -7.6000 },
  { id: 'MDN', name: 'Madiun', lng: 111.5167, lat: -7.6167 },
  { id: 'MGT', name: 'Magetan', lng: 111.3333, lat: -7.6500 },
  { id: 'NGW', name: 'Ngawi', lng: 111.4500, lat: -7.4000 },
  { id: 'PON', name: 'Ponorogo', lng: 111.4667, lat: -7.8667 },
  { id: 'PCT', name: 'Pacitan', lng: 111.1000, lat: -8.2000 },
  { id: 'TRG', name: 'Trenggalek', lng: 111.7136, lat: -8.1000 },
  { id: 'TLG', name: 'Tulungagung', lng: 111.9017, lat: -8.0833 },
  { id: 'BLT', name: 'Blitar', lng: 112.1628, lat: -8.0983 },
  { id: 'SMP', name: 'Sampang', lng: 113.2500, lat: -7.1167 },
  { id: 'PMK', name: 'Pamekasan', lng: 113.4833, lat: -7.1667 },
  { id: 'SMN', name: 'Sumenep', lng: 113.8667, lat: -7.0167 }
];

const CORE_KECAMATAN: Kecamatan[] = [
  // Bangkalan (18 kecamatan)
  { gid_3: 'BNG-3526130', name_3: 'Arosbaya',     name_2: 'Bangkalan', lng: 112.8435, lat: -6.9680 },
  { gid_3: 'BNG-3526110', name_3: 'Bangkalan',    name_2: 'Bangkalan', lng: 112.7346, lat: -7.0348 },
  { gid_3: 'BNG-3526050', name_3: 'Blega',        name_2: 'Bangkalan', lng: 113.0542, lat: -7.1256 },
  { gid_3: 'BNG-03',      name_3: 'Burneh',       name_2: 'Bangkalan', lng: 112.8027, lat: -7.0316 },
  { gid_3: 'BNG-3526070', name_3: 'Galis',        name_2: 'Bangkalan', lng: 112.9689, lat: -7.0888 },
  { gid_3: 'BNG-3526140', name_3: 'Geger',        name_2: 'Bangkalan', lng: 112.9332, lat: -6.9930 },
  { gid_3: 'BNG-01',      name_3: 'Kamal',        name_2: 'Bangkalan', lng: 112.7385, lat: -7.1333 },
  { gid_3: 'BNG-3526180', name_3: 'Klampis',      name_2: 'Bangkalan', lng: 112.8819, lat: -6.9321 },
  { gid_3: 'BNG-3526150', name_3: 'Kokop',        name_2: 'Bangkalan', lng: 113.0725, lat: -6.9762 },
  { gid_3: 'BNG-3526060', name_3: 'Konang',       name_2: 'Bangkalan', lng: 113.0564, lat: -7.0463 },
  { gid_3: 'BNG-3526030', name_3: 'Kwanyar',      name_2: 'Bangkalan', lng: 112.8824, lat: -7.1423 },
  { gid_3: 'BNG-3526020', name_3: 'Labang',       name_2: 'Bangkalan', lng: 112.7834, lat: -7.1328 },
  { gid_3: 'BNG-3526040', name_3: 'Modung',       name_2: 'Bangkalan', lng: 112.9849, lat: -7.1658 },
  { gid_3: 'BNG-3526170', name_3: 'Sepulu',       name_2: 'Bangkalan', lng: 112.9632, lat: -6.9339 },
  { gid_3: 'BNG-02',      name_3: 'Socah',        name_2: 'Bangkalan', lng: 112.7266, lat: -7.0793 },
  { gid_3: 'BNG-3526080', name_3: 'TanahMerah',   name_2: 'Bangkalan', lng: 112.8712, lat: -7.0782 },
  { gid_3: 'BNG-3526160', name_3: 'Tanjungbumi',  name_2: 'Bangkalan', lng: 113.0667, lat: -6.9128 },
  { gid_3: 'BNG-04',      name_3: 'Tragah',       name_2: 'Bangkalan', lng: 112.8223, lat: -7.1047 },
  // Gresik (18 kecamatan)
  { gid_3: 'GRS-3525070', name_3: 'Balongpanggang', name_2: 'Gresik', lng: 112.4233, lat: -7.2863 },
  { gid_3: 'GRS-3525060', name_3: 'Benjeng',      name_2: 'Gresik', lng: 112.4913, lat: -7.2558 },
  { gid_3: 'GRS-3525120', name_3: 'Bungah',       name_2: 'Gresik', lng: 112.5839, lat: -7.0344 },
  { gid_3: 'GRS-3525050', name_3: 'Cerme',        name_2: 'Gresik', lng: 112.5585, lat: -7.2197 },
  { gid_3: 'GRS-03',      name_3: 'Driyorejo',    name_2: 'Gresik', lng: 112.6108, lat: -7.3507 },
  { gid_3: 'GRS-3525080', name_3: 'Duduksampeyan',name_2: 'Gresik', lng: 112.5193, lat: -7.1498 },
  { gid_3: 'GRS-3525140', name_3: 'Dukun',        name_2: 'Gresik', lng: 112.4550, lat: -6.9878 },
  { gid_3: 'GRS-3525100', name_3: 'Gresik',       name_2: 'Gresik', lng: 112.6473, lat: -7.1607 },
  { gid_3: 'GRS-01',      name_3: 'Kebomas',      name_2: 'Gresik', lng: 112.6162, lat: -7.1689 },
  { gid_3: 'GRS-3525030', name_3: 'Kedamean',     name_2: 'Gresik', lng: 112.5243, lat: -7.3215 },
  { gid_3: 'GRS-02',      name_3: 'Manyar',       name_2: 'Gresik', lng: 112.5931, lat: -7.0952 },
  { gid_3: 'GRS-04',      name_3: 'Menganti',     name_2: 'Gresik', lng: 112.5945, lat: -7.2698 },
  { gid_3: 'GRS-3525150', name_3: 'Panceng',      name_2: 'Gresik', lng: 112.4681, lat: -6.9384 },
  { gid_3: 'GRS-3525170', name_3: 'Sangkapura',   name_2: 'Gresik', lng: 112.6529, lat: -5.8182 },
  { gid_3: 'GRS-3525130', name_3: 'Sidayu',       name_2: 'Gresik', lng: 112.5527, lat: -6.9731 },
  { gid_3: 'GRS-3525180', name_3: 'Tambak',       name_2: 'Gresik', lng: 112.6529, lat: -5.7547 },
  { gid_3: 'GRS-3525160', name_3: 'Ujungpangkah', name_2: 'Gresik', lng: 112.5463, lat: -6.9145 },
  { gid_3: 'GRS-3525010', name_3: 'Wringinanom',  name_2: 'Gresik', lng: 112.5140, lat: -7.3687 },
  // Surabaya (31 kecamatan)
  { gid_3: 'SBY-3578270', name_3: 'Asemrowo',     name_2: 'Surabaya', lng: 112.6893, lat: -7.2390 },
  { gid_3: 'SBY-05',      name_3: 'Benowo',        name_2: 'Surabaya', lng: 112.6479, lat: -7.2325 },
  { gid_3: 'SBY-3578250', name_3: 'Bubutan',       name_2: 'Surabaya', lng: 112.7303, lat: -7.2491 },
  { gid_3: 'SBY-3578211', name_3: 'Bulak',         name_2: 'Surabaya', lng: 112.7870, lat: -7.2347 },
  { gid_3: 'SBY-3578120', name_3: 'DukuhPakis',    name_2: 'Surabaya', lng: 112.7007, lat: -7.2899 },
  { gid_3: 'SBY-3578030', name_3: 'Gayungan',      name_2: 'Surabaya', lng: 112.7246, lat: -7.3344 },
  { gid_3: 'SBY-3578190', name_3: 'Genteng',       name_2: 'Surabaya', lng: 112.7443, lat: -7.2612 },
  { gid_3: 'SBY-04',      name_3: 'Gubeng',        name_2: 'Surabaya', lng: 112.7610, lat: -7.2777 },
  { gid_3: 'SBY-3578060', name_3: 'GunungAnyar',   name_2: 'Surabaya', lng: 112.7945, lat: -7.3399 },
  { gid_3: 'SBY-3578020', name_3: 'Jambangan',     name_2: 'Surabaya', lng: 112.7168, lat: -7.3265 },
  { gid_3: 'SBY-3578010', name_3: 'KarangPilang',  name_2: 'Surabaya', lng: 112.6834, lat: -7.3336 },
  { gid_3: 'SBY-3578210', name_3: 'Kenjeran',      name_2: 'Surabaya', lng: 112.7711, lat: -7.2221 },
  { gid_3: 'SBY-3578260', name_3: 'Krembangan',    name_2: 'Surabaya', lng: 112.7224, lat: -7.2317 },
  { gid_3: 'SBY-3578140', name_3: 'Lakarsantri',   name_2: 'Surabaya', lng: 112.6569, lat: -7.3234 },
  { gid_3: 'SBY-3578090', name_3: 'Mulyorejo',     name_2: 'Surabaya', lng: 112.7720, lat: -7.2869 },
  { gid_3: 'SBY-3578240', name_3: 'PabeanCantian', name_2: 'Surabaya', lng: 112.7321, lat: -7.2187 },
  { gid_3: 'SBY-3578281', name_3: 'Pakal',         name_2: 'Surabaya', lng: 112.6149, lat: -7.2315 },
  { gid_3: 'SBY-02',      name_3: 'Rungkut',       name_2: 'Surabaya', lng: 112.8015, lat: -7.3155 },
  { gid_3: 'SBY-3578141', name_3: 'Sambikerep',    name_2: 'Surabaya', lng: 112.6601, lat: -7.2735 },
  { gid_3: 'SBY-3578170', name_3: 'Sawahan',       name_2: 'Surabaya', lng: 112.7186, lat: -7.2739 },
  { gid_3: 'SBY-3578230', name_3: 'Semampir',      name_2: 'Surabaya', lng: 112.7496, lat: -7.2156 },
  { gid_3: 'SBY-3578220', name_3: 'Simokerto',     name_2: 'Surabaya', lng: 112.7514, lat: -7.2397 },
  { gid_3: 'SBY-3578160', name_3: 'SukoManunggal', name_2: 'Surabaya', lng: 112.6994, lat: -7.2715 },
  { gid_3: 'SBY-3578080', name_3: 'Sukolilo',      name_2: 'Surabaya', lng: 112.8026, lat: -7.2903 },
  { gid_3: 'SBY-3578200', name_3: 'Tambaksari',    name_2: 'Surabaya', lng: 112.7696, lat: -7.2518 },
  { gid_3: 'SBY-3578150', name_3: 'Tandes',        name_2: 'Surabaya', lng: 112.6736, lat: -7.2591 },
  { gid_3: 'SBY-03',      name_3: 'Tegalsari',     name_2: 'Surabaya', lng: 112.7394, lat: -7.2746 },
  { gid_3: 'SBY-3578050', name_3: 'TenggilisMejoyo',name_2:'Surabaya', lng: 112.7580, lat: -7.3186 },
  { gid_3: 'SBY-3578130', name_3: 'Wiyung',        name_2: 'Surabaya', lng: 112.6882, lat: -7.3102 },
  { gid_3: 'SBY-3578040', name_3: 'Wonocolo',      name_2: 'Surabaya', lng: 112.7455, lat: -7.3239 },
  { gid_3: 'SBY-01',      name_3: 'Wonokromo',     name_2: 'Surabaya', lng: 112.7388, lat: -7.2955 },
];

const REAL_SUBDISTRICTS_MAP: Record<string, string[]> = {
  SDA: ['Waru', 'Gedangan', 'Taman'],
  MJK: ['Trowulan', 'Mojoanyar', 'Pacet'],
  JMB: ['Ploso', 'Peterongan', 'Diwek'],
  BJN: ['Kalitidu', 'Dander', 'Temayang'],
  TBN: ['Jatirogo', 'Palang', 'Rengel'],
  LMG: ['Paciran', 'Babat', 'Sekaran'],
  MLG: ['Singosari', 'Lawang', 'Kepanjen'],
  PAS: ['Pandaan', 'Bangil', 'Prigen'],
  PRO: ['Kraksaan', 'Sukapura', 'Paiton'],
  LUM: ['Senduro', 'Pasirian', 'Tempeh'],
  JBR: ['Ambulu', 'Tanggul', 'Patrang'],
  BYW: ['Kalibaru', 'Rogojampi', 'Genteng'],
  BND: ['Maesan', 'Wringin', 'Klabang'],
  SIT: ['Panarukan', 'Asembagus', 'Besuki'],
  KDR: ['Pare', 'Gampengrejo', 'Ngadiluwih'],
  NGJ: ['Kertosono', 'Loceret', 'Pace'],
  MDN: ['Saradan', 'Mejayan', 'Dolopo'],
  MGT: ['Sarangan', 'Plaosan', 'Maospati'],
  NGW: ['Sine', 'Mantingan', 'Geneng'],
  PON: ['Balong', 'Slahung', 'Babadan'],
  PCT: ['Punung', 'Ngadirojo', 'Arjosari'],
  TRG: ['Watulimo', 'Karangan', 'Dongko'],
  TLG: ['Ngunut', 'Kauman', 'Campurdarat'],
  BLT: ['Wlingi', 'Kanigoro', 'Ponggok'],
  SMP: ['Ketapang', 'Torjun', 'Camplong'],
  PMK: ['Pademawu', 'Larangan', 'Galis'],
  SMN: ['Kalianget', 'Lenteng', 'Pragaan']
};

const PROCEDURAL_KECAMATAN: Kecamatan[] = [];
JAWA_TIMUR_REGENCY_COORDINATES.forEach(reg => {
  if (reg.isCore) return;
  
  const subNames = REAL_SUBDISTRICTS_MAP[reg.id] || ['Kecamatan A', 'Kecamatan B', 'Kecamatan C'];
  
  PROCEDURAL_KECAMATAN.push({
    gid_3: `${reg.id}-01`,
    name_3: subNames[0],
    name_2: reg.name as any,
    lng: reg.lng + 0.05,
    lat: reg.lat + 0.04
  });
  PROCEDURAL_KECAMATAN.push({
    gid_3: `${reg.id}-02`,
    name_3: subNames[1],
    name_2: reg.name as any,
    lng: reg.lng - 0.06,
    lat: reg.lat - 0.05
  });
  PROCEDURAL_KECAMATAN.push({
    gid_3: `${reg.id}-03`,
    name_3: subNames[2],
    name_2: reg.name as any,
    lng: reg.lng + 0.015,
    lat: reg.lat - 0.01
  });
});

export const KECAMATAN_LIST: Kecamatan[] = [...CORE_KECAMATAN, ...PROCEDURAL_KECAMATAN];

export const MODEL_COMPARISONS: ModelMetrics[] = [
  { name: 'MLP (Tabular)', rmse: 0.12, mae: 0.09, mape: 12.4, r2: 0.65, status: 'Run', trainingTime: '45s', params: '2.4M' },
  { name: 'ResNet-tabular', rmse: 0.10, mae: 0.08, mape: 11.2, r2: 0.72, status: 'Run', trainingTime: '1m 20s', params: '4.8M' },
  { name: 'CNN-1D (Temporal)', rmse: 0.09, mae: 0.07, mape: 9.8, r2: 0.78, status: 'Run', trainingTime: '2m 10s', params: '3.1M' },
  { name: 'LSTM', rmse: 0.095, mae: 0.075, mape: 10.1, r2: 0.75, status: 'Run', trainingTime: '3m 05s', params: '6.5M' },
  { name: 'Temporal Fusion Transformer', rmse: 0.07, mae: 0.05, mape: 7.2, r2: 0.88, status: 'Run', trainingTime: '12m', params: '18M' },
  { name: 'Attention-MIL Image Fusion', rmse: 0.065, mae: 0.048, mape: 6.8, r2: 0.91, status: 'Run', trainingTime: '45m', params: '45M' },
  { name: 'ST-GNN (Graph)', rmse: 0.0, mae: 0.0, mape: 0.0, r2: 0.0, status: 'Pending', trainingTime: '-', params: '12M' }
];

// Helper to reliably generate pseudo-random data per region
function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function generateMockTimeseries(gid: string): TimeseriesDataPoint[] {
  const baseRisk = (hash(gid) % 50) / 100 + 0.1; // 0.1 to 0.6
  const data: TimeseriesDataPoint[] = [];
  
  for (let year = 2018; year <= 2026; year++) {
    const timeEffect = ((year - 2018) / 7) * 0.1; // small drift
    const noise = (Math.sin(year * 1.5 + hash(gid)) * 0.05);
    const risk = Math.max(0, Math.min(1, baseRisk + timeEffect + noise));
    
    data.push({
      year,
      poverty_risk_score: risk,
      estimasi_kemiskinan: Math.max(0, risk - 0.05 + (Math.random()*0.1)),
      prediction_dl: risk + (Math.random() * 0.04 - 0.02),
      prediction_error: Math.abs((Math.random() * 0.1)),
      ndvi: 0.2 + Math.random() * 0.4,
      ndbi: 0.1 + risk * 0.5,
      ndwi: 0.05 + Math.random() * 0.35,
      ntl: 0.8 - risk * 0.4,
      vanui: 0.5 + Math.random() * 0.3,
      distress_share: risk * 1.2,
      event_score_ketenagakerjaan: risk * 100 * (1 + Math.random()),
      event_score_infrastruktur: (1-risk) * 50 * Math.random(),
      event_score_ekonomi: Math.random() * 80
    });
  }
  return data;
}

export function generateShapValues(gid: string, year: number): ShapValue[] {
  const isHighRisk = hash(gid + year) % 2 === 0;
  
  if (isHighRisk) {
    return [
      { feature: 'event_score_Ketenagakerjaan', value: 0.15, actual_value: 85 },
      { feature: 'NDBI (Built-up Index)', value: 0.12, actual_value: 0.76 },
      { feature: 'distress_share', value: 0.08, actual_value: 0.34 },
      { feature: 'avg_distance_m', value: 0.05, actual_value: 4.2 },
      { feature: 'NTL (Night Time Lights)', value: -0.04, actual_value: 0.21 },
      { feature: 'event_score_Infrastruktur', value: -0.02, actual_value: 12 }
    ];
  } else {
    return [
      { feature: 'NTL (Night Time Lights)', value: -0.18, actual_value: 0.85 },
      { feature: 'event_score_Ekonomi_Lokal', value: -0.10, actual_value: 92 },
      { feature: 'NDVI (Vegetation)', value: -0.06, actual_value: 0.65 },
      { feature: 'VANUI', value: -0.05, actual_value: 0.77 },
      { feature: 'event_score_Bencana', value: 0.03, actual_value: 14 },
      { feature: 'distress_share', value: 0.02, actual_value: 0.11 }
    ];
  }
}
