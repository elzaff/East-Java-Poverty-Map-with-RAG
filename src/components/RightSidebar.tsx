import React, { useState, useEffect } from 'react';
import { Kecamatan, TimeseriesDataPoint, ShapValue } from '../types';
import { fetchTimeseries, fetchXai } from '../api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import { RagAnalyst } from './RagAnalyst';
import { MapPin } from 'lucide-react';
import { twMerge } from 'tailwind-merge';

interface RightSidebarProps {
  selectedKec: Kecamatan | null;
  year: number;
  activeLayer?: string;
}

export function RightSidebar({ selectedKec, year, activeLayer = 'estimasi_kemiskinan' }: RightSidebarProps) {
  const [data, setData] = useState<TimeseriesDataPoint[]>([]);
  const [xai, setXai] = useState<ShapValue[]>([]);
  const [activeTab, setActiveTab] = useState<'Ringkasan' | 'XAI' | 'Analis'>('Ringkasan');

  useEffect(() => {
    if (!selectedKec) return;
    fetchTimeseries(selectedKec.gid_3, selectedKec.name_2, selectedKec.name_3).then(setData);
    fetchXai(selectedKec.gid_3, year, selectedKec.name_2, selectedKec.name_3).then(setXai);
  }, [selectedKec, year]);

  if (!selectedKec) {
    return (
      <div className="w-80 h-full bg-[#111114] border-l border-white/10 flex items-center justify-center text-white/50 font-bold text-[10px] tracking-widest uppercase px-6 text-center z-40 shrink-0">
        SELECT A KECAMATAN TO VIEW INTELLIGENCE PROFILE
      </div>
    );
  }

  const currentData = data.find(d => d.year === year);

  // Build trend data — use prediction_dl_percent (%) if available, fallback to score*100
  const trendData = data.map(d => ({
    year: d.year,
    prediction: d.prediction_dl_percent ?? (d.poverty_risk_score * 100),
    aggregate: d.prediction_dl_aggregate,
    mumtaz: d.prediction_dl_mumtaz,
    bps: d.bps_poverty_percent
  }));
  const isKabupaten = selectedKec.gid_3.endsWith('-KAB');


  const povertyPct = currentData?.prediction_dl_percent ?? (currentData ? currentData.poverty_risk_score * 100 : null);

  // Determine if real data (non-zero indicators) or mock
  const hasRealVectors = currentData && (currentData.ndvi !== 0 || currentData.ndbi !== 0 || currentData.ntl !== 0);

  const isSpatialIndicator = ['ndvi', 'ndbi', 'ndwi', 'ntl', 'vanui'].includes(activeLayer);
  
  const getIndicatorLabel = (layer: string) => {
    switch(layer) {
      case 'ndvi': return 'INDEKS VEGETASI (NDVI)';
      case 'ndbi': return 'INDEKS BANGUNAN (NDBI)';
      case 'ndwi': return 'INDEKS AIR (NDWI)';
      case 'ntl': return 'CAHAYA MALAM (NTL)';
      case 'vanui': return 'URBANISASI (VANUI)';
      case 'poverty_delta': return 'PERUBAHAN YOY';
      case 'prediction_error': return 'UNCERTAINTY ERROR';
      default: return isKabupaten ? `ESTIMASI DIRECT DISTRICT` : `ESTIMASI DL`;
    }
  };

  const getIndicatorColor = (layer: string) => {
    switch(layer) {
      case 'ndvi': return '#22c55e'; // green
      case 'ndbi': return '#f97316'; // orange
      case 'ndwi': return '#3b82f6'; // blue
      case 'ntl': return '#eab308'; // yellow
      case 'vanui': return '#a855f7'; // purple
      default: return '#ef4444'; // red
    }
  };

  const activeColor = getIndicatorColor(activeLayer);
  const activeLabel = getIndicatorLabel(activeLayer);

  const getActiveVal = () => {
    if (!currentData) return null;
    if (activeLayer === 'poverty_risk_score' || activeLayer === 'estimasi_kemiskinan') {
      return currentData.prediction_dl_percent ?? (currentData.poverty_risk_score * 100);
    }
    return currentData[activeLayer] as number;
  };

  const activeVal = getActiveVal();

  return (
    <div className="w-80 h-full bg-[#111114] border-l border-white/10 flex flex-col z-40 shrink-0 shadow-2xl">
      {/* Header */}
      <div className="p-5 border-b border-white/5 shrink-0 bg-transparent">
        <div className="flex items-center gap-2 text-[10px] text-white/50 uppercase tracking-widest mb-1">
          <MapPin size={14} className="text-white/60" />
          {selectedKec.name_2}
        </div>
        <h2 className="text-lg font-bold text-white uppercase tracking-wider">{selectedKec.name_3}</h2>
        <div className="flex gap-2 items-start mt-3 flex-wrap">
          <div className="flex flex-col flex-1 min-w-[45%]">
            <div className="text-[9px] text-white/40 uppercase">
              {activeLabel} ({year})
            </div>
            <div className="text-xl font-mono font-bold" style={{ color: activeColor }}>
              {activeVal !== null && activeVal !== undefined 
                ? (isSpatialIndicator ? activeVal.toFixed(3) : activeVal.toFixed(2) + '%') 
                : '...'}
            </div>
          </div>
          {!isSpatialIndicator && currentData?.prediction_dl_aggregate !== undefined && (
            <div className="flex flex-col flex-1 min-w-[45%]">
              <div className="text-[9px] text-[#f59e0b]/80 uppercase">ESTIMASI AGGREGATE</div>
              <div className="text-lg font-mono text-[#f59e0b] font-bold mt-0.5">
                {currentData.prediction_dl_aggregate.toFixed(2)}%
              </div>
            </div>
          )}
          {!isSpatialIndicator && currentData?.prediction_dl_mumtaz !== undefined && !isKabupaten && (
            <div className="flex flex-col flex-1 min-w-[45%] mt-2">
              <div className="text-[9px] text-[#ec4899]/80 uppercase">ESTIMASI DIRECT DISTRICT</div>
              <div className="text-sm font-mono text-[#ec4899] font-bold mt-0.5">
                {currentData.prediction_dl_mumtaz.toFixed(2)}%
              </div>
            </div>
          )}
          {!isSpatialIndicator && currentData?.bps_poverty_percent !== undefined && currentData?.bps_poverty_percent !== null && (
            <div className="flex flex-col flex-1 min-w-[45%] mt-2">
              <div className="text-[9px] text-white/40 uppercase">BPS {isKabupaten ? 'GROUND TRUTH' : '(KABUPATEN)'}</div>
              <div className="text-sm font-mono text-white/60 mt-0.5">
                {currentData.bps_poverty_percent.toFixed(2)}%
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/5 shrink-0">
        {(['Ringkasan', 'XAI', 'Analis'] as const).map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={twMerge(
              "flex-1 py-3 text-[10px] uppercase tracking-widest font-bold transition-colors border-b-2",
              activeTab === t ? "border-red-500 text-[#e4e4e7]" : "border-transparent text-white/30 hover:text-white/60"
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {activeTab === 'Ringkasan' && (
          <div className="p-5 space-y-6">
            <div className="flex items-center gap-2 text-[10px] text-white/30 italic">
              <span>Disclaimer: Weak-supervised estimates, not official government ground truth.</span>
            </div>

            {/* Time Series */}
            <section>
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">
                {isSpatialIndicator ? 'Indikator Spasial' : 'Proyeksi Risiko (%)'}
              </h3>
              <div className="h-36 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data}>
                    <Tooltip
                      contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '12px', fontFamily: 'monospace' }}
                      itemStyle={{ color: activeColor }}
                      labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                      formatter={(value: any) => [isSpatialIndicator ? Number(value).toFixed(3) : `${Number(value).toFixed(2)}%`]}
                    />
                    <XAxis dataKey="year" tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }} />
                    <YAxis domain={['auto', 'auto']} hide />
                    
                    {isSpatialIndicator ? (
                      <Line
                        type="monotone"
                        dataKey={activeLayer}
                        stroke={activeColor}
                        strokeWidth={2}
                        dot={{ r: 2, fill: activeColor }}
                        activeDot={{ r: 4 }}
                        name={activeLabel}
                      />
                    ) : (
                      <>
                        <Line
                          type="monotone"
                          dataKey={activeLayer === 'poverty_delta' || activeLayer === 'prediction_error' ? activeLayer : 'prediction_dl_percent'}
                          stroke={activeColor}
                          strokeWidth={2}
                          dot={{ r: 2, fill: activeColor }}
                          activeDot={{ r: 4 }}
                          name={activeLabel}
                        />
                        {(activeLayer === 'estimasi_kemiskinan' || activeLayer === 'poverty_risk_score') && trendData.some(d => d.mumtaz !== undefined) && (
                          <Line
                            type="monotone"
                            dataKey="prediction_dl_mumtaz"
                            stroke="#ec4899"
                            strokeWidth={1.5}
                            strokeDasharray="3 3"
                            dot={{ r: 2, fill: '#ec4899' }}
                            activeDot={{ r: 3 }}
                            name="DL Direct District (Kab)"
                          />
                        )}
                        {(activeLayer === 'estimasi_kemiskinan' || activeLayer === 'poverty_risk_score') && trendData.some(d => d.aggregate !== undefined) && (
                          <Line
                            type="monotone"
                            dataKey="prediction_dl_aggregate"
                            stroke="#f59e0b"
                            strokeWidth={2}
                            dot={{ r: 2, fill: '#f59e0b' }}
                            activeDot={{ r: 4 }}
                            name="DL Aggregate"
                          />
                        )}
                        {(activeLayer === 'estimasi_kemiskinan' || activeLayer === 'poverty_risk_score') && trendData.some(d => d.bps !== undefined && d.bps !== null) && (
                          <Line
                            connectNulls={true}
                            type="monotone"
                            dataKey="bps_poverty_percent"
                            stroke="rgba(255,255,255,0.5)"
                            strokeWidth={1.5}
                            strokeDasharray="4 2"
                            dot={{ r: 2, fill: 'rgba(255,255,255,0.5)' }}
                            activeDot={{ r: 3 }}
                            name={isKabupaten ? "BPS Data Asli" : "BPS (Kabupaten)"}
                          />
                        )}
                      </>
                    )}
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="flex gap-3 mt-1 text-[9px] flex-wrap">
                <span className="flex items-center gap-1"><span className="w-3 h-0.5 inline-block" style={{ backgroundColor: activeColor }} /> {activeLabel}</span>
                {!isSpatialIndicator && (activeLayer === 'estimasi_kemiskinan' || activeLayer === 'poverty_risk_score') && trendData.some(d => d.mumtaz !== undefined) && (
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 border-t border-dashed border-[#ec4899] inline-block" /> DL Direct District (Kab)</span>
                )}
                {!isSpatialIndicator && (activeLayer === 'estimasi_kemiskinan' || activeLayer === 'poverty_risk_score') && trendData.some(d => d.aggregate !== undefined) && (
                  <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-[#f59e0b] inline-block" /> DL Aggregate</span>
                )}
                {!isSpatialIndicator && (activeLayer === 'estimasi_kemiskinan' || activeLayer === 'poverty_risk_score') && trendData.some(d => d.bps !== undefined && d.bps !== null) && (
                  <span className="flex items-center gap-1 text-white/40"><span className="w-3 h-0.5 border-t border-dashed border-white/40 inline-block" /> BPS {isKabupaten ? "" : "(Kab)"}</span>
                )}
              </div>
            </section>

            {/* Key Vectors — only show for mock data */}
            {hasRealVectors && (
              <section>
                <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Vektor Spasial ({year})</h3>
                <div className="space-y-2">
                  {[
                    { label: 'NDVI (Vegetation)', val: currentData?.ndvi },
                    { label: 'NDWI (Water Index)', val: currentData?.ndwi },
                    { label: 'NDBI (Built-Up)', val: currentData?.ndbi },
                    { label: 'NTL Proxy (Lights)', val: currentData?.ntl }
                  ].map(v => (
                    <div key={v.label} className="flex justify-between text-[11px] py-1 border-b border-white/5 last:border-0 font-sans">
                      <span className="text-white/80">{v.label}</span>
                      <span className="text-red-400 font-mono">{(v.val ?? 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {activeTab === 'XAI' && (
          <div className="p-5 space-y-6">
            <section>
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">SHAP Feature Importances ({year})</h3>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={xai} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="feature"
                      type="category"
                      width={130}
                      tick={{ fontSize: 9, fill: 'rgba(255,255,255,0.5)', fontFamily: 'monospace' }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      contentStyle={{ backgroundColor: '#1a1a1e', border: '1px solid rgba(255,255,255,0.1)', fontSize: '10px', fontFamily: 'monospace' }}
                      formatter={(v: any) => [Number(v).toFixed(4), 'SHAP']}
                    />
                    <Bar dataKey="value" radius={[2, 2, 2, 2]}>
                      {xai.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.value > 0 ? '#ef4444' : '#22c55e'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </section>

            <section>
              <h3 className="text-[10px] font-bold text-white/40 uppercase tracking-widest mb-4">Kontribusi Sumber Data (Global)</h3>
              <div className="space-y-2 text-[11px] text-white/80 border-t border-white/5 pt-4">
                <div className="flex justify-between"><span>Citra Satelit</span><span className="font-mono text-white/50">R² 0.91</span></div>
                <div className="flex justify-between"><span>Analisis Berita</span><span className="font-mono text-white/50">R² 0.78</span></div>
                <div className="flex justify-between"><span>Satelit + Berita</span><span className="font-mono text-white/60">R² 0.94</span></div>
                <div className="flex justify-between text-white font-bold border-t border-white/10 pt-2"><span>Semua Sumber (Produksi)</span><span className="text-red-400 font-mono">R² 0.96</span></div>
              </div>
            </section>
          </div>
        )}

        {activeTab === 'Analis' && (
          <div className="h-full p-2">
            <RagAnalyst contextGid={selectedKec.gid_3} contextYear={year} />
          </div>
        )}
      </div>
    </div>
  );
}
