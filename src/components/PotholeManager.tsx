import React, { useState } from 'react';
import { PotholeEvent } from '../types/traffic';
import { AlertTriangle, CheckCircle2, Clock, Wrench, Shield, Filter, Sparkles, MapPin } from 'lucide-react';

interface PotholeManagerProps {
  potholes: PotholeEvent[];
  onUpdateStatus: (id: string, newStatus: 'reported' | 'scheduled' | 'fixed') => void;
  onSelectOnMap?: (lat: number, lon: number) => void;
}

export const PotholeManager: React.FC<PotholeManagerProps> = ({
  potholes,
  onUpdateStatus,
  onSelectOnMap
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const filtered = potholes.filter(p => {
    if (severityFilter !== 'all' && p.severity !== severityFilter) return false;
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    return true;
  });

  const criticalCount = potholes.filter(p => p.severity === 'critical' && p.status !== 'fixed').length;
  const highCount = potholes.filter(p => p.severity === 'high' && p.status !== 'fixed').length;
  const fixedCount = potholes.filter(p => p.status === 'fixed').length;

  return (
    <div className="flex flex-col space-y-4">
      
      {/* Top Metrics Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="bg-[#0d1016] p-3.5 rounded-xl border border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[10px] text-gray-400 font-mono uppercase">Total Hazards Detected</div>
            <div className="text-xl font-bold font-mono text-white">{potholes.length}</div>
          </div>
          <AlertTriangle className="w-6 h-6 text-orange-400" />
        </div>

        <div className="bg-[#0d1016] p-3.5 rounded-xl border border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[10px] text-gray-400 font-mono uppercase">Critical Priority</div>
            <div className="text-xl font-bold font-mono text-red-400">{criticalCount}</div>
          </div>
          <span className="w-3 h-3 rounded-full bg-red-500 animate-ping"></span>
        </div>

        <div className="bg-[#0d1016] p-3.5 rounded-xl border border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[10px] text-gray-400 font-mono uppercase">High / Medium</div>
            <div className="text-xl font-bold font-mono text-orange-400">{highCount}</div>
          </div>
          <Wrench className="w-6 h-6 text-orange-400" />
        </div>

        <div className="bg-[#0d1016] p-3.5 rounded-xl border border-white/10 flex items-center justify-between shadow-lg">
          <div>
            <div className="text-[10px] text-gray-400 font-mono uppercase">Repaired & Certified</div>
            <div className="text-xl font-bold font-mono text-green-400">{fixedCount}</div>
          </div>
          <CheckCircle2 className="w-6 h-6 text-green-400" />
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-[#0d1016] p-3.5 rounded-xl border border-white/10 flex flex-wrap items-center justify-between gap-3 shadow-lg">
        <div className="flex items-center space-x-2 text-xs">
          <Filter className="w-4 h-4 text-cyan-400" />
          <span className="text-gray-300 font-mono text-[10px] uppercase font-bold">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              onClick={() => setSeverityFilter(sev)}
              className={`px-2.5 py-1 rounded uppercase text-[10px] font-mono font-bold transition-colors ${
                severityFilter === sev
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/70 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-black/60 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <span className="text-gray-300 font-mono text-[10px] uppercase font-bold">Status:</span>
          {['all', 'reported', 'scheduled', 'fixed'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-2.5 py-1 rounded uppercase text-[10px] font-mono font-bold transition-colors ${
                statusFilter === st
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/70 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                  : 'bg-black/60 text-gray-400 hover:text-white border border-white/5'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Potholes List Table */}
      <div className="bg-[#0d1016] rounded-xl border border-white/10 overflow-hidden shadow-xl">
        <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#0a0c10]">
          <h3 className="text-sm font-bold text-white uppercase tracking-tight flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <span>Pothole Registry & Public Works Queue ({filtered.length})</span>
          </h3>
          <span className="text-[10px] font-mono text-cyan-400">YOLOV8 INTEL UNNATI • DE-DUPLICATION RADIUS 15M</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-black/80 text-gray-400 uppercase tracking-wider font-mono text-[10px] border-b border-white/10">
              <tr>
                <th className="py-2.5 px-3">Hazard ID</th>
                <th className="py-2.5 px-3">Severity</th>
                <th className="py-2.5 px-3">Surface Area & Depth</th>
                <th className="py-2.5 px-3">Camera / Sector</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Confidence</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-gray-300">
              {filtered.map((pot, index) => {
                const isFixed = pot.status === 'fixed';
                const sevBadge = 
                  pot.severity === 'critical' ? 'bg-red-500/20 text-red-300 border-red-500/50' :
                  pot.severity === 'high' ? 'bg-orange-500/20 text-orange-300 border-orange-500/50' :
                  pot.severity === 'medium' ? 'bg-amber-500/20 text-amber-300 border-amber-500/50' :
                  'bg-blue-500/20 text-blue-300 border-blue-500/50';

                return (
                  <tr key={`pothole-row-${pot.id}-${index}`} className="hover:bg-white/5 transition-colors">
                    <td className="py-3 px-3 font-mono font-bold text-white">{pot.id}</td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded border text-[9px] font-mono font-bold uppercase ${sevBadge}`}>
                        {pot.severity}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white font-mono">{pot.area_sq_cm || 850} cm²</div>
                      <div className="text-[10px] text-gray-400 font-mono">Depth: {pot.depth_estimate_cm || 6.5} cm</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white font-mono">{pot.camera_id}</div>
                      <div className="text-[10px] text-gray-400 font-mono">({pot.lat.toFixed(4)}, {pot.lon.toFixed(4)})</div>
                    </td>
                    <td className="py-3 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-semibold uppercase ${
                        pot.status === 'fixed' ? 'bg-green-500/20 text-green-300 border border-green-500/50' :
                        pot.status === 'scheduled' ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50' :
                        'bg-black/60 text-gray-300 border border-white/10'
                      }`}>
                        {pot.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 font-mono text-cyan-400 font-semibold">
                      {(pot.confidence * 100).toFixed(1)}%
                    </td>
                    <td className="py-3 px-3 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        {pot.status !== 'fixed' && (
                          <button
                            onClick={() => onUpdateStatus(pot.id, 'fixed')}
                            className="px-2.5 py-1 rounded bg-green-500 hover:bg-green-400 text-black text-[10px] font-mono font-bold uppercase transition-colors"
                          >
                            Mark Repaired
                          </button>
                        )}
                        {pot.status === 'reported' && (
                          <button
                            onClick={() => onUpdateStatus(pot.id, 'scheduled')}
                            className="px-2.5 py-1 rounded bg-orange-500 hover:bg-orange-400 text-black text-[10px] font-mono font-bold uppercase transition-colors"
                          >
                            Schedule Crew
                          </button>
                        )}
                        {pot.status === 'fixed' && (
                          <span className="text-[11px] text-green-400 font-mono font-bold">✓ CERTIFIED</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
