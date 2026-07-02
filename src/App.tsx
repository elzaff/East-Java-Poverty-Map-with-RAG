import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from './ThemeContext';
import { TopBar } from './components/TopBar';
import { LeftSidebar } from './components/LeftSidebar';
import { RightSidebar } from './components/RightSidebar';
import { BottomSlider } from './components/BottomSlider';
import { MapStage } from './components/MapStage';
import { ModelExplorer } from './components/ModelExplorer';
import { DataNotes } from './components/DataNotes';
import { RagAnalyst } from './components/RagAnalyst';
import { LayerId, Kecamatan, ScenarioRun } from './types';
import { fetchKecamatan, fetchLayerData, fetchScenarioIndex } from './api';
import { JAWA_TIMUR_REGENCY_COORDINATES } from './mockData';
import './index.css';

export default function App() {
  const [activeView, setActiveView] = useState('map');
  const [year, setYear] = useState(2026);
  const [activeLayer, setActiveLayer] = useState<LayerId>('poverty_risk_score');
  const [cityFilter, setCityFilter] = useState('All');
  const [viewLevel, setViewLevel] = useState<'kecamatan' | 'kabupaten'>('kecamatan');
  const [scenarioRuns, setScenarioRuns] = useState<ScenarioRun[]>([]);
  const [activeRun, setActiveRun] = useState<ScenarioRun | null>(null);

  const [kecamatanList, setKecamatanList] = useState<Kecamatan[]>([]);
  const [selectedGid, setSelectedGid] = useState<string | null>('SBY-01');
  const [selectedName2, setSelectedName2] = useState<string | null>(null);
  const [selectedName3, setSelectedName3] = useState<string | null>(null);
  const [layerData, setLayerData] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchKecamatan().then(setKecamatanList);
    fetchScenarioIndex().then(index => {
      setScenarioRuns(index.runs);
      const defaultRun = index.runs.find(run => run.id === index.default_run_id) ?? index.runs[0] ?? null;
      setActiveRun(defaultRun);
    });
  }, []);

  const activeSupportedRegions = useMemo(() => {
    if (!activeRun || activeRun.scenario_series !== 'N') return null;
    return new Set(activeRun.supported_regions);
  }, [activeRun]);

  useEffect(() => {
    if (!activeSupportedRegions) return;
    if (cityFilter !== 'All' && !activeSupportedRegions.has(cityFilter)) {
      setCityFilter('All');
    }
    if (selectedName2 && !activeSupportedRegions.has(selectedName2)) {
      setSelectedGid(null);
      setSelectedName2(null);
      setSelectedName3(null);
    }
  }, [activeSupportedRegions, cityFilter, selectedName2]);

  useEffect(() => {
    if (!activeRun) return;
    fetchLayerData(year, activeLayer, activeRun).then(setLayerData);
  }, [year, activeLayer, activeRun]);

  const handleViewLevelChange = (v: 'kecamatan' | 'kabupaten') => {
    setViewLevel(v);
    if (v === 'kabupaten' && selectedGid && !selectedGid.endsWith('-KAB')) {
      const kec = kecamatanList.find(k => k.gid_3 === selectedGid);
      if (kec && kec.gid_3) {
        const regId = kec.gid_3.split('-')[0];
        setSelectedGid(regId + '-KAB');
        setSelectedName3('');
      } else if (selectedName2) {
        const reg = JAWA_TIMUR_REGENCY_COORDINATES.find(r => r.name === selectedName2);
        setSelectedGid(reg ? reg.id + '-KAB' : null);
        setSelectedName3('');
      } else {
        setSelectedGid(null);
      }
    } else if (v === 'kecamatan' && selectedGid && selectedGid.endsWith('-KAB')) {
      setSelectedGid(null);
    }
  };

  const handleRunChange = (run: ScenarioRun) => {
    setActiveRun(run);
    if (run.scenario_series === 'N') {
      setViewLevel('kecamatan');
      if (cityFilter !== 'All' && !run.supported_regions.includes(cityFilter)) setCityFilter('All');
      if (selectedName2 && !run.supported_regions.includes(selectedName2)) {
        setSelectedGid(null);
        setSelectedName2(null);
        setSelectedName3(null);
      }
    }
  };

  const selectedKec: Kecamatan | null = (() => {
    if (!selectedGid) return null;
    const kec = kecamatanList.find(k => k.gid_3 === selectedGid);
    if (kec) return kec;
    if (selectedGid.endsWith('-KAB')) {
      const regId = selectedGid.replace('-KAB', '');
      const reg = JAWA_TIMUR_REGENCY_COORDINATES.find(r => r.id === regId || r.name === selectedName2);
      if (reg) return { gid_3: selectedGid, name_3: reg.name, name_2: reg.name as any, lng: reg.lng, lat: reg.lat };
    }
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
                scenarioRuns={scenarioRuns}
                activeRun={activeRun}
                onRunChange={handleRunChange}
              />

              <div className="flex-1 relative">
                <MapStage
                  year={year}
                  activeLayer={activeLayer}
                  layerData={layerData}
                  selectedGid={selectedGid}
                  onSelectKecamatan={(gid, n2, n3) => {
                    setSelectedGid(gid);
                    setSelectedName2(n2 ?? null);
                    setSelectedName3(n3 ?? null);
                  }}
                  cityFilter={cityFilter}
                  viewLevel={viewLevel}
                  activeRun={activeRun}
                />
              </div>

              <RightSidebar
                selectedKec={selectedKec}
                year={year}
                activeLayer={activeLayer}
                activeRun={activeRun}
              />
            </div>

            <BottomSlider year={year} setYear={setYear} />
          </div>
        )}

        {activeView === 'models' && (
          <ModelExplorer
            onClose={() => setActiveView('map')}
            activeRun={activeRun}
            onRunChange={handleRunChange}
          />
        )}
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
