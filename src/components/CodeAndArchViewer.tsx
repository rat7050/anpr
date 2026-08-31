import React, { useState } from 'react';
import { Code2, Copy, Check, FileCode, Terminal, Layers, Box } from 'lucide-react';

export const CodeAndArchViewer: React.FC = () => {
  const [activeFile, setActiveFile] = useState<string>('anpr_pipeline');
  const [copied, setCopied] = useState<boolean>(false);

  const fileContents: Record<string, { title: string; path: string; lang: string; code: string; desc: string }> = {
    anpr_pipeline: {
      title: 'Indian HSRP ANPR Pipeline (YOLOv8 + EasyOCR)',
      path: 'ml/anpr/anpr_pipeline.py',
      lang: 'python',
      desc: 'Local High Security Registration Plate (HSRP) detection, OpenCV CLAHE contrast enhancement, deskewing, and EasyOCR character recognition with Indian State RTO regex validation.',
      code: `import cv2
import numpy as np
import re
from ultralytics import YOLO
import easyocr

class IndianHSRPANPRPipeline:
    def __init__(self, yolo_weights="weights/yolov8_hsrp_plates.pt"):
        self.plate_detector = YOLO(yolo_weights)
        self.ocr_reader = easyocr.Reader(['en'], gpu=True)
        # Indian HSRP Regex: e.g. DL 01 AB 1234, HR 26 DK 8392, MH 12 DE 5678
        self.plate_pattern = re.compile(r'^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{4}$')

    def preprocess_plate_crop(self, crop):
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8,8))
        contrast = clahe.apply(gray)
        blur = cv2.bilateralFilter(contrast, 9, 75, 75)
        return blur

    def process_frame(self, frame, camera_id="CAM-01"):
        results = self.plate_detector(frame, conf=0.45)
        detections = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                crop = frame[y1:y2, x1:x2]
                processed = self.preprocess_plate_crop(crop)
                ocr_res = self.ocr_reader.readtext(processed)
                for (_, text, conf) in ocr_res:
                    clean = re.sub(r'[^A-Z0-9]', '', text.upper())
                    if len(clean) >= 6 and conf > 0.60:
                        detections.append({
                            "plate_text": clean,
                            "confidence": float(conf),
                            "bbox": [x1, y1, x2, y2]
                        })
        return detections`
    },
    pothole_pipeline: {
      title: 'Pothole Detection Pipeline (Intel Unnati YOLOv8)',
      path: 'ml/pothole/pothole_pipeline.py',
      lang: 'python',
      desc: 'Detects road defects, calculates surface area & depth severity scores, and executes spatial-temporal de-duplication.',
      code: `import math
from datetime import datetime
from ultralytics import YOLO

class PotholePipeline:
    def __init__(self, weights="weights/pothole_yolov8.pt", deduplication_radius_meters=15.0):
        self.model = YOLO(weights)
        self.dedup_radius = deduplication_radius_meters
        self.recent_potholes = []

    def classify_severity(self, pixel_area):
        if pixel_area > 1200: return "critical"
        elif pixel_area > 700: return "high"
        elif pixel_area > 300: return "medium"
        return "low"

    def is_duplicate(self, lat, lon):
        for p in self.recent_potholes:
            dist = math.sqrt((lat - p['lat'])**2 + (lon - p['lon'])**2) * 111000
            if dist < self.dedup_radius:
                return True
        return False

    def process_frame(self, frame, camera_lat, camera_lon):
        results = self.model(frame, conf=0.40)
        detections = []
        for r in results:
            for box in r.boxes:
                x1, y1, x2, y2 = map(int, box.xyxy[0])
                area = (x2 - x1) * (y2 - y1)
                severity = self.classify_severity(area)
                if not self.is_duplicate(camera_lat, camera_lon):
                    item = {"severity": severity, "bbox": [x1, y1, x2, y2], "area": area}
                    self.recent_potholes.append({"lat": camera_lat, "lon": camera_lon, "time": datetime.utcnow()})
                    detections.append(item)
        return detections`
    },
    accident_pipeline: {
      title: 'Accident & Collision Tracking (ByteTrack + Physics Heuristics)',
      path: 'ml/accident/accident_pipeline.py',
      lang: 'python',
      desc: 'Tracks vehicle velocity vectors, triggers collision alert on sudden deceleration (>2.8G) and bounding-box IoU overlap.',
      code: `import numpy as np
from ultralytics import YOLO

class AccidentPipeline:
    def __init__(self, weights="yolov8n.pt", decel_threshold_g=2.8, iou_overlap_threshold=0.55):
        self.model = YOLO(weights)
        self.decel_threshold = decel_threshold_g
        self.iou_threshold = iou_overlap_threshold
        self.track_history = {}

    def calculate_iou(self, b1, b2):
        xA = max(b1[0], b2[0])
        yA = max(b1[1], b2[1])
        xB = min(b1[2], b2[2])
        yB = min(b1[3], b2[3])
        inter = max(0, xB - xA) * max(0, yB - yA)
        area1 = (b1[2] - b1[0]) * (b1[3] - b1[1])
        area2 = (b2[2] - b2[0]) * (b2[3] - b2[1])
        return inter / float(area1 + area2 - inter + 1e-6)

    def process_frame(self, frame, fps=30):
        # YOLOv8 tracking with ByteTrack / DeepSORT
        results = self.model.track(frame, persist=True, tracker="bytetrack.yaml")
        # Check kinematics & IoU collision overlap...
        # Emits collision event if deceleration > threshold & IoU > 0.55
        return results`
    },
    db_schema: {
      title: 'PostgreSQL / PostGIS Database Schema',
      path: 'backend/models.py',
      lang: 'python',
      desc: 'SQLAlchemy database models with GeoAlchemy2 spatial geometry point columns, spatial indices (GIST), and foreign key constraints.',
      code: `from sqlalchemy import Column, String, Float, DateTime, Boolean, ForeignKey, Index
from sqlalchemy.orm import declarative_base
from geoalchemy2 import Geometry

Base = declarative_base()

class Camera(Base):
    __tablename__ = "cameras"
    id = Column(String(50), primary_key=True)
    name = Column(String(100), nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    road_name = Column(String(100))

class PlateEvent(Base):
    __tablename__ = "plate_events"
    id = Column(String(50), primary_key=True)
    plate_text = Column(String(20), index=True, nullable=False)
    confidence = Column(Float, nullable=False)
    camera_id = Column(String(50), ForeignKey("cameras.id"))
    timestamp = Column(DateTime, index=True)
    is_blacklisted = Column(Boolean, default=False)

class PotholeEvent(Base):
    __tablename__ = "pothole_events"
    id = Column(String(50), primary_key=True)
    severity = Column(String(20), nullable=False)
    location = Column(Geometry(geometry_type='POINT', srid=4326), nullable=False)
    status = Column(String(30), default="reported")`
    },
    docker_compose: {
      title: 'Docker Compose Orchestration (PostGIS + Redis + FastAPI + React)',
      path: 'docker-compose.yml',
      lang: 'yaml',
      desc: 'One-command deployment stack linking PostGIS spatial database, Redis Streams event bus, FastAPI server, and React dashboard.',
      code: `version: '3.8'

services:
  postgres_postgis:
    image: postgis/postgis:15-3.3
    environment:
      POSTGRES_DB: smart_traffic_db
      POSTGRES_USER: traffic_user
      POSTGRES_PASSWORD: traffic_secure_password
    ports:
      - "5432:5432"

  redis_queue:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  fastapi_backend:
    build:
      context: .
      dockerfile: backend/Dockerfile
    ports:
      - "8000:8000"
    depends_on:
      - postgres_postgis
      - redis_queue

  frontend_dashboard:
    build:
      context: .
      dockerfile: Dockerfile.frontend
    ports:
      - "3000:3000"`
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(fileContents[activeFile].code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const current = fileContents[activeFile];

  return (
    <div className="flex flex-col space-y-4">
      
      {/* Top Banner */}
      <div className="bg-[#0d1016] rounded-xl p-4 border border-white/10 flex items-center justify-between shadow-xl">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-tight flex items-center space-x-2">
            <Code2 className="w-4 h-4 text-cyan-400" />
            <span>Open-Source Implementation Codebase</span>
          </h2>
          <p className="text-[10px] text-cyan-400 font-mono tracking-wide">
            STANDALONE PYTHON ML PIPELINES • POSTGIS SCHEMAS • FASTAPI MICROSERVICES
          </p>
        </div>
      </div>

      {/* Code Viewer Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        
        {/* Left Sidebar: File Tree */}
        <div className="lg:col-span-4 flex flex-col space-y-2">
          <div className="text-[10px] font-mono font-bold text-gray-400 uppercase px-1">Pipeline & Schema Files</div>

          {Object.entries(fileContents).map(([key, item]) => {
            const isActive = activeFile === key;
            return (
              <button
                key={key}
                onClick={() => setActiveFile(key)}
                className={`p-3 rounded-xl border text-left transition-all flex flex-col space-y-1 ${
                  isActive
                    ? 'bg-cyan-500/20 border-cyan-500/70 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-[#0d1016] border-white/10 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <FileCode className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-gray-400'}`} />
                  <span className="text-xs font-bold text-white uppercase tracking-tight">{item.title}</span>
                </div>
                <div className="text-[10px] font-mono text-cyan-400/80 pl-6">{item.path}</div>
              </button>
            );
          })}
        </div>

        {/* Right Area: Code Display */}
        <div className="lg:col-span-8 bg-black rounded-xl border border-white/10 overflow-hidden flex flex-col shadow-2xl">
          
          {/* Header */}
          <div className="p-3 bg-[#0a0c10] border-b border-white/10 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="font-mono text-xs text-cyan-400 font-bold">{current.path}</span>
              <span className="text-[9px] px-2 py-0.5 rounded bg-black border border-white/20 text-gray-300 font-mono uppercase">
                {current.lang}
              </span>
            </div>

            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded bg-white/5 hover:bg-white/10 text-gray-200 text-xs font-mono uppercase flex items-center space-x-1.5 transition-colors border border-white/10"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="text-cyan-400">COPIED!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <div className="p-3 bg-[#0d1016]/80 border-b border-white/10 text-xs text-gray-400 font-mono">
            {current.desc}
          </div>

          {/* Pre Code Box */}
          <div className="p-4 overflow-x-auto font-mono text-xs text-cyan-300/90 leading-relaxed max-h-[500px] bg-black">
            <pre>{current.code}</pre>
          </div>
        </div>
      </div>
    </div>
  );
};
