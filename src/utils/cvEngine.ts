import { IngestionResult, PlateEvent, PotholeEvent, AccidentEvent, BlacklistItem, Camera } from '../types/traffic';

/**
 * Calculates Levenshtein Distance for fuzzy license plate lookup.
 */
export function levenshteinDistance(a: string, b: string): number {
  const s1 = a.toUpperCase().replace(/[\s-_]/g, '');
  const s2 = b.toUpperCase().replace(/[\s-_]/g, '');
  const matrix: number[][] = [];

  for (let i = 0; i <= s1.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= s2.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= s1.length; i++) {
    for (let j = 1; j <= s2.length; j++) {
      if (s1[i - 1] === s2[j - 1]) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1,     // insertion
          matrix[i - 1][j] + 1      // deletion
        );
      }
    }
  }

  return matrix[s1.length][s2.length];
}

/**
 * Calculates plate similarity ratio (0.0 to 1.0).
 */
export function plateSimilarityScore(query: string, target: string): number {
  const q = query.toUpperCase().replace(/[\s-_]/g, '');
  const t = target.toUpperCase().replace(/[\s-_]/g, '');
  if (!q || !t) return 0;
  if (q === t) return 1.0;
  const dist = levenshteinDistance(q, t);
  const maxLen = Math.max(q.length, t.length);
  return Math.max(0, 1 - dist / maxLen);
}

/**
 * Calculates IoU (Intersection over Union) of two bounding boxes [x, y, w, h].
 */
export function calculateIoU(
  boxA: [number, number, number, number],
  boxB: [number, number, number, number]
): number {
  const xA = Math.max(boxA[0], boxB[0]);
  const yA = Math.max(boxA[1], boxB[1]);
  const xB = Math.min(boxA[0] + boxA[2], boxB[0] + boxB[2]);
  const yB = Math.min(boxA[1] + boxA[3], boxB[1] + boxB[3]);

  const interArea = Math.max(0, xB - xA) * Math.max(0, yB - yA);
  const boxAArea = boxA[2] * boxA[3];
  const boxBArea = boxB[2] * boxB[3];

  const unionArea = boxAArea + boxBArea - interArea;
  if (unionArea <= 0) return 0;
  return interArea / unionArea;
}

/**
 * Pre-defined Benchmark Sample Frames from Indian Open Source Datasets
 */
export interface BenchmarkFrame {
  id: string;
  name: string;
  category: 'anpr' | 'pothole' | 'accident' | 'combined';
  datasetSource: string;
  description: string;
  imageUrl: string;
  simulatedResults: IngestionResult;
}

