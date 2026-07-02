import React, { useState, useMemo, useCallback, useEffect } from 'react';
import Map, { NavigationControl, Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import * as turf from '@turf/turf';
import { LayerId, TimeseriesDataPoint, ShapValue, ScenarioRun } from '../types';
import { generateMockTimeseries, JAWA_TIMUR_REGENCY_COORDINATES } from '../mockData';
import { useTheme } from '../ThemeContext';
import { fetchScenarioRunData } from '../api';

interface MapStageProps {
  year: number;
  activeLayer: LayerId;
  layerData: Record<string, number>;
  selectedGid: string | null;
  onSelectKecamatan: (gid: string | null, name2?: string, name3?: string) => void;
  cityFilter: string;
  viewLevel: 'kecamatan' | 'kabupaten';
  activeRun: ScenarioRun | null;
}

function localHash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = Math.imul(31, h) + str.charCodeAt(i) | 0;
  return Math.abs(h);
}

export function MapStage({
  year,
  activeLayer,
  layerData,
  selectedGid,
  onSelectKecamatan,
  cityFilter,
  viewLevel,
  activeRun,
}: MapStageProps) {
  const { isDark } = useTheme();
  const mapStyle = isDark
    ? 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json'
    : 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json';
  const [viewState, setViewState] = useState({
    longitude: 112.72,
    latitude: -7.21,
    zoom: 9.3,
    pitch: 45,
    bearing: 0,
  });

  const [cityBoundaries, setCityBoundaries] = useState<any>(null);
  const [kabupatenBoundaries, setKabupatenBoundaries] = useState<any>(null);
  const [predKab, setPredKab] = useState<any>({});
  const [isLoadingBoundaries, setIsLoadingBoundaries] = useState(true);
  const [hoveredInfo, setHoveredInfo] = useState<{
    x: number;
    y: number;
    name_3: string;
    name_2: string;
    gid_3: string;
    val: number;
    metrics?: TimeseriesDataPoint;
    shap: ShapValue[];
  } | null>(null);

  const supportedRegions = useMemo(() => {
    if (!activeRun || activeRun.scenario_series !== 'N') return null;
    return new Set(activeRun.supported_regions);
  }, [activeRun]);

  const onMouseMove = useCallback((evt: any) => {
    const feature = evt.features && evt.features[0];
    if (feature && feature.properties && feature.properties.gid_3) {
      const gid_3 = feature.properties.gid_3;
      const name_3 = feature.properties.name_3 || '';
      const name_2 = feature.properties.name_2 || '';
      const val = feature.properties.val !== undefined ? feature.properties.val : (layerData[gid_3] || 0);

      const ts = generateMockTimeseries(gid_3).find(d => d.year === year) ?? {
        year,
        poverty_risk_score: val,
        estimasi_kemiskinan: val,
        prediction_dl: val / 100,
        ndvi: 0.2 + (localHash(gid_3) % 20) / 100,
        ndbi: 0.15 + (localHash(gid_3) % 30) / 100,
        ndwi: 0.05 + (localHash(gid_3) % 40) / 100,
        ntl: 0.6 - val * 0.04,
        vanui: 0.52 - val * 0.02,
        distress_share: val * 0.1,
        prediction_error: 0.05,
      };

      setHoveredInfo({
        x: evt.point.x,
        y: evt.point.y,
        name_3,
        name_2,
        gid_3,
        val,
        metrics: ts,
        shap: [],
      });
      return;
    }
    setHoveredInfo(null);
  }, [layerData, year]);

  useEffect(() => {
    async function fetchBoundaries() {
      try {
        const base = ((import.meta as any).env?.BASE_URL || '/').replace(/\/?$/, '/');
        const [kec, kab] = await Promise.all([
          fetch(`${base}api/kecamatan.json?t=${Date.now()}`).then(r => r.json()),
          fetch(`${base}api/kabupaten.json?t=${Date.now()}`).then(r => r.json()),
        ]);
        setKabupatenBoundaries(kab);

        const cities = ['Surabaya', 'Gresik', 'Bangkalan'];
        const cityFeatures: any[] = [];
        for (const city of cities) {
          const cityKecs = (kec.features as any[]).filter((f: any) => f.properties?.name_2 === city);
          if (cityKecs.length === 0) continue;
          try {
            let merged: any = cityKecs[0];
            for (let i = 1; i < cityKecs.length; i++) {
              merged = turf.union(turf.featureCollection([merged, cityKecs[i]]));
            }
            if (merged) {
              merged.properties = { name: city };
              cityFeatures.push(merged);
            }
          } catch {
            cityKecs.forEach((k: any) => cityFeatures.push({ ...k, properties: { name: city } }));
          }
        }
        setCityBoundaries({ type: 'FeatureCollection', features: cityFeatures });
      } catch (err) {
        console.error('Gagal memuat batas wilayah:', err);
      } finally {
        setIsLoadingBoundaries(false);
      }
    }
    fetchBoundaries();
  }, []);

  useEffect(() => {
    if (!activeRun) return;
    fetchScenarioRunData(activeRun).then(data => setPredKab(data.kabupaten)).catch(() => setPredKab({}));
  }, [activeRun]);

  const getColor = useCallback((val: number, layerId: LayerId, minVal: number = 0, maxVal: number = 1) => {
    const range = maxVal - minVal;
    const normalized = range === 0 ? 0 : (val - minVal) / range;
    const v = Math.max(0, Math.min(1, normalized));
    const idx = (stops: string[]) => stops[Math.min(Math.floor(v * stops.length), stops.length - 1)];

    if (layerId === 'poverty_risk_score' || layerId === 'estimasi_kemiskinan' || layerId === 'distress_share') {
      return idx(['#ffe44d','#ffd000','#ffb800','#ffa000','#ff7700','#ff4400','#ee1111','#cc0000','#880000','#2d0000']);
    }
    if (layerId === 'poverty_delta') return idx(['#166534','#16a34a','#4ade80','#f0fdf4','#fee2e2','#ef4444','#7c2d12']);
    if (layerId === 'prediction_error') return idx(['#0d0d0d','#1e1b4b','#4338ca','#818cf8','#c7d2fe','#ffffff']);
    if (layerId === 'ndvi') return idx(['#7c3a00','#a16207','#ca8a04','#84cc16','#22c55e','#166534']);
    if (layerId === 'ndbi') return idx(['#0d0d0d','#1c1917','#78350f','#b45309','#f59e0b','#fde68a']);
    if (layerId === 'ndwi') return idx(['#451a03','#92400e','#38bdf8','#0284c7','#075985','#0c4a6e']);
    if (layerId === 'ntl') return idx(['#0d0d0b','#1a1a00','#3d2b00','#f59e0b','#fde047','#ffffff']);
    if (layerId === 'vanui') return idx(['#0d0d0d','#2e1065','#6d28d9','#a855f7','#e879f9','#fdf4ff']);
    return idx(['#0d0d0d','#134e4a','#0f766e','#14b8a6','#5eead4','#ccfbf1']);
  }, []);

  const geojsonData = useMemo(() => {
    if (!kabupatenBoundaries) return null;

    const kabSum: Record<string, { sum: number; count: number }> = {};
    (kabupatenBoundaries.features as any[]).forEach((feat: any) => {
      const p = feat.properties;
      if (supportedRegions && !supportedRegions.has(p.name_2)) return;
      const nameKey = `${p.name_2}|${p.name_3}`;
      const v = layerData[nameKey] ?? layerData[p.gid_3] ?? layerData[p.name_2];
      if (v !== undefined && p.reg_id) {
        if (!kabSum[p.reg_id]) kabSum[p.reg_id] = { sum: 0, count: 0 };
        kabSum[p.reg_id].sum += v;
        kabSum[p.reg_id].count += 1;
      }
    });
    const kabVal: Record<string, number> = {};
    Object.entries(kabSum).forEach(([id, { sum, count }]) => {
      kabVal[id] = sum / count;
    });

    const rawFeatures: any[] = [];
    let minVal = Infinity;
    let maxVal = -Infinity;
    const isPovertyLayer = ['poverty_risk_score', 'estimasi_kemiskinan', 'poverty_delta', 'prediction_error'].includes(activeLayer);

    (kabupatenBoundaries.features as any[]).forEach((feat: any) => {
      const p = feat.properties;
      if (supportedRegions && !supportedRegions.has(p.name_2)) return;
      const isVisible = cityFilter === 'All' || p.name_2 === cityFilter;
      if (!isVisible) return;

      let val: number | undefined;
      let gid_3: string;

      if (viewLevel === 'kecamatan' && p.gid_3) {
        const nameKey = `${p.name_2}|${p.name_3}`;
        val = layerData[nameKey] ?? layerData[p.gid_3] ?? layerData[p.name_2];
        gid_3 = p.gid_3;
      } else {
        val = layerData[p.name_2] ?? kabVal[p.reg_id];
        gid_3 = `${p.reg_id}-KAB`;
      }

      if (val === undefined) {
        if (isPovertyLayer && activeRun) return;
        val = activeLayer === 'poverty_risk_score' || activeLayer === 'estimasi_kemiskinan'
          ? 15 + (localHash(gid_3) % 1000) / 100
          : 0.28 + (localHash(gid_3) % 40) / 100;
      }

      if (val < minVal) minVal = val;
      if (val > maxVal) maxVal = val;
      rawFeatures.push({ feat, val, gid_3, p });
    });

    if (minVal === Infinity) minVal = 0;
    if (maxVal === -Infinity) maxVal = 1;
    if (Math.abs(maxVal - minVal) < 1e-6) maxVal = minVal + 1;

    if (activeLayer === 'poverty_delta') {
      minVal = 0;
      maxVal = 1;
    } else if (activeLayer === 'ndvi') {
      minVal = 0;
      maxVal = 0.5;
    } else if (activeLayer === 'ndbi') {
      minVal = -0.2;
      maxVal = 0.1;
    } else if (activeLayer === 'ndwi') {
      minVal = -0.4;
      maxVal = 0;
    } else if (activeLayer === 'ntl') {
      minVal = 0;
      maxVal = 25;
    } else if (activeLayer === 'vanui') {
      minVal = 0;
      maxVal = 20;
    }

    const features = rawFeatures.map(({ feat, val, gid_3, p }) => ({
      ...feat,
      properties: {
        gid_3,
        reg_id: p.reg_id,
        name_3: viewLevel === 'kabupaten' ? p.name_2 : (p.name_3 || p.name_2),
        name_2: p.name_2,
        val,
        color: getColor(val, activeLayer, minVal, maxVal),
        opacity: 1,
        isSelected: selectedGid === gid_3,
      },
    }));

    return { type: 'FeatureCollection', features, dataMin: minVal, dataMax: maxVal };
  }, [layerData, activeLayer, selectedGid, cityFilter, getColor, viewLevel, kabupatenBoundaries, supportedRegions, activeRun]);

  const fillStyle: any = {
    id: 'kecamatan-fill',
    type: 'fill',
    paint: {
      'fill-color': ['get', 'color'],
      'fill-opacity': [
        'case',
        ['==', ['get', 'opacity'], 0], 0.0,
        ['==', ['get', 'isSelected'], true], 0.9,
        0.5,
      ],
    },
  };

  const lineStyle: any = {
    id: 'kecamatan-line',
    type: 'line',
    paint: {
      'line-color': [
        'case',
        ['==', ['get', 'isSelected'], true], '#ffffff',
        'rgba(255, 255, 255, 0.2)',
      ],
      'line-width': [
        'case',
        ['==', ['get', 'isSelected'], true], 3,
        1,
      ],
      'line-opacity': ['get', 'opacity'],
    },
  };

  const onMapClick = useCallback((evt: any) => {
    const feature = evt.features && evt.features[0];
    if (feature && feature.properties) {
      if (viewLevel === 'kabupaten') {
        onSelectKecamatan(feature.properties.gid_3, feature.properties.name_2, '');
      } else if (feature.properties.gid_3) {
        onSelectKecamatan(feature.properties.gid_3, feature.properties.name_2, feature.properties.name_3);
      }
    }
  }, [onSelectKecamatan, viewLevel]);

  const cityLineStyle: any = {
    id: 'city-boundary-line',
    type: 'line',
    paint: {
      'line-color': '#ffffff',
      'line-width': 2,
      'line-opacity': 0.8,
      'line-dasharray': [2, 2],
    },
  };

  const cityFillStyle: any = {
    id: 'city-boundary-fill',
    type: 'fill',
    paint: {
      'fill-color': 'rgba(255, 255, 255, 0.02)',
      'fill-opacity': 1,
    },
  };

  return (
    <div className="relative w-full h-full bg-[#0a0a0b] flex items-center justify-center overflow-hidden">
      <Map
        {...viewState}
        onMove={evt => setViewState(evt.viewState)}
        style={{ width: '100%', height: '100%' }}
        mapStyle={mapStyle}
        interactiveLayerIds={['kecamatan-fill']}
        onClick={onMapClick}
        onMouseMove={onMouseMove}
        onMouseLeave={() => setHoveredInfo(null)}
        cursor="crosshair"
      >
        <NavigationControl position="bottom-right" />

        {cityBoundaries && (
          <Source id="city-boundaries-data" type="geojson" data={cityBoundaries}>
            <Layer {...cityFillStyle} />
            <Layer {...cityLineStyle} />
          </Source>
        )}

        {geojsonData && (
          <Source id="kecamatan-data" type="geojson" data={geojsonData as any}>
            <Layer {...fillStyle} />
            <Layer {...lineStyle} />
          </Source>
        )}
      </Map>

      {hoveredInfo && (
        <div
          className="absolute z-50 pointer-events-none bg-[#111114]/95 border border-white/10 p-4 rounded-lg shadow-2xl backdrop-blur-md w-80 text-xs text-white/90 flex flex-col gap-3 transition-transform duration-75 font-sans"
          style={{
            left: hoveredInfo.x + 'px',
            top: hoveredInfo.y + 'px',
            transform: `translate3d(${hoveredInfo.x > window.innerWidth * 0.55 ? '-105%' : '15px'}, ${hoveredInfo.y > window.innerHeight * 0.55 ? '-105%' : '15px'}, 0)`,
          }}
        >
          <div className="flex items-start justify-between border-b border-white/5 pb-2">
            <div>
              <h4 className="text-xs font-bold text-white tracking-wide">{hoveredInfo.name_3}</h4>
              <p className="text-[10px] text-white/40">{hoveredInfo.name_2}</p>
            </div>
            <span className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[9px] font-mono text-white/60">
              {hoveredInfo.gid_3}
            </span>
          </div>

          <div>
            <div className="flex justify-between items-center bg-white/5 px-2.5 py-1.5 rounded border border-white/5 mb-2">
              <span className="text-[9px] text-white/50 uppercase tracking-wider font-medium">
                {activeLayer.replace(/_/g, ' ')} ({year})
              </span>
              <span className="text-xs font-bold text-red-400 font-mono">
                {hoveredInfo.val.toFixed(4)}
              </span>
            </div>

            {viewLevel === 'kabupaten' && (activeLayer === 'estimasi_kemiskinan' || activeLayer === 'poverty_risk_score') && (
              <div className="bg-black/30 border border-white/5 p-2 rounded mb-2 space-y-1.5">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-[#f59e0b]/80 uppercase font-bold tracking-wider">{activeRun?.method === 'mumtaz' ? 'DIRECT DISTRICT' : 'AGGREGATE'}</span>
                  <span className="font-mono text-[#f59e0b] font-bold">{hoveredInfo.val.toFixed(2)}%</span>
                </div>
                {predKab[hoveredInfo.name_2]?.series?.find((s: any) => s.year === year)?.bps != null && (
                  <div className="flex justify-between items-center text-[10px] pt-1 mt-1 border-t border-white/10">
                    <span className="text-white/50 uppercase font-bold tracking-wider">BPS GROUND TRUTH</span>
                    <span className="font-mono text-white/80 font-bold">{predKab[hoveredInfo.name_2].series.find((s: any) => s.year === year).bps.toFixed(2)}%</span>
                  </div>
                )}
              </div>
            )}

            {hoveredInfo.metrics && (
              <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 text-[10px]">
                <div className="flex justify-between border-b border-white/5 pb-0.5">
                  <span className="text-white/40">NDVI</span>
                  <span className="font-mono text-green-400 font-medium">{hoveredInfo.metrics.ndvi.toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-0.5">
                  <span className="text-white/40">NDBI</span>
                  <span className="font-mono text-blue-400 font-medium">{hoveredInfo.metrics.ndbi.toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-0.5">
                  <span className="text-white/40">NDWI</span>
                  <span className="font-mono text-cyan-400 font-medium">{(hoveredInfo.metrics.ndwi ?? 0.15).toFixed(3)}</span>
                </div>
                <div className="flex justify-between border-b border-white/5 pb-0.5">
                  <span className="text-white/40">NTL</span>
                  <span className="font-mono text-yellow-400 font-medium">{hoveredInfo.metrics.ntl.toFixed(3)}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {isLoadingBoundaries && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm pointer-events-none transition-opacity duration-300">
          <div className="flex flex-col items-center">
            <div className="w-8 h-8 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
            <div className="mt-4 text-white/80 font-mono text-xs tracking-widest uppercase">Fetching API Data...</div>
          </div>
        </div>
      )}

      <div className="absolute top-6 left-6 z-20 pointer-events-none bg-[#1a1a1e]/90 border border-white/10 p-4 rounded shadow-2xl backdrop-blur">
        <h2 className="text-[10px] text-white/50 uppercase tracking-widest mb-1">Active Run</h2>
        <div className="text-lg font-bold text-white uppercase">{activeRun ? `${activeRun.method} | ${activeRun.model}` : 'Loading'}</div>
        <div className="text-[10px] text-white/40 uppercase mt-1">{activeRun?.scenario ?? ''}</div>
        <div className="flex items-center justify-between text-[9px] font-mono text-white/40 uppercase mt-4 mb-1">
          <span>{geojsonData?.dataMin?.toFixed(2) ?? 'LOW'}</span>
          <span>{geojsonData?.dataMax?.toFixed(2) ?? 'HIGH'}</span>
        </div>
        <div className="flex items-center gap-0">
          <div className="flex w-48 h-2 rounded border border-white/10 overflow-hidden">
            {Array.from({ length: 10 }).map((_, i) => {
              const v = i / 9;
              return <div key={i} className="flex-1" style={{ backgroundColor: getColor(v, activeLayer, 0, 1) }} />;
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
