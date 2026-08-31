import React from 'react';
import { AlertItem } from '../types/traffic';
import { ShieldAlert, AlertTriangle, CheckCircle, Clock, Send, Volume2, X, MapPin } from 'lucide-react';

interface AccidentAlertPanelProps {
  alerts: AlertItem[];
  isOpen: boolean;
  onClose: () => void;
  onAcknowledge: (id: string) => void;
  onDispatch: (alert: AlertItem) => void;
}

export const AccidentAlertPanel: React.FC<AccidentAlertPanelProps> = ({
  alerts,
  isOpen,
  onClose,
  onAcknowledge,
  onDispatch
}) => {
  if (!isOpen) return null;

  const unackCount = alerts.filter(a => !a.acknowledged).length;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/80 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-[#0d1016] h-full border-l border-white/10 shadow-2xl flex flex-col">
        
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0a0c10]">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded bg-red-500/20 text-red-400 border border-red-500/40 shadow-[0_0_10px_rgba(239,68,68,0.3)]">
              <ShieldAlert className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white uppercase tracking-tight">Live Incident & Alert Feed</h2>
              <p className="text-[10px] text-cyan-400 font-mono tracking-wide">
                {unackCount > 0 ? `${unackCount} UNACKNOWLEDGED CRITICAL ALERTS` : 'ALL ALERTS ACKNOWLEDGED'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded text-gray-400 hover:text-white hover:bg-white/5 border border-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {alerts.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-xs font-mono">
              NO ACTIVE ALERTS IN FEED.
            </div>
          ) : (
            alerts.map((alert, idx) => {
              const isAccident = alert.type === 'accident';
              const isCritical = alert.severity === 'critical';

              return (
                <div
                  key={`alert-card-${alert.id}-${idx}`}
                  className={`p-3.5 rounded-lg border transition-all flex flex-col space-y-2.5 ${
                    !alert.acknowledged
                      ? isCritical
                        ? 'bg-red-950/30 border-red-500/60 shadow-[0_0_15px_rgba(239,68,68,0.25)] ring-1 ring-red-500/40'
                        : 'bg-orange-950/30 border-orange-500/50 shadow'
                      : 'bg-black/40 border-white/5 opacity-75'
                  }`}
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase ${
                      isAccident
                        ? 'bg-red-500/30 text-red-300 border border-red-500/50'
                        : 'bg-cyan-500/30 text-cyan-300 border border-cyan-500/50'
                    }`}>
                      {alert.type}
                    </span>

                    <span className="text-[10px] font-mono text-gray-400 flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-gray-500" />
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-tight mb-1">{alert.title}</h4>
                    <p className="text-[11px] text-gray-300 leading-relaxed">{alert.description}</p>
                  </div>

                  {/* Location Tag */}
                  <div className="text-[10px] font-mono text-cyan-400/80 flex items-center space-x-1">
                    <MapPin className="w-3 h-3 text-cyan-400" />
                    <span>{alert.camera_name || alert.camera_id} ({alert.road_name || 'City Sector'})</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    {!alert.acknowledged ? (
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs font-mono uppercase flex items-center space-x-1.5 transition-colors"
                      >
                        <CheckCircle className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Acknowledge</span>
                      </button>
                    ) : (
                      <span className="text-[10px] font-mono text-green-400 font-bold flex items-center space-x-1">
                        <CheckCircle className="w-3.5 h-3.5 text-green-400" />
                        <span>ACKNOWLEDGED</span>
                      </span>
                    )}

                    <button
                      onClick={() => onDispatch(alert)}
                      className="px-3 py-1 rounded bg-red-500 hover:bg-red-400 text-black text-xs font-mono font-bold uppercase shadow-[0_0_10px_rgba(239,68,68,0.4)] flex items-center space-x-1.5 transition-colors"
                    >
                      <Send className="w-3 h-3 text-black" />
                      <span>Dispatch Response</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