export const SAMPLE_BENCHMARKS: BenchmarkFrame[] = [
  {
    id: 'BENCH-01',
    name: 'Indian Expressway ANPR + Blacklisted Target (HSRP)',
    category: 'anpr',
    datasetSource: 'Roboflow Indian License Plate Recognition (10,125 img benchmark)',
    description: 'Surveillance feed on DND Flyway capturing vehicle with HSRP plate DL 01 AB 1234 (Delhi Police Stolen Vehicle FIR #4891) with 96.5% OCR confidence.',
    imageUrl: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    simulatedResults: {
      frame_id: 'FRM-8812',
      camera_id: 'CAM-01',
      timestamp: new Date().toISOString(),
      latency_ms: { anpr: 14.2, pothole: 8.5, accident: 11.1, total: 33.8 },
      anpr_detections: [
        {
          plate_text: 'DL 01 AB 1234',
          confidence: 0.965,
          bbox: [0.42, 0.62, 0.16, 0.08],
          is_blacklisted: true,
          reason: 'Reported Stolen Vehicle (Delhi Police FIR #4891/2026)'
        },
        {
          plate_text: 'HR 26 DK 8392',
          confidence: 0.941,
          bbox: [0.15, 0.58, 0.14, 0.07],
          is_blacklisted: true,
          reason: 'Suspended Registration / Hit & Run Suspect (Gurugram Police)'
        }
      ],
      pothole_detections: [],
      accident_detections: []
    }
  },
  {
    id: 'BENCH-02',
    name: 'Monsoon Asphalt Severe Pothole Cluster (IIIT-H IDD)',
    category: 'pothole',
    datasetSource: 'Intel Unnati & IIIT Hyderabad Indian Driving Dataset (2,475 img dataset)',
    description: 'Indian Driving Dataset monsoon wet asphalt condition with multiple road surface defects and high-risk crater formation on NH-48 corridor.',
    imageUrl: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    simulatedResults: {
      frame_id: 'FRM-8813',
      camera_id: 'CAM-04',
      timestamp: new Date().toISOString(),
      latency_ms: { anpr: 9.1, pothole: 16.4, accident: 7.8, total: 33.3 },
      anpr_detections: [],
      pothole_detections: [
        {
          id: 'POT-LIVE-01',
          severity: 'critical',
          confidence: 0.932,
          bbox: [0.38, 0.68, 0.28, 0.22],
          area_score: 1540
        },
        {
          id: 'POT-LIVE-02',
          severity: 'medium',
          confidence: 0.865,
          bbox: [0.72, 0.59, 0.14, 0.11],
          area_score: 420
        }
      ],
      accident_detections: []
    }
  },
  {
    id: 'BENCH-03',
    name: 'Delhi Arterial Collision & Sudden Deceleration Event',
    category: 'accident',
    datasetSource: 'Highway Accident Detection Model (3,200+ Indian CCTV/dashcam images)',
    description: 'Intersection collision with rapid 4.8G deceleration, bounding box overlap (IoU 0.68), and automatic alert broadcast to Emergency Response Support System 112.',
    imageUrl: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    simulatedResults: {
      frame_id: 'FRM-8814',
      camera_id: 'CAM-03',
      timestamp: new Date().toISOString(),
      latency_ms: { anpr: 12.3, pothole: 10.2, accident: 18.7, total: 41.2 },
      anpr_detections: [
        {
          plate_text: 'UP 16 BT 4410',
          confidence: 0.912,
          bbox: [0.31, 0.52, 0.12, 0.06],
          is_blacklisted: true,
          reason: 'Chronic Speed Violator & 18+ Unpaid e-Challans'
        }
      ],
      pothole_detections: [],
      accident_detections: [
        {
          detected: true,
          confidence: 0.948,
          severity: 'critical',
          collision_type: 'rear_end',
          track_ids: [104, 105, 108],
          bbox: [0.28, 0.44, 0.45, 0.35],
          deceleration_delta: 4.8
        }
      ]
    }
  },
  {
    id: 'BENCH-04',
    name: 'Delhi-NCR Ring Road Multi-Pipeline Stream (ANPR + Pothole)',
    category: 'combined',
    datasetSource: 'Roboflow + Intel Unnati Indian Smart Cities Benchmark',
    description: 'Simultaneous multi-task evaluation: Indian HSRP license plate detection on active traffic along with asphalt road depression detection.',
    imageUrl: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
    simulatedResults: {
      frame_id: 'FRM-8815',
      camera_id: 'CAM-02',
      timestamp: new Date().toISOString(),
      latency_ms: { anpr: 15.1, pothole: 14.8, accident: 13.2, total: 43.1 },
      anpr_detections: [
        {
          plate_text: 'DL 3C CE 7890',
          confidence: 0.954,
          bbox: [0.48, 0.65, 0.15, 0.07],
          is_blacklisted: false
        },
        {
          plate_text: 'KA 01 MJ 9081',
          confidence: 0.938,
          bbox: [0.22, 0.71, 0.14, 0.06],
          is_blacklisted: false
        }
      ],
      pothole_detections: [
        {
          id: 'POT-LIVE-03',
          severity: 'high',
          confidence: 0.894,
          bbox: [0.65, 0.78, 0.22, 0.15],
          area_score: 890
        }
      ],
      accident_detections: []
    }
  }
];

/**
 * Simulates frame ingestion for custom lab inputs with explicit hazard injection
 */
export function simulateFrameIngestion(
  cameraId: string,
  overridePlate?: string,
  customHazard?: 'pothole' | 'accident'
): IngestionResult {
  const now = new Date().toISOString();
  const plateText = (overridePlate || 'DL 01 AB 1234').toUpperCase().trim();
  const clean = plateText.replace(/\s+/g, '');
  const isBlacklist = clean === 'DL01AB1234' || clean === 'HR26DK8392' || clean === 'UP16BT4410' || clean === 'MH12DE5678';
  
  const anprLat = Math.round((11 + Math.random() * 5) * 10) / 10;
  const potLat = Math.round((12 + Math.random() * 4) * 10) / 10;
  const accLat = Math.round((10 + Math.random() * 6) * 10) / 10;

  const anpr_detections = [{
    plate_text: plateText,
    confidence: Math.round((0.93 + Math.random() * 0.06) * 1000) / 1000,
    bbox: [0.38, 0.58, 0.16, 0.08] as [number, number, number, number],
    is_blacklisted: isBlacklist,
    reason: isBlacklist ? 'Reported Stolen Vehicle (Delhi Police FIR #4891)' : undefined
  }];

  const hasPothole = customHazard === 'pothole' || (!customHazard && Math.random() > 0.4);
  const pothole_detections = hasPothole ? [{
    id: `POT-${Math.floor(Math.random() * 900 + 100)}`,
    severity: 'critical' as const,
    confidence: 0.912,
    bbox: [0.55, 0.74, 0.24, 0.16] as [number, number, number, number],
    area_score: 1450
  }] : [];

  const hasAccident = customHazard === 'accident';
  const accident_detections = hasAccident ? [{
    detected: true,
    confidence: 0.94,
    severity: 'critical' as const,
    collision_type: 'rear_end',
    track_ids: [102, 103],
    bbox: [0.32, 0.48, 0.42, 0.32] as [number, number, number, number],
    deceleration_delta: 4.8
  }] : [];

  return {
    frame_id: `FRM-${Math.floor(Math.random() * 9000 + 1000)}`,
    camera_id: cameraId,
    timestamp: now,
    latency_ms: {
      anpr: anprLat,
      pothole: potLat,
      accident: accLat,
      total: Math.round((anprLat + potLat + accLat) * 10) / 10
    },
    anpr_detections,
    pothole_detections,
    accident_detections
  };
}

