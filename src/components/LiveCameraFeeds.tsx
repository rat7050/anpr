import React, { useState, useEffect, useRef } from 'react';
import { Camera, IngestionResult } from '../types/traffic';
import { Camera as CamIcon, Eye, Radio, RefreshCw, Cpu, ShieldAlert, Sparkles, Video, Play, Square, Trash2, MapPin, CheckCircle2, AlertTriangle, Crosshair, ExternalLink, Car, Search } from 'lucide-react';
import { CarInfoVehicleModal } from './CarInfoVehicleModal';

interface LiveCameraFeedsProps {
  cameras: Camera[];
  selectedCamera: Camera | null;
  onSelectCamera: (cam: Camera) => void;
  onTriggerIngest: (cameraId: string, customPlate?: string) => void;
  onIngestResult?: (result: IngestionResult) => void;
  onPurgeMockData?: () => void;
  onRegisterCamera?: (cam: Camera) => void;
}

export const LiveCameraFeeds: React.FC<LiveCameraFeedsProps> = ({
  cameras,
  selectedCamera,
  onSelectCamera,
  onTriggerIngest,
  onIngestResult,
  onPurgeMockData,
  onRegisterCamera
}) => {
  const [activeCamId, setActiveCamId] = useState<string>(selectedCamera?.id || 'CAM-DESKTOP');
  const [overlayEnabled, setOverlayEnabled] = useState<boolean>(true);
  const [isWebcamActive, setIsWebcamActive] = useState<boolean>(false);
  const [webcamPermissionError, setWebcamPermissionError] = useState<string | null>(null);
  const [isAutoScanning, setIsAutoScanning] = useState<boolean>(false);
  const [isProcessingFrame, setIsProcessingFrame] = useState<boolean>(false);
  const [lastLiveResult, setLastLiveResult] = useState<IngestionResult & { scene_summary?: string } | null>(null);
  const [scanCount, setScanCount] = useState<number>(0);
  const [customCamRegistered, setCustomCamRegistered] = useState<boolean>(false);
  
  // CarInfo RTO Lookup Modal State
  const [selectedRtoPlate, setSelectedRtoPlate] = useState<string | null>(null);
  const [isRtoModalOpen, setIsRtoModalOpen] = useState<boolean>(false);
  const [rtoSearchInput, setRtoSearchInput] = useState<string>('');

  const handleOpenCarInfo = (plate: string) => {
    setSelectedRtoPlate(plate);
    setIsRtoModalOpen(true);
  };

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Default Desktop Camera Object
  const desktopCam: Camera = {
    id: 'CAM-DESKTOP',
    name: 'My Desktop Camera (Live CV Node)',
    lat: 28.5828,
    lon: 77.2995,
    road_name: 'Local Station / Real-time Optical Stream',
    status: isWebcamActive ? 'active' : 'offline',
    fps: 30,
    resolution: '1280x720',
    zone: 'Active Desktop Sensor'
  };

  const isDesktopCamActive = activeCamId === 'CAM-DESKTOP';
  const activeCam = isDesktopCamActive ? desktopCam : (cameras.find(c => c.id === activeCamId) || cameras[0]);

  // Request real browser camera stream
  const startDesktopCamera = async () => {
    setWebcamPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user'
        },
        audio: false
      });

      if (!isMountedRef.current) {
        stream.getTracks().forEach(t => t.stop());
        return;
      }

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            await playPromise;
          }
        } catch (playErr: any) {
          // Play request might be interrupted by navigation or stream re-assignment
          if (playErr.name !== 'AbortError') {
            console.debug('Video playback notice:', playErr);
          }
        }
        if (isMountedRef.current) {
          setIsWebcamActive(true);
        }
      }
      // Register with parent if not already
      if (onRegisterCamera && !customCamRegistered) {
        onRegisterCamera(desktopCam);
        setCustomCamRegistered(true);
      }
    } catch (err: any) {
      if (isMountedRef.current) {
        console.error('Desktop camera access failed:', err);
        setWebcamPermissionError(err.message || 'Camera permission denied. Please allow camera access in browser settings.');
      }
    }
  };

  // Stop desktop camera stream
  const stopDesktopCamera = () => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
      setIsAutoScanning(false);
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      try {
        videoRef.current.pause();
      } catch (_) {}
      videoRef.current.srcObject = null;
      if (isMountedRef.current) {
        setIsWebcamActive(false);
      }
    }
  };

  // Auto-start webcam if CAM-DESKTOP is active on mount
  useEffect(() => {
    isMountedRef.current = true;
    if (isDesktopCamActive) {
      startDesktopCamera();
    } else {
      stopDesktopCamera();
    }
    return () => {
      isMountedRef.current = false;
      stopDesktopCamera();
    };
  }, [isDesktopCamActive]);

  // Capture current webcam frame and send to real Vision AI inference
  const captureAndAnalyzeFrame = async () => {
    if (!videoRef.current || !canvasRef.current || isProcessingFrame) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.videoWidth === 0 || video.videoHeight === 0) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const base64 = canvas.toDataURL('image/jpeg', 0.85);

    setIsProcessingFrame(true);
    try {
      const res = await fetch('/api/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: base64,
          camera_id: 'CAM-DESKTOP'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastLiveResult(data);
        setScanCount(c => c + 1);
        if (onIngestResult) {
          onIngestResult(data);
        }
      }
    } catch (err) {
      console.error('Frame analysis failed:', err);
    } finally {
      setIsProcessingFrame(false);
    }
  };

  // Toggle continuous auto-scanning loop
  const toggleAutoScanning = () => {
    if (isAutoScanning) {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
      setIsAutoScanning(false);
    } else {
      setIsAutoScanning(true);
      captureAndAnalyzeFrame();
      autoScanTimerRef.current = setInterval(() => {
        captureAndAnalyzeFrame();
      }, 3500);
    }
  };

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, []);

  // Preset images for city cameras
  const cameraImages: Record<string, string> = {
    'CAM-01': 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    'CAM-02': 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
    'CAM-03': 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    'CAM-04': 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    'CAM-05': 'https://images.unsplash.com/photo-1498084393753-b411b2d26b34?auto=format&fit=crop&w=1200&q=80',
    'CAM-06': 'https://images.unsplash.com/photo-1517649763962-0c623266ddc0?auto=format&fit=crop&w=1200&q=80',
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full">
      <canvas ref={canvasRef} className="hidden" />

      {/* Left Column: Focused Main Camera Feed with Live CV Overlay */}
      <div className="lg:col-span-8 flex flex-col space-y-3">
        <div className="bg-[#0d1016] rounded-xl border border-white/10 p-3.5 flex flex-col space-y-3 shadow-xl">
          
          {/* Top Bar of Main Feed */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-1.5 px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-cyan-400 text-[11px] font-mono font-semibold">
                <span className={`w-2 h-2 rounded-full ${isDesktopCamActive ? (isWebcamActive ? 'bg-green-400 animate-ping' : 'bg-red-400') : 'bg-cyan-400 animate-ping'}`}></span>
                <span>{isDesktopCamActive ? 'DESKTOP WEBCAM // REAL-TIME' : 'RTSP // LIVE STREAM'}</span>
              </div>
              <h3 className="text-sm font-bold text-white uppercase tracking-tight">{activeCam?.name}</h3>
              <span className="text-xs font-mono text-cyan-400">({activeCam?.id})</span>
            </div>

            {/* Top Right Controls */}
            <div className="flex items-center space-x-2">
              {isDesktopCamActive ? (
                <>
                  <button
                    onClick={toggleAutoScanning}
                    disabled={!isWebcamActive}
                    className={`flex items-center space-x-1 text-xs px-2.5 py-1 rounded border font-mono uppercase font-semibold transition-all ${
                      isAutoScanning
                        ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.4)]'
                        : 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300 hover:bg-cyan-500/30'
                    }`}
                  >
                    {isAutoScanning ? <Square className="w-3 h-3 fill-red-400" /> : <Play className="w-3 h-3 fill-cyan-400" />}
                    <span>{isAutoScanning ? 'Stop Auto-Scan' : '⚡ Auto-Detect (3s)'}</span>
                  </button>

                  <button
                    onClick={captureAndAnalyzeFrame}
                    disabled={!isWebcamActive || isProcessingFrame}
                    className="flex items-center space-x-1.5 text-xs px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-gray-500 text-black font-bold uppercase shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-colors"
                  >
                    {isProcessingFrame ? (
                      <span className="w-3 h-3 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                    ) : (
                      <Crosshair className="w-3.5 h-3.5" />
                    )}
                    <span>{isProcessingFrame ? 'Detecting...' : 'Scan Frame'}</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setOverlayEnabled(!overlayEnabled)}
                    className={`text-xs px-2.5 py-1 rounded border font-mono uppercase font-semibold transition-all ${
                      overlayEnabled
                        ? 'bg-cyan-500/20 border-cyan-500/60 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.3)]'
                        : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {overlayEnabled ? '✓ Bounding Boxes' : 'Raw Feed'}
                  </button>

                  <button
                    onClick={() => onTriggerIngest(activeCam.id)}
                    className="flex items-center space-x-1.5 text-xs px-3 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-black font-bold uppercase shadow-[0_0_10px_rgba(6,182,212,0.4)] transition-colors"
                  >
                    <Cpu className="w-3.5 h-3.5" />
                    <span>Trigger Ingest</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Main Video Stream Container */}
          <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-black border border-white/10 group">
            
            {/* 1. Real Desktop Webcam Video Element */}
            {isDesktopCamActive ? (
              <>
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isWebcamActive ? 'hidden' : ''}`}
                />
                {!isWebcamActive && (
                  <div className="w-full h-full flex flex-col items-center justify-center space-y-3 bg-[#080a0e] p-6 text-center">
                    <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                      <CamIcon className="w-7 h-7 text-cyan-400" />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase">Desktop Camera Inactive</h4>
                      <p className="text-xs text-gray-400 max-w-sm mt-1">
                        Grant browser webcam permission to perform live computer vision detection (ANPR, road hazards, vehicle scene analysis) using your real desktop camera.
                      </p>
                    </div>
                    {webcamPermissionError && (
                      <div className="text-red-400 text-xs font-mono max-w-md bg-red-950/40 p-2 rounded border border-red-500/30">
                        ⚠️ {webcamPermissionError}
                      </div>
                    )}
                    <button
                      onClick={startDesktopCamera}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-black rounded text-xs font-mono font-bold uppercase shadow-[0_0_15px_rgba(6,182,212,0.4)] flex items-center space-x-2 transition-colors"
                    >
                      <Video className="w-4 h-4" />
                      <span>Start Desktop Camera Access</span>
                    </button>
                  </div>
                )}
              </>
            ) : (
              /* 2. Corridor RTSP Video Image */
              <img
                src={cameraImages[activeCam.id] || cameraImages['CAM-01']}
                alt={activeCam.name}
                className="w-full h-full object-cover filter brightness-90"
              />
            )}

            {/* Video HUD Telemetry */}
            <div className="absolute top-3 left-3 bg-black/80 backdrop-blur-md px-3 py-2 rounded border border-cyan-500/40 text-[10px] font-mono text-cyan-300 space-y-0.5 z-10 shadow-lg">
              <div>SOURCE: {isDesktopCamActive ? 'LOCAL WEBCAM FEED' : activeCam.road_name}</div>
              <div>RES: {activeCam.resolution} @ {activeCam.fps} FPS</div>
              <div>PIPELINES: GEMINI 2.5 FLASH VISION • REAL DETECTIONS</div>
            </div>

            <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-md px-2.5 py-1 rounded border border-white/10 text-[10px] font-mono text-gray-300 z-10">
              {new Date().toLocaleTimeString()} UTC
            </div>

            {/* REAL COMPUTER VISION BOUNDING BOXES FOR DESKTOP CAMERA */}
            {isDesktopCamActive && lastLiveResult && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Real ANPR Detections from Webcam */}
                {lastLiveResult.anpr_detections.map((anpr, idx) => (
                  <div
                    key={`live-anpr-${idx}`}
                    className={`absolute border-2 ${
                      anpr.is_blacklisted ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.6)]' : 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.6)]'
                    } rounded transition-all duration-300`}
                    style={{
                      top: `${anpr.bbox[1] * 100}%`,
                      left: `${anpr.bbox[0] * 100}%`,
                      width: `${Math.max(anpr.bbox[2] * 100, 12)}%`,
                      height: `${Math.max(anpr.bbox[3] * 100, 7)}%`
                    }}
                  >
                    <div className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-black ${
                      anpr.is_blacklisted ? 'bg-red-400' : 'bg-cyan-400'
                    } whitespace-nowrap shadow`}>
                      {anpr.is_blacklisted ? '🚨 BOLO: ' : '🚗 PLATE: '} {anpr.plate_text} ({(anpr.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                ))}

                {/* Real Pothole Detections from Webcam */}
                {lastLiveResult.pothole_detections.map((pot, idx) => (
                  <div
                    key={`live-pot-${idx}`}
                    className="absolute border-2 border-orange-400 bg-orange-500/20 rounded shadow-[0_0_15px_rgba(249,115,22,0.5)] transition-all duration-300"
                    style={{
                      top: `${pot.bbox[1] * 100}%`,
                      left: `${pot.bbox[0] * 100}%`,
                      width: `${Math.max(pot.bbox[2] * 100, 12)}%`,
                      height: `${Math.max(pot.bbox[3] * 100, 10)}%`
                    }}
                  >
                    <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-black bg-orange-400 whitespace-nowrap shadow">
                      ⚠️ ROAD DEFECT {pot.severity.toUpperCase()} ({pot.area_score} cm²)
                    </div>
                  </div>
                ))}

                {/* Real Accident / Collision Detections from Webcam */}
                {lastLiveResult.accident_detections.map((acc, idx) => (
                  <div
                    key={`live-acc-${idx}`}
                    className="absolute border-2 border-dashed border-red-500 bg-red-600/30 rounded animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.7)]"
                    style={{
                      top: `${acc.bbox[1] * 100}%`,
                      left: `${acc.bbox[0] * 100}%`,
                      width: `${Math.max(acc.bbox[2] * 100, 20)}%`,
                      height: `${Math.max(acc.bbox[3] * 100, 15)}%`
                    }}
                  >
                    <div className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-black bg-red-400 whitespace-nowrap shadow flex items-center space-x-1">
                      <span className="w-2 h-2 rounded-full bg-black animate-ping"></span>
                      <span>COLLISION DETECTED ({acc.collision_type})</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Bottom Pipeline Status Pill */}
            <div className="absolute bottom-2 left-2 right-2 bg-black/85 backdrop-blur-md px-3 py-1.5 rounded border border-white/10 flex flex-wrap items-center justify-between text-xs text-gray-300 font-mono gap-2">
              <div className="flex items-center space-x-3">
                <span className="flex items-center space-x-1.5">
                  <span className={`w-2 h-2 rounded-full ${isProcessingFrame ? 'bg-cyan-400 animate-spin' : 'bg-green-400'}`}></span>
                  <span className="font-semibold text-cyan-400">Model:</span> Gemini 2.5 Flash Vision
                </span>
                {lastLiveResult && (
                  <span className="text-gray-400 hidden sm:inline">
                    Latency: <strong className="text-white">{lastLiveResult.latency_ms.total}ms</strong>
                  </span>
                )}
                {isDesktopCamActive && (
                  <span className="text-gray-400">
                    Live Scans: <strong className="text-cyan-400">{scanCount}</strong>
                  </span>
                )}
              </div>
              <div className="text-gray-400 font-mono text-[10px]">
                {isDesktopCamActive ? 'REAL DESKTOP FEED' : 'CITY CORRIDOR MATRIX'}
              </div>
            </div>
          </div>

          {/* Real Live Ingestion Feedback Bar */}
          {isDesktopCamActive && lastLiveResult && (
            <div className="p-3 bg-black/70 rounded-lg border border-white/10 space-y-1.5 text-xs font-mono">
              <div className="flex items-center justify-between text-gray-300">
                <span className="text-cyan-400 font-bold flex items-center space-x-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                  <span>LIVE CAMERA INFERENCE RESULT:</span>
                </span>
                <span className="text-gray-400">
                  Plates: <strong className="text-white">{lastLiveResult.anpr_detections.length}</strong> | 
                  Defects: <strong className="text-white">{lastLiveResult.pothole_detections.length}</strong> | 
                  Collisions: <strong className="text-white">{lastLiveResult.accident_detections.length}</strong>
                </span>
              </div>
              {lastLiveResult.scene_summary && (
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {lastLiveResult.scene_summary}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Right Column: Camera Matrix & Pure Real Mode Controls */}
      <div className="lg:col-span-4 flex flex-col space-y-2.5 h-full overflow-y-auto pr-1 max-h-[640px]">
        
        {/* Real Data Mode Toolbar */}
        <div className="bg-[#0d1016] p-3 rounded-xl border border-white/10 space-y-2 shadow-lg">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-white font-mono uppercase">Sensor Stream Mode</span>
            <span className="text-[9px] px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 font-mono border border-green-500/30">
              REAL CV ONLINE
            </span>
          </div>

          {onPurgeMockData && (
            <button
              onClick={onPurgeMockData}
              className="w-full py-1.5 px-2.5 bg-red-950/40 hover:bg-red-900/50 border border-red-500/40 text-red-300 rounded text-[10px] font-mono font-semibold uppercase flex items-center justify-center space-x-1.5 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 text-red-400" />
              <span>Purge Mock Data (Real Camera Only)</span>
            </button>
          )}
        </div>

        {/* 1. Desktop Camera Primary Card */}
        <div
          onClick={() => {
            setActiveCamId('CAM-DESKTOP');
            onSelectCamera(desktopCam);
            if (!isWebcamActive) startDesktopCamera();
          }}
          className={`p-3 rounded-xl border cursor-pointer transition-all flex items-center space-x-3 ${
            isDesktopCamActive
              ? 'bg-[#0d1016] border-cyan-500 shadow-[0_0_15px_rgba(6,182,212,0.3)] ring-1 ring-cyan-500'
              : 'bg-[#0a0c10]/90 border-cyan-500/30 hover:border-cyan-500/60'
          }`}
        >
          <div className="relative w-20 h-14 rounded overflow-hidden bg-black flex-shrink-0 border border-cyan-500/40 flex items-center justify-center">
            {isWebcamActive ? (
              <div className="w-full h-full bg-cyan-950 flex flex-col items-center justify-center text-cyan-300">
                <CamIcon className="w-6 h-6 animate-pulse" />
                <span className="text-[8px] font-mono font-bold mt-0.5">STREAMING</span>
              </div>
            ) : (
              <div className="flex flex-col items-center text-gray-500">
                <CamIcon className="w-5 h-5" />
                <span className="text-[8px] font-mono mt-0.5">CLICK TO ON</span>
              </div>
            )}
            <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/80 text-green-400 font-mono text-[8px] border border-green-500/30">
              LOCAL
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-cyan-300 truncate uppercase">My Desktop Camera</h4>
              <span className={`w-2 h-2 rounded-full ${isWebcamActive ? 'bg-green-400 animate-ping' : 'bg-yellow-400'}`}></span>
            </div>
            <p className="text-[11px] text-gray-400 truncate">Live Real-Time Optical Computer Vision</p>
            <div className="flex items-center space-x-2 text-[10px] text-cyan-400 mt-1 font-mono">
              <span>{isWebcamActive ? 'ACTIVE STREAM' : 'STANDBY'}</span>
              <span>•</span>
              <span>1280x720</span>
            </div>
          </div>
        </div>

        {/* 2. City Matrix Cameras */}
        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-1 pt-1 font-mono flex items-center justify-between">
          <span>HIGHWAY CORRIDOR MATRIX ({cameras.length})</span>
          <span className="text-gray-500">ONLINE</span>
        </div>

        {cameras.map((cam) => {
          const isActive = cam.id === activeCamId;
          return (
            <div
              key={cam.id}
              onClick={() => {
                setActiveCamId(cam.id);
                onSelectCamera(cam);
              }}
              className={`p-2.5 rounded-lg border cursor-pointer transition-all flex items-center space-x-3 ${
                isActive
                  ? 'bg-[#0d1016] border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.25)] ring-1 ring-cyan-500/50'
                  : 'bg-[#0a0c10]/80 border-white/5 hover:bg-[#0d1016] hover:border-white/10'
              }`}
            >
              {/* Thumbnail */}
              <div className="relative w-20 h-14 rounded overflow-hidden bg-black flex-shrink-0 border border-white/10">
                <img
                  src={cameraImages[cam.id] || cameraImages['CAM-01']}
                  alt={cam.name}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-0.5 left-0.5 px-1 rounded bg-black/80 text-cyan-400 font-mono text-[9px] border border-cyan-500/30">
                  {cam.id}
                </span>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-white truncate uppercase">{cam.name}</h4>
                  <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                </div>
                <p className="text-[11px] text-gray-400 truncate">{cam.road_name}</p>
                <div className="flex items-center space-x-2 text-[10px] text-gray-500 mt-1 font-mono">
                  <span>{cam.fps} FPS</span>
                  <span>•</span>
                  <span>{cam.zone}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
