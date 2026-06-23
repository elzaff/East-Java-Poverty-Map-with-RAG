import React, { useState, useEffect } from 'react';
import { ThemeProvider } from './ThemeContext';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { BottomSlider } from './components/BottomSlider';
import { MapStage } from './components/MapStage';
import { ModelExplorer } from './components/ModelExplorer';
import { DataNotes } from './components/DataNotes';
import { RagAnalyst } from './components/RagAnalyst';
import { LayerId, Kecamatan } from './types';
import { fetchKecamatan, fetchLayerData } from './api';
import { JAWA_TIMUR_REGENCY_COORDINATES } from './mockData';
import './index.css';

export default function App() {
  const [activeView, setActiveView] = useState('map');
  const [year, setYear] = useState(2026);
  const [activeLayer, setActiveLayer] = useState<LayerId>('poverty_risk_score');
  const [cityFilter, setCityFilter] = useState('All');
  const [viewLevel, setViewLevel] = useState<'kecamatan' | 'kabupaten'>('kecamatan');
  
  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [selectedGid, setSelectedGid] = useState<string | null>('SBY-01');
  const [selectedName2, setSelectedName2] = useState<string | null>(null);
  const [selectedName3, setSelectedName3] = useState<string | null>(null);

  const handleViewLevelChange = (v: 'kecamatan' | 'kabupaten') => {
    setViewLevel(v);
    if (v === 'kabupaten' && selectedGid && !selectedGid.endsWith('-KAB')) {
      // Find regId to switch to KAB mode
      const kec = kecamatanList.find(k => k.gid_3 === selectedGid);
      if (kec && kec.gid_3) {
        const regId = kec.gid_3.split('-')[0];
        setSelectedGid(regId + '-KAB');
        setSelectedName3('');
      } else {
        setSelectedGid(null);
      }
    } else if (v === 'kecamatan' && selectedGid && selectedGid.endsWith('-KAB')) {
      setSelectedGid(null);
    }
  };
  const [layerData, setLayerData] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchKecamatan().then(setKecamatanList);
  }, []);

  useEffect(() => {
    fetchLayerData(year, activeLayer).then(setLayerData);
  }, [year, activeLayer]);

  const selectedKec: Kecamatan | null = (() => {
    if (!selectedGid) return null;
    const kec = kecamatanList.find(k => k.gid_3 === selectedGid);
    if (kec) return kec;
    if (selectedGid.endsWith('-KAB')) {
      const regId = selectedGid.replace('-KAB', '');
      const reg = JAWA_TIMUR_REGENCY_COORDINATES.find(r => r.id === regId);
      if (reg) return { gid_3: selectedGid, name_3: reg.name, name_2: reg.name as any, lng: reg.lng, lat: reg.lat };
    }
    // Fallback: kecamatan outside study cities — use name info from click
    if (selectedName2 && selectedName3) {
      return { gid_3: selectedGid, name_3: selectedName3, name_2: selectedName2 as any, lng: 0, lat: 0 };
    }
    return null;
  })();

  return (
    <ThemeProvider>
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#0a0a0b] text-[#e4e4e7] font-sans">
      <TopBar activeView={activeView} onViewChange={setActiveView} year={year} />
      
      {activeView === 'map' && (
        <div className="flex flex-col flex-1 relative overflow-hidden">
          <div className="flex flex-1 relative overflow-hidden">
            <LeftSidebar 
              activeLayer={activeLayer} 
              setActiveLayer={setActiveLayer}
              cityFilter={cityFilter}
              setCityFilter={setCityFilter}
              year={year}
              viewLevel={viewLevel}
              setViewLevel={handleViewLevelChange}
            />
            
            <div className="flex-1 relative">
              <MapStage 
                year={year} 
                activeLayer={activeLayer} 
                layerData={layerData} 
                selectedGid={selectedGid}
                onSelectKecamatan={(gid, n2, n3) => { setSelectedGid(gid); setSelectedName2(n2 ?? null); setSelectedName3(n3 ?? null); }}
                cityFilter={cityFilter}
                viewLevel={viewLevel}
              />
            </div>
            
            <RightSidebar 
              selectedKec={selectedKec}
              year={year}
              activeLayer={activeLayer}
            />
          </div>
          
          <BottomSlider year={year} setYear={setYear} />
        </div>
      )}

      {activeView === 'models' && <ModelExplorer onClose={() => setActiveView('map')} />}
      {activeView === 'notes' && <DataNotes onClose={() => setActiveView('map')} />}
      {activeView === 'rag' && (
        <div className="flex-1 max-w-4xl mx-auto w-full p-8 h-[calc(100vh-56px)]">
           <RagAnalyst contextGid={null} contextYear={year} />
        </div>
      )}
    </div>
  </ThemeProvider>
  );
}
