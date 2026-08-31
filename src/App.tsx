import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { GisMap } from './components/GisMap';
import { LiveCameraFeeds } from './components/LiveCameraFeeds';
import { PlateTrajectoryTracker } from './components/PlateTrajectoryTracker';
import { PotholeManager } from './components/PotholeManager';
import { AccidentAlertPanel } from './components/AccidentAlertPanel';
import { FrameIngestionLab } from './components/FrameIngestionLab';
import { AnalyticsView } from './components/AnalyticsView';
import { AiTrafficCopilot } from './components/AiTrafficCopilot';
import { CodeAndArchViewer } from './components/CodeAndArchViewer';

import { Camera, PlateEvent, PotholeEvent, AccidentEvent, AlertItem, PlateTrajectory, IngestionResult } from './types/traffic';
import { INITIAL_CAMERAS, INITIAL_PLATE_EVENTS, INITIAL_POTHOLES, INITIAL_ACCIDENTS, INITIAL_ALERTS, INITIAL_BLACKLIST } from './data/mockData';

export function App() {
  const [activeTab, setActiveTab] = useState<string>('cameras');
  const [tabHistory, setTabHistory] = useState<string[]>([]);
  
  // Tab Name dictionary
  const TAB_LABELS: Record<string, string> = {
    gis: 'GIS Command Map',
    cameras: 'CCTV Feeds',
    anpr: 'ANPR Tracker',
    potholes: 'Road Hazards',
    ingest: 'CV Ingest Lab',
    analytics: 'Analytics',
    copilot: 'AI Copilot',
    repo: 'Architecture'
  };

  const handleNavigateTab = (tabId: string) => {
    if (tabId === activeTab) return;
    setTabHistory(prev => [...prev, activeTab]);
    setActiveTab(tabId);
  };

  const handleGoBack = () => {
    if (tabHistory.length === 0) {
      if (activeTab !== 'cameras') {
        setActiveTab('cameras');
      }
      return;
    }
    const previousTab = tabHistory[tabHistory.length - 1];
    setTabHistory(prev => prev.slice(0, prev.length - 1));
    setActiveTab(previousTab);
  };

  const previousTabName = tabHistory.length > 0 ? TAB_LABELS[tabHistory[tabHistory.length - 1]] || tabHistory[tabHistory.length - 1] : undefined;

  // Data State
  const [cameras, setCameras] = useState<Camera[]>(INITIAL_CAMERAS);
  const [plateEvents, setPlateEvents] = useState<PlateEvent[]>(INITIAL_PLATE_EVENTS);
  const [potholes, setPotholes] = useState<PotholeEvent[]>(INITIAL_POTHOLES);
  const [accidents, setAccidents] = useState<AccidentEvent[]>(INITIAL_ACCIDENTS);
  const [alerts, setAlerts] = useState<AlertItem[]>(INITIAL_ALERTS);
  const [blacklist, setBlacklist] = useState(INITIAL_BLACKLIST);
  const [isPureRealDataMode, setIsPureRealDataMode] = useState<boolean>(false);

  // Fetch real state from server on mount
  useEffect(() => {
    const fetchServerData = async () => {
      try {
        const [cRes, pRes, potRes, accRes, blRes] = await Promise.allSettled([
          fetch('/api/cameras').then(r => r.json()),
          fetch('/api/plate-events').then(r => r.json()),
          fetch('/api/potholes').then(r => r.json()),
          fetch('/api/accidents').then(r => r.json()),
          fetch('/api/blacklist').then(r => r.json()),
        ]);

        if (cRes.status === 'fulfilled' && Array.isArray(cRes.value)) setCameras(cRes.value);
        if (pRes.status === 'fulfilled' && Array.isArray(pRes.value)) setPlateEvents(pRes.value);
        if (potRes.status === 'fulfilled' && Array.isArray(potRes.value)) setPotholes(potRes.value);
        if (accRes.status === 'fulfilled' && Array.isArray(accRes.value)) setAccidents(accRes.value);
        if (blRes.status === 'fulfilled' && Array.isArray(blRes.value)) setBlacklist(blRes.value);
      } catch (err) {
        console.warn('API sync using initial state:', err);
      }
    };
    fetchServerData();
  }, []);

  // Active Map Selection State
  const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);
  const [activeTrajectory, setActiveTrajectory] = useState<PlateTrajectory | null>(null);
  const [isAlertDrawerOpen, setIsAlertDrawerOpen] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Audio Beep Synth for high-priority collision & blacklist alerts
  const playAlertSound = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, audioCtx.currentTime + 0.3);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {
      // AudioContext might be muted by browser policy before first interaction
    }
  };

  // Register New Camera (e.g. Desktop Camera Node)
  const handleRegisterCamera = async (cam: Camera) => {
    setCameras(prev => {
      const exists = prev.some(c => c.id === cam.id);
      if (exists) return prev.map(c => c.id === cam.id ? cam : c);
      return [cam, ...prev];
    });

    try {
      await fetch('/api/cameras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cam)
      });
    } catch (err) {
      console.warn('Could not register camera with server:', err);
    }
  };

  // Clear / Purge All Mock Data
  const handlePurgeMockData = async () => {
    setPlateEvents([]);
    setPotholes([]);
    setAccidents([]);
    setAlerts([]);
    setIsPureRealDataMode(true);
    try {
      await fetch('/api/clear-sample-data', { method: 'POST' });
    } catch (e) {
      console.warn('Failed to clear server sample data:', e);
    }
  };

  // Acknowledge Alert Handler
  const handleAcknowledgeAlert = (id: string) => {
    setAlerts(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  // Dispatch Response Handler
  const handleDispatch = (alert: AlertItem) => {
    handleAcknowledgeAlert(alert.id);
    alert.acknowledged = true;
    alert.description += " [DISPATCH CONFIRMED: Units en route]";
    setAlerts([...alerts]);
  };

  // Update Pothole Status Handler with server sync
  const handleUpdatePotholeStatus = async (id: string, newStatus: 'reported' | 'scheduled' | 'fixed') => {
    setPotholes(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
    try {
      await fetch(`/api/potholes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
    } catch (e) {
      // Offline fallback
    }
  };

  // Handle Real Ingestion Output from Lab or Camera Trigger
  const handleIngestionResult = (result: IngestionResult) => {
    const cam = cameras.find(c => c.id === result.camera_id) || cameras[0];
    const now = result.timestamp || new Date().toISOString();

    // 1. Ingest Real ANPR Detections
    if (result.anpr_detections && result.anpr_detections.length > 0) {
      const newEvents: PlateEvent[] = result.anpr_detections.map((anpr, idx) => ({
        id: `PE-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        plate_text: anpr.plate_text,
        confidence: anpr.confidence,
        camera_id: cam.id,
        lat: cam.lat,
        lon: cam.lon,
        timestamp: now,
        vehicle_type: 'Detected Vehicle',
        speed_kmh: 52,
        is_blacklisted: anpr.is_blacklisted,
        blacklist_reason: anpr.reason
      }));
      setPlateEvents(prev => [...newEvents, ...prev]);

      result.anpr_detections.forEach((anpr, idx) => {
        if (anpr.is_blacklisted) {
          const newAlert: AlertItem = {
            id: `ALT-BL-${Date.now()}-${idx}`,
            type: 'blacklist',
            reference_id: anpr.plate_text,
            camera_id: cam.id,
            camera_name: cam.name,
            road_name: cam.road_name,
            timestamp: now,
            acknowledged: false,
            title: `BLACKLIST VEHICLE INTERCEPT: ${anpr.plate_text}`,
            description: `Vehicle matched alert: ${anpr.reason || 'Flagged in Law Enforcement Database'} at ${cam.name}`,
            severity: 'high'
          };
          setAlerts(prev => [newAlert, ...prev]);
          playAlertSound();
        }
      });
    }

    // 2. Ingest Real Pothole Detections
    if (result.pothole_detections && result.pothole_detections.length > 0) {
      const newPots: PotholeEvent[] = result.pothole_detections.map((pot, idx) => ({
        id: pot.id || `POT-${Date.now()}-${idx}`,
        severity: pot.severity,
        camera_id: cam.id,
        lat: cam.lat + 0.0003,
        lon: cam.lon + 0.0003,
        timestamp: now,
        status: 'reported',
        area_sq_cm: pot.area_score,
        depth_estimate_cm: 6.5,
        confidence: pot.confidence
      }));
      setPotholes(prev => {
        const newIds = new Set(newPots.map(p => p.id));
        return [...newPots, ...prev.filter(p => !newIds.has(p.id))];
      });
    }

    // 3. Ingest Real Accident Detections
    if (result.accident_detections && result.accident_detections.length > 0) {
      const newAccs: AccidentEvent[] = result.accident_detections.map((acc, idx) => ({
        id: `ACC-${Date.now()}-${idx}-${Math.floor(Math.random() * 1000)}`,
        severity: (acc.severity || 'critical') as any,
        camera_id: cam.id,
        lat: cam.lat,
        lon: cam.lon,
        timestamp: now,
        confirmed: true,
        vehicles_involved: 2,
        collision_type: (acc.collision_type as any) || 'rear_end',
        deceleration_g: acc.deceleration_delta || 4.2,
        status: 'dispatching'
      }));
      setAccidents(prev => {
        const newIds = new Set(newAccs.map(a => a.id));
        return [...newAccs, ...prev.filter(a => !newIds.has(a.id))];
      });

      result.accident_detections.forEach((acc, idx) => {
        const newAlert: AlertItem = {
          id: `ALT-ACC-${Date.now()}-${idx}`,
          type: 'accident',
          reference_id: cam.id,
          camera_id: cam.id,
          camera_name: cam.name,
          road_name: cam.road_name,
          timestamp: now,
          acknowledged: false,
          title: `CRITICAL VEHICLE COLLISION: ${cam.name}`,
          description: `Visual detection identified collision (${acc.collision_type}) with vehicle impact at ${cam.road_name}.`,
          severity: 'critical'
        };
        setAlerts(prev => [newAlert, ...prev]);
        playAlertSound();
      });
    }
  };

  const unackAlertsCount = alerts.filter(a => !a.acknowledged).length;
  const [systemTime, setSystemTime] = useState(new Date().toISOString());

  useEffect(() => {
    const clock = setInterval(() => {
      setSystemTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  const mobileTabs = [
    { id: 'cameras', label: 'Live CCTV' },
    { id: 'gis', label: 'GIS Map' },
    { id: 'anpr', label: 'ANPR' },
    { id: 'potholes', label: 'Hazards' },
    { id: 'ingest', label: 'CV Lab' },
    { id: 'analytics', label: 'Analytics' },
    { id: 'copilot', label: 'Copilot' },
    { id: 'repo', label: 'Arch' }
  ];

  return (
    <div className="min-h-screen bg-[#050608] text-gray-200 flex flex-col font-sans selection:bg-cyan-500 selection:text-black">
      
      {/* Top Fixed Command Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={handleNavigateTab}
        unacknowledgedAlertsCount={unackAlertsCount}
        soundEnabled={soundEnabled}
        setSoundEnabled={setSoundEnabled}
        onOpenAlertDrawer={() => setIsAlertDrawerOpen(true)}
        canGoBack={tabHistory.length > 0}
        onGoBack={handleGoBack}
        previousTabName={previousTabName}
      />

      {/* Secondary Mobile/Tablet Tab Bar */}
      <div className="xl:hidden flex items-center space-x-1 px-3 py-2 overflow-x-auto border-b border-white/10 bg-[#0a0c10]/90 sticky top-16 z-40">
        {tabHistory.length > 0 && (
          <button
            onClick={handleGoBack}
            className="flex items-center space-x-1 px-2.5 py-1 rounded text-xs font-mono font-bold uppercase whitespace-nowrap bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 mr-1 shadow-[0_0_8px_rgba(6,182,212,0.2)]"
          >
            <span>← Back</span>
          </button>
        )}
        {mobileTabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleNavigateTab(tab.id)}
              className={`px-3 py-1 rounded text-xs font-mono uppercase whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5 border border-transparent'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Pure Real Data Mode Banner */}
      {isPureRealDataMode && (
        <div className="bg-green-950/60 border-b border-green-500/30 px-4 py-1.5 text-center text-xs font-mono text-green-300 flex items-center justify-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
          <span><strong>PURE REAL DATA MODE ACTIVE:</strong> All mock seed data has been purged. System reflects real-time visual frames captured from your desktop camera.</span>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 p-3 sm:p-4 max-w-7xl w-full mx-auto flex flex-col">
        {activeTab === 'gis' && (
          <GisMap
            cameras={cameras}
            potholes={potholes}
            accidents={accidents}
            activeTrajectory={activeTrajectory}
            selectedCamera={selectedCamera}
            onSelectCamera={(cam) => {
              setSelectedCamera(cam);
              handleNavigateTab('cameras');
            }}
            onResolvePothole={(id) => handleUpdatePotholeStatus(id, 'fixed')}
            onClearTrajectory={() => setActiveTrajectory(null)}
          />
        )}

        {activeTab === 'cameras' && (
          <LiveCameraFeeds
            cameras={cameras}
            selectedCamera={selectedCamera}
            onSelectCamera={(cam) => setSelectedCamera(cam)}
            onIngestResult={handleIngestionResult}
            onPurgeMockData={handlePurgeMockData}
            onRegisterCamera={handleRegisterCamera}
            onTriggerIngest={async (camId) => {
              try {
                const res = await fetch('/api/analyze-frame', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ camera_id: camId })
                });
                if (res.ok) {
                  const data = await res.json();
                  handleIngestionResult(data);
                }
              } catch (e) {
                console.error('Trigger ingest error:', e);
              }
            }}
          />
        )}

        {activeTab === 'anpr' && (
          <PlateTrajectoryTracker
            plateEvents={plateEvents}
            blacklist={blacklist}
            onPlotOnMap={(traj) => {
              setActiveTrajectory(traj);
              handleNavigateTab('gis');
            }}
          />
        )}

        {activeTab === 'potholes' && (
          <PotholeManager
            potholes={potholes}
            onUpdateStatus={handleUpdatePotholeStatus}
          />
        )}

        {activeTab === 'ingest' && (
          <FrameIngestionLab
            cameras={cameras}
            onIngestionComplete={handleIngestionResult}
          />
        )}

        {activeTab === 'analytics' && (
          <AnalyticsView
            cameras={cameras}
            potholes={potholes}
            accidents={accidents}
          />
        )}

        {activeTab === 'copilot' && (
          <AiTrafficCopilot
            systemContext={{
              activeCameras: cameras.length,
              totalPotholes: potholes.length,
              criticalPotholes: potholes.filter(p => p.severity === 'critical' && p.status !== 'fixed').length,
              accidents: accidents.length,
              unacknowledgedAlerts: unackAlertsCount
            }}
          />
        )}

        {activeTab === 'repo' && (
          <CodeAndArchViewer />
        )}
      </main>

      {/* Tactical Telemetry Footer */}
      <footer className="h-10 bg-[#0a0c10] border-t border-white/10 px-4 sm:px-6 flex items-center justify-between shrink-0 font-mono text-[9px] text-gray-500 mt-auto">
        <div className="flex gap-4 sm:gap-6 items-center">
          <span>DB_STATUS: <span className="text-green-400 font-bold">ACTIVE (REAL-TIME SYNC)</span></span>
          <span className="hidden sm:inline">VISION_ENGINE: <span className="text-cyan-400 font-bold">GEMINI 2.5 FLASH MULTIMODAL</span></span>
          <span>CAMERA_PERMISSIONS: <span className="text-cyan-400 font-bold">GRANTED</span></span>
        </div>
        <div className="text-gray-400">SYSTEM_TIME: {systemTime}</div>
      </footer>

      {/* Real-Time Live Alert Drawer */}
      <AccidentAlertPanel
        alerts={alerts}
        isOpen={isAlertDrawerOpen}
        onClose={() => setIsAlertDrawerOpen(false)}
        onAcknowledge={handleAcknowledgeAlert}
        onDispatch={handleDispatch}
      />
    </div>
  );
}
export default App;
