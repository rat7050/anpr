import React, { useState, useEffect } from 'react';
import { RtoVehicleDetails } from '../types/traffic';
import { 
  X, 
  ExternalLink, 
  ShieldCheck, 
  AlertTriangle, 
  FileText, 
  Car, 
  Calendar, 
  Fuel, 
  MapPin, 
  User, 
  CheckCircle2, 
  Clock, 
  Search, 
  RefreshCw, 
  Award,
  AlertOctagon,
  Copy,
  Check
} from 'lucide-react';

interface CarInfoVehicleModalProps {
  plateNumber: string | null;
  isOpen: boolean;
  onClose: () => void;
}

export const CarInfoVehicleModal: React.FC<CarInfoVehicleModalProps> = ({
  plateNumber,
  isOpen,
  onClose
}) => {
  const [details, setDetails] = useState<RtoVehicleDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  const fetchRtoDetails = async (targetPlate: string) => {
    if (!targetPlate) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/rto-vehicle-lookup?plate=${encodeURIComponent(targetPlate)}`);
      if (!res.ok) {
        throw new Error('Failed to fetch vehicle RTO registration details');
      }
      const data = await res.json();
      setDetails(data);
      setSearchQuery(data.clean_plate);
    } catch (err: any) {
      console.error('RTO lookup error:', err);
      setError(err.message || 'Error communicating with RTO / CarInfo service');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && plateNumber) {
      setSearchQuery(plateNumber);
      fetchRtoDetails(plateNumber);
    }
  }, [isOpen, plateNumber]);

  const handleManualSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      fetchRtoDetails(searchQuery.trim());
    }
  };

  const handleCopyPlate = () => {
    if (details?.plate_number) {
      navigator.clipboard.writeText(details.plate_number);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md overflow-y-auto">
      <div className="bg-[#0b0e14] border border-cyan-500/30 rounded-2xl w-full max-w-2xl shadow-[0_0_50px_rgba(6,182,212,0.2)] overflow-hidden my-auto max-h-[92vh] flex flex-col">
        
        {/* Modal Header */}
        <div className="px-5 py-4 border-b border-white/10 bg-gradient-to-r from-[#0d121c] via-[#090d14] to-[#0d121c] flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <Car className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-sm sm:text-base font-bold text-white font-mono uppercase tracking-tight">
                  CarInfo RTO Vehicle Details
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  VAHAN REGISTRY
                </span>
              </div>
              <p className="text-[11px] text-gray-400 font-mono flex items-center space-x-1">
                <span>Integrated via</span>
                <a
                  href="https://www.carinfo.app/rto-vehicle-registration-detail"
                  target="_blank"
                  rel="noreferrer"
                  className="text-cyan-400 hover:underline font-bold inline-flex items-center space-x-0.5"
                >
                  <span>carinfo.app</span>
                  <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                </a>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-400 hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Search & Re-Query Bar */}
        <div className="px-5 py-3 bg-black/40 border-b border-white/10 shrink-0">
          <form onSubmit={handleManualSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                placeholder="Enter License Plate (e.g. DL 01 AB 1234, HR 26 DK 8392)..."
                className="w-full bg-[#07090e] border border-white/20 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 uppercase"
              />
            </div>
            <button
              type="submit"
              disabled={loading || !searchQuery.trim()}
              className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-gray-500 text-black font-mono text-xs font-bold uppercase rounded-lg transition-colors flex items-center space-x-1.5 shadow-[0_0_10px_rgba(6,182,212,0.3)] shrink-0"
            >
              {loading ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Search className="w-3.5 h-3.5" />
              )}
              <span>Lookup RC</span>
            </button>
          </form>
        </div>

        {/* Body Content */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1">
          {loading && (
            <div className="py-12 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-3 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-xs font-mono text-cyan-400 animate-pulse">
                Querying Vahan RTO Registry via carinfo.app...
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-300 text-xs font-mono flex items-start space-x-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <div>
                <div className="font-bold">Lookup Failed</div>
                <div className="text-gray-400 text-[11px] mt-0.5">{error}</div>
              </div>
            </div>
          )}

          {details && !loading && (
            <>
              {/* High Security Number Plate Badge */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 rounded-xl bg-black/60 border border-white/15">
                
                {/* Visual Indian HSRP License Plate */}
                <div className="flex items-stretch rounded-lg overflow-hidden border-2 border-white/60 bg-white shadow-xl">
                  {/* Blue IND Strip */}
                  <div className="bg-[#002b7f] text-white px-2 py-1.5 flex flex-col items-center justify-center space-y-0.5 border-r border-blue-900">
                    <div className="w-3.5 h-3.5 rounded-full border border-amber-400 flex items-center justify-center">
                      <div className="w-1.5 h-1.5 rounded-full bg-amber-400"></div>
                    </div>
                    <span className="text-[9px] font-mono font-black tracking-widest text-amber-300">IND</span>
                  </div>
                  {/* Plate Text */}
                  <div className="px-4 py-1.5 flex items-center bg-white text-black font-mono font-black text-lg sm:text-xl tracking-wider">
                    {details.plate_number}
                  </div>
                </div>

                {/* Quick Plate Actions */}
                <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={handleCopyPlate}
                    className="px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white font-mono text-xs flex items-center space-x-1.5 transition-colors"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copied ? 'Copied' : 'Copy Plate'}</span>
                  </button>

                  <a
                    href={details.carinfo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-mono text-xs font-bold flex items-center space-x-1.5 shadow-[0_0_12px_rgba(6,182,212,0.3)] transition-all"
                  >
                    <span>CarInfo.app Portal</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>

              {/* Law Enforcement Blacklist Banner if Flagged */}
              {details.is_blacklisted && (
                <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-500 text-red-200 text-xs font-mono flex items-start space-x-3 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
                  <AlertOctagon className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-pulse" />
                  <div className="flex-1">
                    <div className="font-bold text-red-300 uppercase tracking-wide">
                      🚨 LAW ENFORCEMENT FLAG / BLACKLIST INTERCEPT
                    </div>
                    <div className="text-gray-300 text-[11px] mt-0.5">
                      {details.blacklist_reason || 'Target Vehicle flagged in National Crime Records Bureau / Delhi Police Stolen Vehicle Database'}
                    </div>
                  </div>
                </div>
              )}

              {/* Vehicle Identity & Model Banner */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-[#121722] to-[#0a0d14] border border-white/10 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">
                    Vehicle Model & Classification
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-white/5 border border-white/10 text-gray-300">
                    {details.fuel_type} • {details.emission_norm}
                  </span>
                </div>
                <div className="text-base sm:text-lg font-black text-white tracking-tight">
                  {details.maker_model}
                </div>
                <div className="text-xs text-gray-400 font-mono flex flex-wrap gap-2 pt-1">
                  <span>Class: <strong className="text-gray-200">{details.vehicle_class}</strong></span>
                  {details.vehicle_color && (
                    <span>• Color: <strong className="text-gray-200">{details.vehicle_color}</strong></span>
                  )}
                </div>
              </div>

              {/* RC Specifications Matrix */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                
                {/* Owner & Authority Card */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <User className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Owner & RTO Jurisdiction</span>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Owner Name (Masked)</div>
                    <div className="text-white font-bold text-sm">{details.owner_name_masked}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Registering Authority (RTO)</div>
                    <div className="text-cyan-300 font-bold">{details.rto_name}</div>
                    <div className="text-gray-400 text-[10px]">State: {details.rto_state}</div>
                  </div>
                </div>

                {/* Registration & Age Card */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Registration Age & Date</span>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Registration Date</div>
                    <div className="text-white font-bold text-sm">{details.registration_date}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Vehicle Age</div>
                    <div className="text-emerald-400 font-bold">{details.vehicle_age}</div>
                  </div>
                </div>

                {/* Engine & Chassis Details */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <FileText className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Technical Identifiers</span>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Engine Number</div>
                    <div className="text-gray-200 font-mono text-xs">{details.engine_number_masked}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Chassis Number</div>
                    <div className="text-gray-200 font-mono text-xs">{details.chassis_number_masked}</div>
                  </div>
                </div>

                {/* Tax Status */}
                <div className="p-3.5 rounded-xl bg-black/40 border border-white/10 space-y-2.5">
                  <div className="text-gray-400 text-[10px] uppercase font-bold tracking-wider flex items-center space-x-1.5">
                    <Award className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Road Tax & Fitness</span>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Tax Paid Status</div>
                    <div className="text-green-400 font-bold text-xs">{details.tax_status}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px]">Fitness Valid Upto</div>
                    <div className="text-white font-bold text-xs">{details.fitness_upto}</div>
                  </div>
                </div>

              </div>

              {/* Compliance Cards: Insurance & PUCC */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs font-mono">
                
                {/* Insurance Card */}
                <div className="p-3.5 rounded-xl bg-[#0e141f] border border-cyan-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-gray-400 font-bold flex items-center space-x-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
                      <span>Motor Insurance</span>
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      details.insurance_status === 'Active' ? 'bg-green-500/20 text-green-300 border border-green-500/40' : 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                    }`}>
                      {details.insurance_status}
                    </span>
                  </div>
                  <div className="text-white font-bold text-xs truncate">
                    {details.insurance_provider}
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Valid up to: <strong className="text-cyan-300">{details.insurance_expiry}</strong>
                  </div>
                </div>

                {/* Pollution Certificate PUCC */}
                <div className="p-3.5 rounded-xl bg-[#0e141f] border border-green-500/20 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] uppercase text-gray-400 font-bold flex items-center space-x-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span>Pollution Certificate (PUCC)</span>
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-green-500/20 text-green-300 border border-green-500/40">
                      {details.pucc_status}
                    </span>
                  </div>
                  <div className="text-white font-bold text-xs">
                    Air Quality Standard Compliant
                  </div>
                  <div className="text-gray-400 text-[11px]">
                    Valid up to: <strong className="text-green-300">{details.pucc_expiry}</strong>
                  </div>
                </div>

              </div>

              {/* e-Challan & Traffic Fines Section */}
              <div className={`p-4 rounded-xl border text-xs font-mono space-y-2 ${
                details.challan_count > 0 
                  ? 'bg-amber-950/30 border-amber-500/40 text-amber-200' 
                  : 'bg-green-950/20 border-green-500/30 text-green-200'
              }`}>
                <div className="flex items-center justify-between">
                  <span className="font-bold uppercase tracking-wider flex items-center space-x-1.5">
                    {details.challan_count > 0 ? (
                      <AlertTriangle className="w-4 h-4 text-amber-400" />
                    ) : (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                    <span>e-Challan & Traffic Violation Status</span>
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-black/40 border border-white/10">
                    {details.challan_count} PENDING
                  </span>
                </div>
                <p className="text-gray-300 text-[11px] leading-relaxed">
                  {details.challan_summary}
                </p>
                {details.challan_count > 0 && (
                  <div className="pt-1 flex items-center justify-between text-[11px]">
                    <span className="text-amber-300 font-bold">Outstanding Fine Amount: ₹{details.challan_amount.toLocaleString('en-IN')}</span>
                    <a
                      href="https://www.carinfo.app/rto-vehicle-registration-detail"
                      target="_blank"
                      rel="noreferrer"
                      className="text-cyan-400 hover:underline inline-flex items-center space-x-1 font-bold"
                    >
                      <span>Pay e-Challan on CarInfo</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                )}
              </div>

              {/* Direct Footer CTA to CarInfo.app */}
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2 border-t border-white/10 text-xs font-mono text-gray-400">
                <span>Direct Data Source: Ministry of Road Transport & Highways (Vahan)</span>
                <a
                  href="https://www.carinfo.app/rto-vehicle-registration-detail"
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase flex items-center space-x-1.5 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.35)] w-full sm:w-auto justify-center"
                >
                  <span>Open Registration Detail on CarInfo.app</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
};
