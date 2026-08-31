import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Camera, PotholeEvent, AccidentEvent, PlateTrajectory, AlertItem } from '../types/traffic';
import { Layers, Eye, Camera as CamIcon, AlertTriangle, ShieldAlert, Route, Flame, CheckCircle } from 'lucide-react';

interface GisMapProps {
  cameras: Camera[];
  potholes: PotholeEvent[];
  accidents: AccidentEvent[];
  activeTrajectory: PlateTrajectory | null;
  selectedCamera: Camera | null;
  onSelectCamera: (cam: Camera) => void;
  onResolvePothole?: (id: string) => void;
  onClearTrajectory?: () => void;
}

export const GisMap: React.FC<GisMapProps> = ({
  cameras,
  potholes,
  accidents,
  activeTrajectory,
  selectedCamera,
  onSelectCamera,
  onResolvePothole,
  onClearTrajectory
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupsRef = useRef<{
    cameras: L.LayerGroup;
    potholes: L.LayerGroup;
    accidents: L.LayerGroup;
    trajectory: L.LayerGroup;
    heatmap: L.LayerGroup;
  } | null>(null);

  // Layer Visibility Filters
  const [layers, setLayers] = useState({
    cameras: true,
    potholes: true,
    accidents: true,
    trajectory: true,
    heatmap: true
  });

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Center on Delhi-NCR metropolitan coordinates
    const map = L.map(mapContainerRef.current, {
      center: [28.5800, 77.2300],
      zoom: 12,
      zoomControl: false
    });

    // Add high-contrast OpenStreetMap / Carto Dark Matter tiles (No API key needed)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19
    }).addTo(map);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Create Layer Groups
    const cameraLayer = L.layerGroup().addTo(map);
    const potholeLayer = L.layerGroup().addTo(map);
    const accidentLayer = L.layerGroup().addTo(map);
    const trajectoryLayer = L.layerGroup().addTo(map);
    const heatmapLayer = L.layerGroup().addTo(map);

    layerGroupsRef.current = {
      cameras: cameraLayer,
      potholes: potholeLayer,
      accidents: accidentLayer,
      trajectory: trajectoryLayer,
      heatmap: heatmapLayer
    };

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Layers Content
  useEffect(() => {
    if (!layerGroupsRef.current || !mapInstanceRef.current) return;
    const { cameras: camGrp, potholes: potGrp, accidents: accGrp, trajectory: trajGrp, heatmap: heatGrp } = layerGroupsRef.current;

    // 1. Render Cameras
    camGrp.clearLayers();
    if (layers.cameras) {
      cameras.forEach((cam) => {
        const isSelected = selectedCamera?.id === cam.id;
        const iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-8 h-8 rounded-full ${isSelected ? 'bg-cyan-500 ring-4 ring-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.8)]' : 'bg-[#0d1016] border-2 border-cyan-400 shadow-[0_0_10px_rgba(6,182,212,0.3)]'} flex items-center justify-center text-white cursor-pointer transform hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-cyan-400 ${isSelected ? 'text-black font-bold' : ''}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
              </svg>
            </div>
            <span class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-[#0a0c10]/95 text-cyan-300 text-[9px] font-mono border border-cyan-500/40 shadow">
              ${cam.id}
            </span>
          </div>
        `;

        const customIcon = L.divIcon({
          html: iconHtml,
          className: 'custom-camera-marker',
          iconSize: [32, 32],
          iconAnchor: [16, 16]
        });

        const marker = L.marker([cam.lat, cam.lon], { icon: customIcon });
        marker.on('click', () => {
          onSelectCamera(cam);
        });

        marker.bindPopup(`
          <div class="p-2 min-w-[200px] text-slate-900 font-sans">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200 mb-1.5">
              <span class="font-bold text-xs text-emerald-700">${cam.id}</span>
              <span class="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-semibold uppercase">Active ${cam.fps}fps</span>
            </div>
            <h4 class="font-semibold text-xs text-slate-800 mb-1">${cam.name}</h4>
            <p class="text-[11px] text-slate-600 mb-2">${cam.road_name} (${cam.zone})</p>
            <div class="text-[10px] text-slate-500 bg-slate-100 p-1.5 rounded space-y-0.5">
              <div>Resolution: <span class="font-mono text-slate-700">${cam.resolution}</span></div>
              <div>Pipelines: <span class="font-semibold text-emerald-700">ANPR + Pothole + DeepSORT</span></div>
            </div>
          </div>
        `);

        camGrp.addLayer(marker);
      });
    }

    // 2. Render Potholes & Heatmap
    potGrp.clearLayers();
    heatGrp.clearLayers();

    potholes.forEach((pot) => {
      const isFixed = pot.status === 'fixed';
      const color = isFixed ? '#10b981' : pot.severity === 'critical' ? '#ef4444' : pot.severity === 'high' ? '#f97316' : pot.severity === 'medium' ? '#eab308' : '#3b82f6';
      
      // Heatmap circle
      if (layers.heatmap && !isFixed) {
        const heatRadius = pot.severity === 'critical' ? 240 : pot.severity === 'high' ? 180 : 120;
        const heatCircle = L.circle([pot.lat, pot.lon], {
          radius: heatRadius,
          color: color,
          fillColor: color,
          fillOpacity: 0.18,
          weight: 0
        });
        heatGrp.addLayer(heatCircle);
      }

      if (layers.potholes) {
        const iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full flex items-center justify-center text-white shadow-md border-2 border-white" style="background-color: ${color}">
              <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        `;

        const marker = L.marker([pot.lat, pot.lon], {
          icon: L.divIcon({
            html: iconHtml,
            className: 'pothole-marker',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });

        marker.bindPopup(`
          <div class="p-2 min-w-[210px] text-slate-900 font-sans">
            <div class="flex items-center justify-between pb-1 border-b border-slate-200 mb-1.5">
              <span class="font-bold text-xs">${pot.id}</span>
              <span class="text-[10px] font-bold px-1.5 py-0.5 rounded uppercase" style="background-color: ${color}20; color: ${color}">
                ${pot.severity} severity
              </span>
            </div>
            <div class="text-xs space-y-1 mb-2">
              <div>Surface Area: <span class="font-semibold">${pot.area_sq_cm || 850} cm²</span></div>
              <div>Estimated Depth: <span class="font-semibold">${pot.depth_estimate_cm || 6.5} cm</span></div>
              <div>Status: <span class="font-semibold ${isFixed ? 'text-emerald-600' : 'text-amber-600'}">${pot.status.toUpperCase()}</span></div>
              <div>Camera Ref: <span class="font-mono text-slate-600">${pot.camera_id}</span></div>
            </div>
            ${!isFixed ? `
              <button onclick="window.__resolvePothole && window.__resolvePothole('${pot.id}')" class="w-full py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[11px] font-semibold transition-colors">
                Mark as Repaired
              </button>
            ` : `<div class="text-[11px] text-emerald-700 font-semibold text-center">✓ Repaired & Certified</div>`}
          </div>
        `);

        potGrp.addLayer(marker);
      }
    });

    // 3. Render Accidents
    accGrp.clearLayers();
    if (layers.accidents) {
      accidents.forEach((acc) => {
        const isCritical = acc.severity === 'critical' || acc.severity === 'severe';
        const iconHtml = `
          <div class="relative flex items-center justify-center">
            <div class="absolute w-10 h-10 rounded-full bg-rose-500/40 animate-ping"></div>
            <div class="w-8 h-8 rounded-full bg-rose-600 border-2 border-white flex items-center justify-center text-white shadow-xl cursor-pointer">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <span class="absolute -bottom-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-rose-950 text-rose-200 text-[10px] font-mono border border-rose-700">
              ${acc.id}
            </span>
          </div>
        `;

        const marker = L.marker([acc.lat, acc.lon], {
          icon: L.divIcon({
            html: iconHtml,
            className: 'accident-marker',
            iconSize: [32, 32],
            iconAnchor: [16, 16]
          })
        });

        marker.bindPopup(`
          <div class="p-2 min-w-[220px] text-slate-900 font-sans">
            <div class="flex items-center justify-between pb-1 border-b border-rose-200 mb-1.5">
              <span class="font-bold text-xs text-rose-700">${acc.id}</span>
              <span class="text-[10px] bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded font-bold uppercase">${acc.severity} collision</span>
            </div>
            <div class="text-xs space-y-1 mb-2">
              <div>Collision Type: <span class="font-semibold capitalize">${acc.collision_type.replace('_', ' ')}</span></div>
              <div>Vehicles Involved: <span class="font-semibold">${acc.vehicles_involved}</span></div>
              <div>Deceleration Impact: <span class="font-mono font-bold text-rose-700">${acc.deceleration_g}G</span></div>
              <div>Status: <span class="font-semibold text-amber-700 capitalize">${acc.status}</span></div>
            </div>
            <div class="p-1.5 bg-rose-50 border border-rose-200 rounded text-[10px] text-rose-800">
              YOLOv8 + DeepSORT detected severe deceleration and bounding-box IoU collision overlap.
            </div>
          </div>
        `);

        accGrp.addLayer(marker);
      });
    }

    // 4. Render Active Plate Trajectory
    trajGrp.clearLayers();
    if (layers.trajectory && activeTrajectory && activeTrajectory.trajectory.length > 0) {
      const pts = activeTrajectory.trajectory;
      const latlngs: L.LatLngExpression[] = pts.map(p => [p.lat, p.lon]);

      // Draw route line
      const polyline = L.polyline(latlngs, {
        color: activeTrajectory.is_blacklisted ? '#ef4444' : '#10b981',
        weight: 4,
        dashArray: '8, 8',
        opacity: 0.85
      });
      trajGrp.addLayer(polyline);

      // Draw numbered waypoint nodes
      pts.forEach((wp, idx) => {
        const isFirst = idx === 0;
        const isLast = idx === pts.length - 1;
        const nodeHtml = `
          <div class="relative flex items-center justify-center">
            <div class="w-6 h-6 rounded-full ${isLast ? 'bg-rose-600 ring-4 ring-rose-400' : isFirst ? 'bg-blue-600' : 'bg-slate-800 border-2 border-emerald-400'} flex items-center justify-center text-white text-[10px] font-bold shadow-md">
              ${idx + 1}
            </div>
          </div>
        `;

        const nodeMarker = L.marker([wp.lat, wp.lon], {
          icon: L.divIcon({
            html: nodeHtml,
            className: 'trajectory-node',
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          })
        });

        nodeMarker.bindPopup(`
          <div class="p-2 min-w-[200px] text-slate-900 font-sans">
            <div class="font-bold text-xs text-slate-800">Waypoint #${idx + 1}: ${wp.camera_name}</div>
            <div class="text-[11px] text-slate-600">${wp.road_name}</div>
            <div class="text-[10px] text-slate-500 mt-1">Time: ${new Date(wp.timestamp).toLocaleTimeString()}</div>
            <div class="text-[10px] text-slate-500">Speed: ${wp.speed_kmh} km/h | OCR Conf: ${(wp.confidence * 100).toFixed(1)}%</div>
          </div>
        `);

        trajGrp.addLayer(nodeMarker);
      });

      // Fit map bounds to trajectory if requested
      if (latlngs.length > 1) {
        mapInstanceRef.current.fitBounds(polyline.getBounds(), { padding: [40, 40] });
      }
    }

  }, [cameras, potholes, accidents, activeTrajectory, selectedCamera, layers]);

  // Hook up window helper for popup buttons
  useEffect(() => {
    (window as any).__resolvePothole = (id: string) => {
      if (onResolvePothole) onResolvePothole(id);
    };
  }, [onResolvePothole]);

  return (
    <div className="relative w-full h-full min-h-[620px] bg-[#0d1016] rounded-xl overflow-hidden border border-white/10 group">
      
      {/* Background Radial Grid Pattern */}
      <div className="absolute inset-0 opacity-20 pointer-events-none tactical-grid-bg z-0" />
      <div className="absolute inset-0 pointer-events-none z-0" style={{ background: 'radial-gradient(circle at center, transparent 0%, #0d1016 95%)' }} />

      {/* GIS Leaflet Canvas */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[620px] z-10" />

      {/* Tactical HUD Header on Top Left */}
      <div className="absolute top-3 left-3 z-20 flex flex-col gap-2 pointer-events-auto">
        <div className="bg-black/80 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-2xl">
          <div className="text-[10px] text-gray-400 mb-0.5 font-bold uppercase tracking-wider">ACTIVE VIEWPORT</div>
          <div className="text-xs text-cyan-400 font-mono font-bold tracking-tight">STREET_GRID_SECTOR_07</div>
        </div>

        {/* Layer Filter Toolbar */}
        <div className="bg-[#0a0c10]/95 backdrop-blur-md p-3 rounded-lg border border-white/10 shadow-2xl flex flex-col space-y-2 text-xs">
          <div className="flex items-center space-x-1.5 text-cyan-400 font-bold px-0.5 pb-1.5 border-b border-white/10 uppercase tracking-wider text-[10px]">
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>GIS Map Layers</span>
          </div>

          <div className="flex flex-col space-y-1.5">
            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={layers.cameras}
                onChange={(e) => setLayers({ ...layers, cameras: e.target.checked })}
                className="rounded bg-black border-white/20 text-cyan-500 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
                <span>CCTV Cameras ({cameras.length})</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={layers.potholes}
                onChange={(e) => setLayers({ ...layers, potholes: e.target.checked })}
                className="rounded bg-black border-white/20 text-orange-500 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-orange-400"></span>
                <span>Pothole Hazards ({potholes.filter(p => p.status !== 'fixed').length})</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={layers.heatmap}
                onChange={(e) => setLayers({ ...layers, heatmap: e.target.checked })}
                className="rounded bg-black border-white/20 text-orange-500 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <Flame className="w-3 h-3 text-orange-400" />
                <span>Pothole Heatmap</span>
              </span>
            </label>

            <label className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white">
              <input
                type="checkbox"
                checked={layers.accidents}
                onChange={(e) => setLayers({ ...layers, accidents: e.target.checked })}
                className="rounded bg-black border-white/20 text-red-500 focus:ring-0"
              />
              <span className="flex items-center space-x-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Accidents ({accidents.length})</span>
              </span>
            </label>

            {activeTrajectory && (
              <label className="flex items-center space-x-2 text-gray-300 cursor-pointer hover:text-white">
                <input
                  type="checkbox"
                  checked={layers.trajectory}
                  onChange={(e) => setLayers({ ...layers, trajectory: e.target.checked })}
                  className="rounded bg-black border-white/20 text-cyan-400 focus:ring-0"
                />
                <span className="flex items-center space-x-1.5">
                  <Route className="w-3 h-3 text-cyan-400" />
                  <span>Plate Trajectory</span>
                </span>
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Tactical GPS & Tiles HUD Badges Bottom Left */}
      <div className="absolute bottom-3 left-3 z-20 flex flex-wrap gap-2 pointer-events-none">
        <div className="px-3 py-1 bg-black/80 backdrop-blur-sm rounded border border-cyan-500/50 text-[10px] text-cyan-400 font-mono">
          GPS: 28.5800° N, 77.2300° E (Delhi-NCR)
        </div>
        <div className="px-3 py-1 bg-black/80 backdrop-blur-sm rounded border border-white/10 text-[10px] text-gray-400 font-mono">
          OPENSTREETMAP GIS TILES (INDIA)
        </div>
      </div>

      {/* Active Trajectory Floating HUD if present */}
      {activeTrajectory && (
        <div className="absolute top-3 right-3 z-20 bg-[#0d1016]/95 backdrop-blur-md p-3.5 rounded-lg border border-cyan-500/40 shadow-2xl max-w-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-white/10 mb-2">
            <div className="flex items-center space-x-2">
              <Route className="w-4 h-4 text-cyan-400" />
              <span className="text-xs font-mono font-bold text-white uppercase">Route: {activeTrajectory.plate_text}</span>
            </div>
            {onClearTrajectory && (
              <button
                onClick={onClearTrajectory}
                className="text-[10px] text-gray-400 hover:text-white px-2 py-0.5 rounded bg-white/5 border border-white/10 transition-colors"
              >
                Clear
              </button>
            )}
          </div>
          <div className="text-xs text-gray-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-gray-400">Sightings:</span>
              <span className="font-semibold text-cyan-300 font-mono">{activeTrajectory.total_sightings} cameras</span>
            </div>
            {activeTrajectory.is_blacklisted && (
              <div className="p-2 rounded bg-red-950/40 border border-red-500/50 text-[10px] text-red-300 font-semibold uppercase">
                ⚠️ BLACKLIST TARGET: {activeTrajectory.blacklist_reason}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Map Legend on Bottom Right */}
      <div className="absolute bottom-3 right-3 z-20 bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-[10px] text-gray-300 flex items-center space-x-3 hidden sm:flex font-mono">
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
          <span>Camera</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
          <span>Accident</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-orange-400"></span>
          <span>Pothole</span>
        </div>
        <div className="flex items-center space-x-1">
          <span className="w-2 h-2 rounded-full bg-green-500"></span>
          <span>Repaired</span>
        </div>
      </div>
    </div>
  );
};
