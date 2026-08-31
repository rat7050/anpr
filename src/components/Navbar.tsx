import React, { useState, useEffect } from 'react';
import { 
  Camera, 
  MapPin, 
  ShieldAlert, 
  Search, 
  AlertTriangle, 
  BarChart3, 
  Cpu, 
  Bot, 
  Code2, 
  Volume2, 
  VolumeX, 
  Radio,
  Video,
  ArrowLeft
} from 'lucide-react';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  unacknowledgedAlertsCount: number;
  soundEnabled: boolean;
  setSoundEnabled: (val: boolean) => void;
  onOpenAlertDrawer: () => void;
  canGoBack?: boolean;
  onGoBack?: () => void;
  previousTabName?: string;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  unacknowledgedAlertsCount,
  soundEnabled,
  setSoundEnabled,
  onOpenAlertDrawer,
  canGoBack = false,
  onGoBack,
  previousTabName
}) => {
  const [uptimeSeconds, setUptimeSeconds] = useState(512324);

  useEffect(() => {
    const timer = setInterval(() => {
      setUptimeSeconds(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUptime = (totalSecs: number) => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    const secs = totalSecs % 60;
    return `${hours.toString().padStart(3, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const tabs = [
    { id: 'gis', label: 'GIS Command Map', icon: MapPin },
    { id: 'cameras', label: 'CCTV Feeds', icon: Camera },
    { id: 'anpr', label: 'ANPR Tracker', icon: Search },
    { id: 'potholes', label: 'Road Hazards', icon: AlertTriangle },
    { id: 'ingest', label: 'CV Ingest Lab', icon: Cpu },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'copilot', label: 'AI Copilot', icon: Bot },
    { id: 'repo', label: 'Architecture', icon: Code2 }
  ];

  return (
    <header className="h-16 border-b border-white/10 bg-[#0a0c10] flex items-center justify-between px-3 sm:px-6 shrink-0 sticky top-0 z-50 backdrop-blur-md">
      {/* Left Section: Back Button & Brand Badge */}
      <div className="flex items-center gap-2 sm:gap-4">
        
        {/* Back Button */}
        {onGoBack && (
          <button
            id="btn-nav-back"
            onClick={onGoBack}
            disabled={!canGoBack}
            title={canGoBack && previousTabName ? `Go back to ${previousTabName}` : 'Go back to previous screen'}
            className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg border font-mono text-xs font-semibold transition-all ${
              canGoBack
                ? 'bg-cyan-500/10 hover:bg-cyan-500/25 border-cyan-500/50 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.25)] cursor-pointer'
                : 'bg-white/5 border-white/10 text-gray-500 cursor-not-allowed opacity-40'
            }`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>
        )}

        <div className="w-8 h-8 bg-cyan-500 rounded flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.5)] shrink-0">
          <svg className="w-5 h-5 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-sm sm:text-base font-bold tracking-tight text-white uppercase flex items-center gap-2">
            <span>India ITS Traffic Intelligence</span>
            <span className="hidden md:inline-block px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-500/30 text-[9px] font-mono text-cyan-400 font-normal">
              ICCC-DELHI-NCR
            </span>
          </h1>
          <p className="text-[10px] text-cyan-400 font-mono tracking-widest leading-none">
            MoRTH & NHAI CORRIDOR HUB • HSRP ANPR + IRC ROAD AI
          </p>
        </div>
      </div>

      {/* Center Navigation Bar */}
      <nav className="hidden xl:flex items-center space-x-1 bg-[#050608] p-1 rounded-lg border border-white/10">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              id={`tab-${tab.id}`}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded text-xs font-medium transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Right Telemetry & Controls */}
      <div className="flex items-center gap-3 sm:gap-6">
        {/* Telemetry Stats */}
        <div className="hidden md:flex gap-5">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Uptime</span>
            <span className="text-xs font-mono text-cyan-100">{formatUptime(uptimeSeconds)}</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Throttling</span>
            <span className="text-xs font-mono text-green-400">0.0ms</span>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-gray-500 uppercase tracking-wider font-mono">Global Alerts</span>
            <span className={`text-xs font-mono font-bold ${unacknowledgedAlertsCount > 0 ? 'text-red-500 animate-pulse' : 'text-gray-400'}`}>
              {unacknowledgedAlertsCount.toString().padStart(2, '0')}
            </span>
          </div>
        </div>

        {/* Audio Mute/Unmute */}
        <button
          id="btn-sound-toggle"
          onClick={() => setSoundEnabled(!soundEnabled)}
          title={soundEnabled ? 'Mute Audio Chimes' : 'Enable Audio Chimes'}
          className="p-2 rounded bg-[#0d1016] hover:bg-[#151922] text-gray-300 border border-white/10 transition-colors"
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-gray-500" />}
        </button>

        {/* Live Alerts Trigger */}
        <button
          id="btn-open-alerts"
          onClick={onOpenAlertDrawer}
          className={`flex items-center space-x-2 px-3 py-1.5 rounded border text-xs font-bold uppercase transition-all ${
            unacknowledgedAlertsCount > 0
              ? 'bg-red-500/20 border-red-500/60 text-red-300 shadow-[0_0_12px_rgba(239,68,68,0.4)] animate-pulse'
              : 'bg-[#0d1016] border-white/10 text-gray-300 hover:bg-[#151922]'
          }`}
        >
          <ShieldAlert className={`w-4 h-4 ${unacknowledgedAlertsCount > 0 ? 'text-red-400' : 'text-gray-400'}`} />
          <span className="hidden sm:inline">Priority Alerts</span>
          {unacknowledgedAlertsCount > 0 && (
            <span className="px-1.5 py-0.2 rounded bg-red-500 text-black text-[10px] font-bold">
              {unacknowledgedAlertsCount}
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

