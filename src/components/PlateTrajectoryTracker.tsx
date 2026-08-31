import React, { useState } from 'react';
import { PlateEvent, BlacklistItem, PlateTrajectory } from '../types/traffic';
import { Search, Route, ShieldAlert, CheckCircle, Clock, Gauge, Camera, Sparkles, MapPin } from 'lucide-react';
import { levenshteinDistance } from '../utils/cvEngine';

interface PlateTrajectoryTrackerProps {
  plateEvents: PlateEvent[];
  blacklist: BlacklistItem[];
  onPlotOnMap: (trajectory: PlateTrajectory) => void;
}

export const PlateTrajectoryTracker: React.FC<PlateTrajectoryTrackerProps> = ({
  plateEvents,
  blacklist,
  onPlotOnMap
}) => {
  const [searchQuery, setSearchQuery] = useState('DL 01 AB 1234');
  const [selectedPlate, setSelectedPlate] = useState<string>('DL 01 AB 1234');

  // Compute fuzzy matches
  const targetPlate = selectedPlate.toUpperCase().trim();
  const matchedSightings = plateEvents
    .filter(e => {
      const p = e.plate_text.toUpperCase().replace(/[\s-_]/g, '');
      const q = targetPlate.replace(/[\s-_]/g, '');
      return p === q || p.includes(q) || levenshteinDistance(p, q) <= 2;
    })
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  const isBlacklisted = blacklist.some(b => b.plate_text.replace(/\s+/g, '').toUpperCase() === targetPlate.replace(/\s+/g, '').toUpperCase());
  const blacklistDetails = blacklist.find(b => b.plate_text.replace(/\s+/g, '').toUpperCase() === targetPlate.replace(/\s+/g, '').toUpperCase());

  const activeTrajectoryObj: PlateTrajectory = {
    plate_text: targetPlate,
    total_sightings: matchedSightings.length,
    first_seen: matchedSightings[0]?.timestamp || new Date().toISOString(),
    last_seen: matchedSightings[matchedSightings.length - 1]?.timestamp || new Date().toISOString(),
    is_blacklisted: isBlacklisted,
    blacklist_reason: blacklistDetails?.reason,
    trajectory: matchedSightings.map(s => ({
      camera_id: s.camera_id,
      camera_name: s.camera_id,
      road_name: s.vehicle_type || 'Delhi-NCR Arterial',
      lat: s.lat,
      lon: s.lon,
      timestamp: s.timestamp,
      confidence: s.confidence,
      speed_kmh: s.speed_kmh || 55
    }))
  };

  const samplePlates = ['DL 01 AB 1234', 'HR 26 DK 8392', 'UP 16 BT 4410', 'MH 12 DE 5678', 'KA 01 MJ 9081', 'DL 3C CE 7890'];

  return (
    <div className="flex flex-col space-y-4">
      
      {/* Top Search Banner */}
      <div className="bg-[#0d1016] rounded-xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center space-x-2">
            <Search className="w-4 h-4 text-cyan-400" />
            <span>ANPR Vehicle Trajectory Reconstruction</span>
          </h2>
          <p className="text-[10px] text-cyan-400 font-mono tracking-wide">
            FUZZY LEVENSHTEIN CORRIDOR RECONSTRUCTION • EASYOCR + CLAHE
          </p>
        </div>

        {/* Search Input */}
        <div className="flex items-center space-x-2 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && setSelectedPlate(searchQuery)}
              placeholder="Search Indian HSRP Plate (e.g. DL 01 AB 1234)..."
              className="w-full pl-3 pr-8 py-2 bg-black border border-white/20 rounded text-xs font-mono uppercase text-white focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          <button
            onClick={() => setSelectedPlate(searchQuery)}
            className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase rounded text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-colors flex items-center space-x-1"
          >
            <Search className="w-3.5 h-3.5" />
            <span>Search</span>
          </button>
        </div>
      </div>

      {/* Quick Pick Sample Plates */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-1 text-xs">
        <span className="text-gray-400 font-mono text-[10px] uppercase">Quick Query:</span>
        {samplePlates.map((p) => {
          const isBl = blacklist.some(b => b.plate_text === p);
          const isSelected = selectedPlate === p;
          return (
            <button
              key={p}
              onClick={() => {
                setSearchQuery(p);
                setSelectedPlate(p);
              }}
              className={`px-2.5 py-1 rounded font-mono text-xs border transition-all flex items-center space-x-1.5 ${
                isSelected
                  ? 'bg-cyan-500/20 border-cyan-500/80 text-cyan-300 font-bold shadow-[0_0_10px_rgba(6,182,212,0.3)]'
                  : isBl
                  ? 'bg-red-950/30 border-red-500/40 text-red-300 hover:bg-red-900/50'
                  : 'bg-[#0d1016] border-white/10 text-gray-300 hover:bg-white/5'
              }`}
            >
              <span>{p}</span>
              {isBl && <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>}
            </button>
          );
        })}
      </div>

      {/* Main Grid: Trajectory Results & Plate Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left: Plate Overview Card & Blacklist Status */}
        <div className="lg:col-span-4 flex flex-col space-y-3">
          
          <div className="bg-[#0d1016] p-4 rounded-xl border border-white/10 flex flex-col space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-mono font-bold text-gray-400 uppercase">Target Plate</span>
              {isBlacklisted ? (
                <span className="px-2 py-0.5 rounded bg-red-950/80 text-red-300 border border-red-500/60 text-[9px] font-mono font-bold uppercase flex items-center space-x-1 shadow-[0_0_8px_rgba(239,68,68,0.4)]">
                  <ShieldAlert className="w-3 h-3 text-red-400" />
                  <span>Blacklist Target</span>
                </span>
              ) : (
                <span className="px-2 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-500/60 text-[9px] font-mono font-bold uppercase flex items-center space-x-1">
                  <CheckCircle className="w-3 h-3 text-cyan-400" />
                  <span>Clear Status</span>
                </span>
              )}
            </div>

            <div className="p-4 bg-black rounded-lg border border-cyan-500/40 flex items-center justify-between shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <div className="font-mono text-2xl font-extrabold text-white tracking-widest">
                {targetPlate}
              </div>
              <div className="text-right text-xs">
                <div className="text-gray-400 text-[10px] font-mono uppercase">Sightings</div>
                <div className="text-cyan-400 font-mono font-bold text-lg">{matchedSightings.length}</div>
              </div>
            </div>

            {isBlacklisted && blacklistDetails && (
              <div className="p-3 bg-red-950/40 rounded-lg border border-red-500/50 text-xs space-y-1">
                <div className="font-bold text-red-300 font-mono uppercase flex items-center space-x-1 text-[10px]">
                  <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
                  <span>FLAG: {blacklistDetails.flag_level.toUpperCase()}</span>
                </div>
                <div className="text-red-200 text-xs">{blacklistDetails.reason}</div>
              </div>
            )}

            {/* OCR Telemetry & Pipeline Specs */}
            <div className="text-xs text-gray-400 space-y-1.5 pt-2 border-t border-white/10 font-mono">
              <div className="flex justify-between">
                <span>OCR Engine:</span>
                <span className="text-gray-200">EasyOCR v1.7</span>
              </div>
              <div className="flex justify-between">
                <span>Preprocessing:</span>
                <span className="text-gray-200">OpenCV CLAHE</span>
              </div>
              <div className="flex justify-between">
                <span>Avg Confidence:</span>
                <span className="text-cyan-400 font-bold">
                  {matchedSightings.length > 0
                    ? `${(matchedSightings.reduce((a, b) => a + b.confidence, 0) / matchedSightings.length * 100).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {matchedSightings.length > 0 && (
              <button
                onClick={() => onPlotOnMap(activeTrajectoryObj)}
                className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase rounded text-xs shadow-[0_0_10px_rgba(6,182,212,0.4)] flex items-center justify-center space-x-1.5 transition-colors"
              >
                <Route className="w-4 h-4" />
                <span>Plot Route on GIS Map</span>
              </button>
            )}
          </div>
        </div>

        {/* Right: Chronological Trajectory Waypoint List */}
        <div className="lg:col-span-8 bg-[#0d1016] p-4 rounded-xl border border-white/10 shadow-xl">
          <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
            <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center space-x-2">
              <Route className="w-4 h-4 text-cyan-400" />
              <span>Chronological Corridor Sightings ({matchedSightings.length})</span>
            </h3>
            <span className="text-[10px] font-mono text-gray-400 uppercase">ORDERED BY TIMESTAMP</span>
          </div>

          {matchedSightings.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs font-mono">
              NO HISTORICAL SIGHTINGS FOUND FOR PLATE <span className="text-white">{targetPlate}</span>.
            </div>
          ) : (
            <div className="relative pl-6 space-y-3 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
              {matchedSightings.map((event, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === matchedSightings.length - 1;
                return (
                  <div key={`sighting-${event.id}-${idx}`} className="relative group">
                    
                    {/* Node Dot */}
                    <div className={`absolute -left-6 top-1.5 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold text-black ${
                      isLast ? 'bg-red-400 ring-2 ring-red-400 shadow-[0_0_8px_rgba(239,68,68,0.8)]' : isFirst ? 'bg-cyan-400' : 'bg-gray-400'
                    }`}>
                      {idx + 1}
                    </div>

                    <div className="p-3 bg-black/50 rounded-lg border border-white/10 group-hover:border-cyan-500/50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-xs text-white font-mono">{event.camera_id}</span>
                          <span className="text-gray-400 text-xs">• {event.vehicle_type || 'Vehicle'}</span>
                        </div>
                        <div className="text-[11px] text-gray-400 flex items-center space-x-3 font-mono">
                          <span className="flex items-center space-x-1">
                            <Clock className="w-3 h-3 text-gray-500" />
                            <span>{new Date(event.timestamp).toLocaleTimeString()}</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <Gauge className="w-3 h-3 text-gray-500" />
                            <span>{event.speed_kmh || 55} km/h</span>
                          </span>
                          <span className="flex items-center space-x-1">
                            <MapPin className="w-3 h-3 text-gray-500" />
                            <span>({event.lat.toFixed(4)}, {event.lon.toFixed(4)})</span>
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <div className="text-right text-[11px] font-mono">
                          <span className="text-gray-500">OCR CONF: </span>
                          <span className="text-cyan-400 font-semibold">{(event.confidence * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
