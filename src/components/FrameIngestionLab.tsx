import React, { useState, useRef, useEffect } from 'react';
import { IngestionResult, Camera, DatasetSample } from '../types/traffic';
import { DATASET_CATALOG, SAMPLE_DATASETS } from '../data/mockData';
import { Cpu, Play, Upload, Sparkles, CheckCircle, Camera as CamIcon, Image as ImgIcon, ExternalLink, RefreshCw, AlertTriangle, ShieldCheck, Square, Crosshair, Video } from 'lucide-react';

interface FrameIngestionLabProps {
  cameras: Camera[];
  onIngestionComplete: (result: IngestionResult) => void;
}

export const FrameIngestionLab: React.FC<FrameIngestionLabProps> = ({
  cameras,
  onIngestionComplete
}) => {
  const [selectedSample, setSelectedSample] = useState<DatasetSample>(SAMPLE_DATASETS[0]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('CAM-DESKTOP');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [lastResult, setLastResult] = useState<IngestionResult & { scene_summary?: string } | null>(null);
  const [customImageBase64, setCustomImageBase64] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<'webcam' | 'upload' | 'sample'>('webcam');
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const autoScanTimerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isMountedRef = useRef<boolean>(true);

  // Start real desktop camera stream
  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
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
          if (playErr.name !== 'AbortError') {
            console.debug('Webcam play notice:', playErr);
          }
        }
        if (isMountedRef.current) {
          setWebcamActive(true);
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('Webcam access error:', err);
      }
    }
  };

  const stopWebcam = () => {
    if (autoScanTimerRef.current) {
      clearInterval(autoScanTimerRef.current);
      autoScanTimerRef.current = null;
      setAutoScanEnabled(false);
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
        setWebcamActive(false);
      }
    }
  };

  // Start webcam automatically when entering webcam mode
  useEffect(() => {
    isMountedRef.current = true;
    if (inputMode === 'webcam') {
      startWebcam();
    } else {
      stopWebcam();
    }
    return () => {
      isMountedRef.current = false;
      stopWebcam();
    };
  }, [inputMode]);

  // Capture snapshot from webcam
  const captureWebcamSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (video.videoWidth === 0 || video.videoHeight === 0) return null;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCustomImageBase64(dataUrl);
        return dataUrl;
      }
    }
    return null;
  };

  // Handle local image file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        setCustomImageBase64(base64);
        setInputMode('upload');
      };
      reader.readAsDataURL(file);
    }
  };

  // Run real Vision API inference on server
  const handleRunInference = async (directBase64?: string) => {
    setIsProcessing(true);
    try {
      let imagePayload: string | undefined = directBase64 || customImageBase64 || undefined;

      // If webcam mode and no snapshot taken yet, grab live frame
      if (!imagePayload && inputMode === 'webcam' && webcamActive) {
        imagePayload = captureWebcamSnapshot() || undefined;
      }

      // If sample mode, convert sample image URL to base64
      if (!imagePayload && inputMode === 'sample' && selectedSample?.image_url) {
        try {
          const resp = await fetch(selectedSample.image_url);
          const blob = await resp.blob();
          imagePayload = await new Promise((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          });
        } catch (fetchErr) {
          // If CORS prevents blob fetch, fallback to server fetch
        }
      }

      const res = await fetch('/api/analyze-frame', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_base64: imagePayload,
          camera_id: selectedCameraId
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLastResult(data);
        onIngestionComplete(data);
      } else {
        console.error('Inference failed with status:', res.status);
      }
    } catch (error) {
      console.error('Real Vision Ingestion Error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Toggle Continuous Auto-Scan
  const toggleAutoScan = () => {
    if (autoScanEnabled) {
      if (autoScanTimerRef.current) {
        clearInterval(autoScanTimerRef.current);
        autoScanTimerRef.current = null;
      }
      setAutoScanEnabled(false);
    } else {
      setAutoScanEnabled(true);
      handleRunInference();
      autoScanTimerRef.current = setInterval(() => {
        handleRunInference();
      }, 3500);
    }
  };

  useEffect(() => {
    return () => {
      if (autoScanTimerRef.current) clearInterval(autoScanTimerRef.current);
    };
  }, []);

  const activeImageSrc = customImageBase64 || selectedSample?.image_url;

  return (
    <div className="flex flex-col space-y-4">
      <canvas ref={canvasRef} className="hidden" />

      {/* Top Banner */}
      <div className="bg-[#0d1016] rounded-xl p-4 border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center space-x-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            <span>Multimodal Vision Ingestion Lab</span>
          </h2>
          <p className="text-[10px] text-cyan-400 font-mono tracking-wide">
            LIVE DESKTOP WEBCAM FEED • OPTICAL HSRP ANPR • ROAD DAMAGE & COLLISION DETECTION
          </p>
        </div>

        <div className="flex items-center space-x-2">
          {inputMode === 'webcam' && (
            <button
              onClick={toggleAutoScan}
              disabled={!webcamActive}
              className={`px-3 py-2 rounded text-xs font-mono font-bold uppercase flex items-center space-x-1.5 border transition-all ${
                autoScanEnabled
                  ? 'bg-red-500/20 border-red-500 text-red-300 animate-pulse'
                  : 'bg-cyan-500/10 border-cyan-500/40 text-cyan-300 hover:bg-cyan-500/20'
              }`}
            >
              {autoScanEnabled ? <Square className="w-3.5 h-3.5 fill-red-400" /> : <Play className="w-3.5 h-3.5 fill-cyan-400" />}
              <span>{autoScanEnabled ? 'Stop Auto-Scan' : '⚡ Auto-Detect (3s)'}</span>
            </button>
          )}

          <button
            onClick={() => handleRunInference()}
            disabled={isProcessing}
            className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-gray-500 text-black rounded text-xs font-mono font-bold uppercase shadow-[0_0_15px_rgba(6,182,212,0.35)] flex items-center space-x-2 transition-colors self-start md:self-auto"
          >
            {isProcessing ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin"></span>
                <span>Inspecting Frame...</span>
              </>
            ) : (
              <>
                <Crosshair className="w-3.5 h-3.5" />
                <span>Execute Real Frame Analysis</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Ingestion Source Selector & Image Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Column: Image Source & Target Camera */}
        <div className="lg:col-span-5 flex flex-col space-y-4">
          
          {/* Source Mode Tabs */}
          <div className="bg-[#0d1016] p-4 rounded-xl border border-white/10 space-y-3 shadow-lg">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase">Frame Input Stream</span>
              <span className="text-[10px] text-cyan-400 font-mono">Real Optical Input</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => { setInputMode('webcam'); }}
                className={`p-2 rounded border text-xs font-mono uppercase flex flex-col items-center justify-center space-y-1 transition-all ${
                  inputMode === 'webcam'
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 ring-1 ring-cyan-500/50'
                    : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <CamIcon className="w-4 h-4" />
                <span className="text-[10px] font-bold">Desktop Cam</span>
              </button>

              <button
                onClick={() => { setInputMode('upload'); fileInputRef.current?.click(); }}
                className={`p-2 rounded border text-xs font-mono uppercase flex flex-col items-center justify-center space-y-1 transition-all ${
                  inputMode === 'upload' && customImageBase64
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Upload className="w-4 h-4" />
                <span className="text-[10px]">Upload Photo</span>
              </button>

              <button
                onClick={() => { setInputMode('sample'); setCustomImageBase64(null); stopWebcam(); }}
                className={`p-2 rounded border text-xs font-mono uppercase flex flex-col items-center justify-center space-y-1 transition-all ${
                  inputMode === 'sample' && !customImageBase64
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                    : 'bg-black/60 border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <ImgIcon className="w-4 h-4" />
                <span className="text-[10px]">Sample Sets</span>
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            {/* Live Webcam Stream Capture View */}
            {inputMode === 'webcam' && (
              <div className="mt-3 p-3 bg-black rounded border border-white/10 space-y-2">
                <div className="flex items-center justify-between text-[11px] font-mono text-gray-300">
                  <span className="flex items-center space-x-1.5">
                    <span className={`w-2 h-2 rounded-full ${webcamActive ? 'bg-green-400 animate-ping' : 'bg-red-400'}`}></span>
                    <span>{webcamActive ? 'DESKTOP CAMERA ACTIVE' : 'INITIALIZING SENSOR...'}</span>
                  </span>
                  <span className="text-cyan-400">1280x720 @ 30fps</span>
                </div>

                <div className="relative aspect-video rounded overflow-hidden bg-black border border-white/10">
                  <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
                  {!webcamActive && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <CamIcon className="w-8 h-8 text-gray-500 animate-pulse" />
                      <div className="text-xs font-mono text-gray-400">Requesting Desktop Camera Access...</div>
                      <button
                        onClick={startWebcam}
                        className="px-3 py-1 bg-cyan-500 text-black text-xs font-mono font-bold rounded uppercase"
                      >
                        Grant Access
                      </button>
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => {
                      const snap = captureWebcamSnapshot();
                      if (snap) handleRunInference(snap);
                    }}
                    disabled={!webcamActive || isProcessing}
                    className="flex-1 py-2 rounded bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 disabled:text-gray-500 text-black font-mono text-xs font-bold uppercase transition-colors flex items-center justify-center space-x-1.5"
                  >
                    <CamIcon className="w-3.5 h-3.5" />
                    <span>📸 Snap & Detect Now</span>
                  </button>
                  {webcamActive ? (
                    <button
                      onClick={stopWebcam}
                      className="px-3 py-2 rounded bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-mono uppercase border border-white/10"
                    >
                      Stop
                    </button>
                  ) : (
                    <button
                      onClick={startWebcam}
                      className="px-3 py-2 rounded bg-cyan-500/20 text-cyan-400 text-xs font-mono uppercase border border-cyan-500/40"
                    >
                      Start
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Benchmark Samples Selector */}
            {inputMode === 'sample' && (
              <div className="grid grid-cols-2 gap-2 mt-2">
                {SAMPLE_DATASETS.map((sample) => {
                  const isSelected = selectedSample.id === sample.id && !customImageBase64;
                  return (
                    <button
                      key={sample.id}
                      onClick={() => {
                        setSelectedSample(sample);
                        setCustomImageBase64(null);
                      }}
                      className={`p-2 rounded border text-left transition-all ${
                        isSelected
                          ? 'bg-cyan-500/20 border-cyan-500 ring-1 ring-cyan-500'
                          : 'bg-black/60 border-white/10 hover:bg-white/5'
                      }`}
                    >
                      <div className="relative aspect-video rounded overflow-hidden mb-1.5 bg-black border border-white/10">
                        <img src={sample.image_url} alt={sample.title} className="w-full h-full object-cover" />
                        <span className="absolute top-1 left-1 px-1 rounded bg-black/80 text-cyan-400 font-mono text-[9px] uppercase border border-cyan-500/30">
                          {sample.category}
                        </span>
                      </div>
                      <div className="font-bold text-[11px] text-white truncate">{sample.title}</div>
                      <div className="text-[10px] text-gray-400 truncate">{sample.dataset_source}</div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Camera Node Assignment */}
          <div className="bg-[#0d1016] p-4 rounded-xl border border-white/10 space-y-3 text-xs shadow-lg">
            <div className="font-bold text-white font-mono uppercase">Node Geographic Assignment</div>
            <div>
              <label className="block text-gray-400 mb-1 font-mono text-[11px]">Attach Detections To Camera Node</label>
              <select
                value={selectedCameraId}
                onChange={(e) => setSelectedCameraId(e.target.value)}
                className="w-full bg-black border border-white/20 rounded px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-cyan-500"
              >
                <option value="CAM-DESKTOP">CAM-DESKTOP — My Desktop Camera (Live Optical Node)</option>
                {cameras.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id} — {c.name} ({c.zone})
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Visual Frame with Real Bounding Boxes & Telemetry */}
        <div className="lg:col-span-7 flex flex-col space-y-4">
          
          <div className="bg-[#0d1016] p-4 rounded-xl border border-white/10 flex flex-col space-y-3 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white font-mono uppercase flex items-center space-x-1.5">
                <ImgIcon className="w-3.5 h-3.5 text-cyan-400" />
                <span>Visual Frame Inspection & Bounding Boxes</span>
              </span>
              {lastResult && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                  LATENCY: {lastResult.latency_ms.total}ms
                </span>
              )}
            </div>

            {/* Visual Canvas Area */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black border border-white/10">
              {activeImageSrc ? (
                <img
                  src={activeImageSrc}
                  alt="Frame inspection"
                  className="w-full h-full object-contain bg-black"
                />
              ) : inputMode === 'webcam' && webcamActive ? (
                <div className="w-full h-full flex flex-col items-center justify-center text-cyan-400 font-mono text-xs space-y-2">
                  <CamIcon className="w-8 h-8 animate-pulse text-cyan-400" />
                  <span>Desktop camera streaming live. Click "Snap & Detect Now" or "Auto-Detect".</span>
                </div>
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center text-gray-500 font-mono text-xs">
                  <Upload className="w-8 h-8 mb-2 text-cyan-400 opacity-50" />
                  <span>Select camera stream or upload a real photo</span>
                </div>
              )}

              {/* Real Bounding Box Visuals from Vision Inference */}
              {lastResult && activeImageSrc && (
                <div className="absolute inset-0 pointer-events-none">
                  
                  {/* ANPR Detected Boxes */}
                  {lastResult.anpr_detections.map((anpr, idx) => (
                    <div
                      key={`anpr-${idx}`}
                      className={`absolute border-2 ${
                        anpr.is_blacklisted ? 'border-red-500 bg-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.5)]' : 'border-cyan-400 bg-cyan-400/20 shadow-[0_0_15px_rgba(6,182,212,0.5)]'
                      } rounded`}
                      style={{
                        top: `${anpr.bbox[1] * 100}%`,
                        left: `${anpr.bbox[0] * 100}%`,
                        width: `${Math.max(anpr.bbox[2] * 100, 10)}%`,
                        height: `${Math.max(anpr.bbox[3] * 100, 6)}%`
                      }}
                    >
                      <div className={`absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-black ${
                        anpr.is_blacklisted ? 'bg-red-400' : 'bg-cyan-400'
                      } whitespace-nowrap shadow`}>
                        {anpr.is_blacklisted ? '🚨 BOLO: ' : '🚗 PLATE: '} {anpr.plate_text} ({(anpr.confidence * 100).toFixed(0)}%)
                      </div>
                    </div>
                  ))}

                  {/* Pothole Detected Boxes */}
                  {lastResult.pothole_detections.map((pot, idx) => (
                    <div
                      key={`pot-${idx}`}
                      className="absolute border-2 border-orange-400 bg-orange-500/20 rounded shadow-[0_0_15px_rgba(249,115,22,0.5)]"
                      style={{
                        top: `${pot.bbox[1] * 100}%`,
                        left: `${pot.bbox[0] * 100}%`,
                        width: `${Math.max(pot.bbox[2] * 100, 12)}%`,
                        height: `${Math.max(pot.bbox[3] * 100, 10)}%`
                      }}
                    >
                      <div className="absolute -top-5 left-0 px-1.5 py-0.5 rounded text-[9px] font-mono font-bold text-black bg-orange-400 whitespace-nowrap shadow">
                        ⚠️ POTHOLE {pot.severity.toUpperCase()} ({pot.area_score} cm²)
                      </div>
                    </div>
                  ))}

                  {/* Accident Detected Boxes */}
                  {lastResult.accident_detections.map((acc, idx) => (
                    <div
                      key={`acc-${idx}`}
                      className="absolute border-2 border-dashed border-red-500 bg-red-600/30 rounded animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                      style={{
                        top: `${acc.bbox[1] * 100}%`,
                        left: `${acc.bbox[0] * 100}%`,
                        width: `${Math.max(acc.bbox[2] * 100, 20)}%`,
                        height: `${Math.max(acc.bbox[3] * 100, 15)}%`
                      }}
                    >
                      <div className="absolute -top-6 left-0 px-2 py-0.5 rounded text-[10px] font-bold text-black bg-red-400 whitespace-nowrap shadow">
                        💥 COLLISION ({acc.collision_type})
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Scene Summary and Detection Results */}
            {lastResult && (
              <div className="p-3 bg-black/60 rounded border border-white/10 space-y-2 text-xs font-mono">
                <div className="flex items-center justify-between text-gray-300">
                  <span className="text-cyan-400 font-bold">REAL INFERENCE SUMMARY:</span>
                  <span>
                    Plates: <strong className="text-white">{lastResult.anpr_detections.length}</strong> | 
                    Potholes: <strong className="text-white">{lastResult.pothole_detections.length}</strong> | 
                    Accidents: <strong className="text-white">{lastResult.accident_detections.length}</strong>
                  </span>
                </div>
                {lastResult.scene_summary && (
                  <p className="text-gray-400 text-[11px] leading-relaxed">
                    {lastResult.scene_summary}
                  </p>
                )}
                {lastResult.anpr_detections.length === 0 && lastResult.pothole_detections.length === 0 && lastResult.accident_detections.length === 0 && (
                  <div className="flex items-center space-x-2 text-green-400 text-xs">
                    <ShieldCheck className="w-4 h-4" />
                    <span>Clean frame — No defects, license plates, or hazards detected.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dataset Verification Catalog */}
      <div className="bg-[#0d1016] rounded-xl p-4 border border-white/10 space-y-3 shadow-xl">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
            Verified Computer Vision Benchmarks
          </h3>
          <span className="text-[10px] text-cyan-400 font-mono">Open Access Datasets</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
          {DATASET_CATALOG.map((cat, idx) => (
            <div key={idx} className="p-3 rounded bg-black border border-white/10 space-y-2">
              <div className="font-bold text-white uppercase">{cat.task}</div>
              <p className="text-gray-400 text-[11px]">{cat.dataset_name}</p>
              <div className="text-[10px] text-gray-500 font-mono">
                <div>Images: {cat.sample_count}</div>
                <div>Format: {cat.format}</div>
                <div>Benchmark mAP: {cat.map_score}</div>
              </div>
              <a
                href={cat.verified_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-[11px] font-mono font-semibold mt-1"
              >
                <span>View Dataset on Universe</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