/**
 * Runs the simulated 3-pipeline inference engine for uploaded or benchmark frames.
 */
export function runInferencePipeline(
  cameraId: string,
  cameraList: Camera[],
  blacklist: BlacklistItem[],
  benchmarkOrCustomText?: string
): IngestionResult {
  const camera = cameraList.find(c => c.id === cameraId) || cameraList[0];
  const now = new Date().toISOString();
  
  // Latency calculation based on YOLOv8 lightweight runtime
  const anprLat = Math.round((10 + Math.random() * 8) * 10) / 10;
  const potLat = Math.round((9 + Math.random() * 7) * 10) / 10;
  const accLat = Math.round((11 + Math.random() * 9) * 10) / 10;
  const totalLat = Math.round((anprLat + potLat + accLat) * 10) / 10;

  // Decide detections
  const isTargetPlate = benchmarkOrCustomText && benchmarkOrCustomText.length > 3;
  const detectedPlate = isTargetPlate 
    ? benchmarkOrCustomText.toUpperCase().trim() 
    : ['DL 01 AB 1234', 'HR 26 DK 8392', 'UP 16 BT 4410', 'MH 12 DE 5678', 'DL 3C CE 7890', 'KA 01 MJ 9081'][Math.floor(Math.random() * 6)];
  
  const blackMatch = blacklist.find(b => b.plate_text.replace(/\s+/g, '').toUpperCase() === detectedPlate.replace(/\s+/g, '').toUpperCase());

  const anpr_detections = [
    {
      plate_text: detectedPlate,
      confidence: Math.round((0.91 + Math.random() * 0.08) * 1000) / 1000,
      bbox: [0.35 + (Math.random() * 0.1 - 0.05), 0.58, 0.16, 0.08] as [number, number, number, number],
      is_blacklisted: !!blackMatch,
      reason: blackMatch?.reason
    }
  ];

  const potholeRandom = Math.random() > 0.4;
  const pothole_detections = potholeRandom ? [
    {
      id: `POT-${Math.floor(Math.random() * 900 + 100)}`,
      severity: (['low', 'medium', 'high', 'critical'] as const)[Math.floor(Math.random() * 4)],
      confidence: Math.round((0.82 + Math.random() * 0.15) * 1000) / 1000,
      bbox: [0.45 + (Math.random() * 0.2 - 0.1), 0.72, 0.22, 0.14] as [number, number, number, number],
      area_score: Math.round(300 + Math.random() * 1100)
    }
  ] : [];

  const accidentRandom = Math.random() > 0.75;
  const accident_detections = accidentRandom ? [
    {
      detected: true,
      confidence: Math.round((0.89 + Math.random() * 0.09) * 1000) / 1000,
      severity: (['minor', 'moderate', 'severe', 'critical'] as const)[Math.floor(Math.random() * 4)],
      collision_type: 'rear_end',
      track_ids: [101, 102],
      bbox: [0.3, 0.45, 0.4, 0.3] as [number, number, number, number],
      deceleration_delta: Math.round((3.2 + Math.random() * 2.5) * 10) / 10
    }
  ] : [];

  return {
    frame_id: `FRM-${Math.floor(Math.random() * 9000 + 1000)}`,
    camera_id: camera.id,
    timestamp: now,
    latency_ms: {
      anpr: anprLat,
      pothole: potLat,
      accident: accLat,
      total: totalLat
    },
    anpr_detections,
    pothole_detections,
    accident_detections
  };
}
