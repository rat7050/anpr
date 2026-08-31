import { Camera, PlateEvent, PotholeEvent, AccidentEvent, BlacklistItem, AlertItem, DatasetSample } from '../types/traffic';

export const INITIAL_CAMERAS: Camera[] = [
  {
    id: 'CAM-01',
    name: 'DND Flyway - Noida Toll Plaza',
    lat: 28.5828,
    lon: 77.2995,
    road_name: 'DND Flyway Expressway (NHAI Zone)',
    status: 'active',
    fps: 30,
    resolution: '1920x1080',
    zone: 'East Delhi / Noida Link'
  },
  {
    id: 'CAM-02',
    name: 'Ashram Chowk & Ring Road Flyover',
    lat: 28.5708,
    lon: 77.2588,
    road_name: 'Mahatma Gandhi Marg (Inner Ring Road)',
    status: 'active',
    fps: 25,
    resolution: '1920x1080',
    zone: 'South East Delhi Arterial'
  },
  {
    id: 'CAM-03',
    name: 'Connaught Place Outer Circle',
    lat: 28.6328,
    lon: 77.2200,
    road_name: 'Barakhamba Road Junction',
    status: 'active',
    fps: 30,
    resolution: '2560x1440',
    zone: 'Central Delhi Commercial Hub'
  },
  {
    id: 'CAM-04',
    name: 'NH-48 Mahipalpur / IGI Airport Corridor',
    lat: 28.5448,
    lon: 77.1235,
    road_name: 'Delhi-Gurugram Expressway (NH-48)',
    status: 'active',
    fps: 25,
    resolution: '1920x1080',
    zone: 'Airport Express Sector'
  },
  {
    id: 'CAM-05',
    name: 'AIIMS & Ring Road Intersection',
    lat: 28.5672,
    lon: 77.2100,
    road_name: 'Sri Aurobindo Marg / Ring Road',
    status: 'active',
    fps: 30,
    resolution: '1920x1080',
    zone: 'Medical & Transit Corridor'
  },
  {
    id: 'CAM-06',
    name: 'Outer Ring Road - Nehru Place Flyover',
    lat: 28.5492,
    lon: 77.2530,
    road_name: 'Outer Ring Road Arterial',
    status: 'active',
    fps: 30,
    resolution: '1920x1080',
    zone: 'South Delhi Tech Corridor'
  }
];

export const INITIAL_BLACKLIST: BlacklistItem[] = [
  {
    id: 'BL-101',
    plate_text: 'DL 01 AB 1234',
    reason: 'Reported Stolen Vehicle (Delhi Police FIR #4891/2026)',
    flag_level: 'felony',
    added_at: '2026-08-28T14:30:00Z'
  },
  {
    id: 'BL-102',
    plate_text: 'HR 26 DK 8392',
    reason: 'Suspended Registration / Hit & Run Suspect (Gurugram Police)',
    flag_level: 'urgent',
    added_at: '2026-08-29T09:15:00Z'
  },
  {
    id: 'BL-103',
    plate_text: 'UP 16 BT 4410',
    reason: 'Chronic Speed Violator & 18+ Unpaid e-Challans (Noida Authority)',
    flag_level: 'warning',
    added_at: '2026-08-30T18:00:00Z'
  },
  {
    id: 'BL-104',
    plate_text: 'MH 12 DE 5678',
    reason: 'Inter-State Narcotics & Contraband Transit Alert (NCB Delhi)',
    flag_level: 'felony',
    added_at: '2026-08-25T11:20:00Z'
  }
];

export const INITIAL_PLATE_EVENTS: PlateEvent[] = [
  {
    id: 'PE-001',
    plate_text: 'DL 01 AB 1234',
    confidence: 0.96,
    camera_id: 'CAM-01',
    lat: 28.5828,
    lon: 77.2995,
    timestamp: '2026-08-30T22:15:00Z',
    vehicle_type: 'Sedan (Swift Dzire Grey)',
    speed_kmh: 72,
    is_blacklisted: true,
    blacklist_reason: 'Reported Stolen Vehicle (Delhi Police FIR #4891/2026)'
  },
  {
    id: 'PE-002',
    plate_text: 'DL 01 AB 1234',
    confidence: 0.94,
    camera_id: 'CAM-06',
    lat: 28.5492,
    lon: 77.2530,
    timestamp: '2026-08-30T22:24:00Z',
    vehicle_type: 'Sedan (Swift Dzire Grey)',
    speed_kmh: 48,
    is_blacklisted: true,
    blacklist_reason: 'Reported Stolen Vehicle (Delhi Police FIR #4891/2026)'
  },
  {
    id: 'PE-003',
    plate_text: 'DL 01 AB 1234',
    confidence: 0.95,
    camera_id: 'CAM-02',
    lat: 28.5708,
    lon: 77.2588,
    timestamp: '2026-08-30T22:31:00Z',
    vehicle_type: 'Sedan (Swift Dzire Grey)',
    speed_kmh: 38,
    is_blacklisted: true,
    blacklist_reason: 'Reported Stolen Vehicle (Delhi Police FIR #4891/2026)'
  },
  {
    id: 'PE-004',
    plate_text: 'HR 26 DK 8392',
    confidence: 0.98,
    camera_id: 'CAM-04',
    lat: 28.5448,
    lon: 77.1235,
    timestamp: '2026-08-30T22:28:10Z',
    vehicle_type: 'SUV (Mahindra Scorpio White)',
    speed_kmh: 84,
    is_blacklisted: true,
    blacklist_reason: 'Suspended Registration / Hit & Run Suspect (Gurugram Police)'
  },
  {
    id: 'PE-005',
    plate_text: 'DL 3C CE 7890',
    confidence: 0.93,
    camera_id: 'CAM-05',
    lat: 28.5672,
    lon: 77.2100,
    timestamp: '2026-08-30T22:29:45Z',
    vehicle_type: 'Hatchback (Hyundai i20 Blue)',
    speed_kmh: 52,
    is_blacklisted: false
  },
  {
    id: 'PE-006',
    plate_text: 'UP 16 BT 4410',
    confidence: 0.91,
    camera_id: 'CAM-01',
    lat: 28.5828,
    lon: 77.2995,
    timestamp: '2026-08-30T22:33:12Z',
    vehicle_type: 'Commercial EV Cab (Tata Tigor)',
    speed_kmh: 60,
    is_blacklisted: true,
    blacklist_reason: 'Chronic Speed Violator & 18+ Unpaid e-Challans (Noida Authority)'
  },
  {
    id: 'PE-007',
    plate_text: 'KA 01 MJ 9081',
    confidence: 0.97,
    camera_id: 'CAM-03',
    lat: 28.6328,
    lon: 77.2200,
    timestamp: '2026-08-30T22:34:50Z',
    vehicle_type: 'EV SUV (Tata Nexon Silver)',
    speed_kmh: 40,
    is_blacklisted: false
  }
];

export const INITIAL_POTHOLES: PotholeEvent[] = [
  {
    id: 'POT-101',
    severity: 'critical',
    camera_id: 'CAM-04',
    lat: 28.5452,
    lon: 77.1240,
    timestamp: '2026-08-30T19:40:00Z',
    status: 'reported',
    area_sq_cm: 1450,
    depth_estimate_cm: 9.5,
    confidence: 0.94
  },
  {
    id: 'POT-102',
    severity: 'high',
    camera_id: 'CAM-01',
    lat: 28.5832,
    lon: 77.2990,
    timestamp: '2026-08-30T20:12:00Z',
    status: 'scheduled',
    area_sq_cm: 820,
    depth_estimate_cm: 6.2,
    confidence: 0.89
  },
  {
    id: 'POT-103',
    severity: 'medium',
    camera_id: 'CAM-02',
    lat: 28.5712,
    lon: 77.2592,
    timestamp: '2026-08-30T21:05:00Z',
    status: 'reported',
    area_sq_cm: 410,
    depth_estimate_cm: 3.8,
    confidence: 0.85
  },
  {
    id: 'POT-104',
    severity: 'low',
    camera_id: 'CAM-06',
    lat: 28.5488,
    lon: 77.2525,
    timestamp: '2026-08-30T21:45:00Z',
    status: 'fixed',
    area_sq_cm: 190,
    depth_estimate_cm: 2.1,
    confidence: 0.81
  },
  {
    id: 'POT-105',
    severity: 'high',
    camera_id: 'CAM-05',
    lat: 28.5676,
    lon: 77.2105,
    timestamp: '2026-08-30T22:00:00Z',
    status: 'reported',
    area_sq_cm: 960,
    depth_estimate_cm: 7.0,
    confidence: 0.92
  }
];

export const INITIAL_ACCIDENTS: AccidentEvent[] = [
  {
    id: 'ACC-801',
    severity: 'critical',
    camera_id: 'CAM-04',
    lat: 28.5448,
    lon: 77.1235,
    timestamp: '2026-08-30T22:20:15Z',
    confirmed: true,
    vehicles_involved: 3,
    collision_type: 'rear_end',
    deceleration_g: 4.8,
    status: 'dispatching'
  },
  {
    id: 'ACC-802',
    severity: 'minor',
    camera_id: 'CAM-03',
    lat: 28.6328,
    lon: 77.2200,
    timestamp: '2026-08-30T21:10:00Z',
    confirmed: true,
    vehicles_involved: 2,
    collision_type: 'side_impact',
    deceleration_g: 2.1,
    status: 'resolved'
  }
];

export const INITIAL_ALERTS: AlertItem[] = [
  {
    id: 'ALT-901',
    type: 'accident',
    reference_id: 'ACC-801',
    camera_id: 'CAM-04',
    camera_name: 'NH-48 Mahipalpur / IGI Airport Corridor',
    road_name: 'Delhi-Gurugram Expressway (NH-48)',
    timestamp: '2026-08-30T22:20:18Z',
    acknowledged: false,
    title: 'CRITICAL MULTI-VEHICLE PILEUP ON NH-48 EXPRESSWAY',
    description: 'YOLOv8 + DeepSORT detected 4.8G impact deceleration and multi-box IoU overlap involving 3 vehicles. CATS Ambulance & NHAI 1033 emergency unit dispatched.',
    severity: 'critical'
  },
  {
    id: 'ALT-902',
    type: 'blacklist',
    reference_id: 'PE-003',
    camera_id: 'CAM-02',
    camera_name: 'Ashram Chowk & Ring Road Flyover',
    road_name: 'Mahatma Gandhi Marg (Inner Ring Road)',
    timestamp: '2026-08-30T22:31:02Z',
    acknowledged: false,
    title: 'HSRP BLACKLIST TARGET INTERCEPT: DL 01 AB 1234',
    description: 'License plate matched active Delhi Police FIR #4891 (Stolen Swift Dzire). Sighted heading toward Ashram Underpass.',
    severity: 'high'
  },
  {
    id: 'ALT-903',
    type: 'blacklist',
    reference_id: 'PE-004',
    camera_id: 'CAM-04',
    camera_name: 'NH-48 Mahipalpur Corridor',
    road_name: 'Delhi-Gurugram Expressway (NH-48)',
    timestamp: '2026-08-30T22:28:15Z',
    acknowledged: true,
    title: 'SUSPENDED REGISTRATION MATCH: HR 26 DK 8392',
    description: 'Gurugram Hit & Run suspect Scorpio detected with 98% OCR confidence. Sighted entering Delhi border zone.',
    severity: 'medium'
  }
];

export const SAMPLE_DATASETS: DatasetSample[] = [
  {
    id: 'smp-anpr-1',
    title: 'Indian HSRP License Plate (High Security Registration)',
    category: 'anpr',
    image_url: 'https://images.unsplash.com/photo-1549399542-7e3f8b79c341?auto=format&fit=crop&w=1200&q=80',
    dataset_source: 'India ALPR Benchmark / Roboflow HSRP Universe (10,125 imgs)',
    default_plate: 'DL 01 AB 1234'
  },
  {
    id: 'smp-pot-1',
    title: 'Monsoon Asphalt Pothole (Indian Driving Dataset)',
    category: 'pothole',
    image_url: 'https://images.unsplash.com/photo-1515162816999-a0c47dc192f7?auto=format&fit=crop&w=1200&q=80',
    dataset_source: 'Intel Unnati & IIIT-H Indian Driving Dataset (2,475 imgs)',
    default_plate: 'HR 26 DK 8392'
  },
  {
    id: 'smp-acc-1',
    title: 'NH-48 National Highway Collision (CCTV Feed)',
    category: 'accident',
    image_url: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?auto=format&fit=crop&w=1200&q=80',
    dataset_source: 'Indian Highway Accident CCTV Model (3,200+ frames)',
    default_plate: 'UP 16 BT 4410'
  },
  {
    id: 'smp-corridor-1',
    title: 'Delhi Ring Road Multi-Modal Traffic Stream',
    category: 'anpr',
    image_url: 'https://images.unsplash.com/photo-1506521781263-d8422e82f27a?auto=format&fit=crop&w=1200&q=80',
    dataset_source: 'Indian Smart Cities Mission ITS Benchmark',
    default_plate: 'DL 3C CE 7890'
  }
];

export const DATASET_CATALOG = [
  {
    task: 'Indian License Plate Recognition (HSRP ANPR)',
    dataset_name: 'Indian Vehicle HSRP License Plate OCR Dataset',
    sample_count: '10,125 images + state-wise code weights',
    format: 'YOLOv8 + EasyOCR (DL, HR, UP, MH, KA, etc.)',
    map_score: '0.948 mAP@0.5',
    verified_url: 'https://universe.roboflow.com/roboflow-universe-projects/license-plate-recognition-rxg4e'
  },
  {
    task: 'Indian Road Defects & Pothole Detection',
    dataset_name: 'Intel Unnati & IIIT-H Indian Driving Dataset (IDD)',
    sample_count: '2,475 monsoon & arterial road frames',
    format: 'YOLOv8s PyTorch Weights (IRC-Standard Depth/Area)',
    map_score: '0.912 mAP@0.5',
    verified_url: 'https://universe.roboflow.com/intel-unnati-training-program/pothole-detection-bqu6s'
  },
  {
    task: 'Highway Collision & Emergency Deceleration',
    dataset_name: 'NHAI / Highway Accident Detection Dataset',
    sample_count: '3,200+ CCTV & Highway Dashcam frames',
    format: 'YOLOv8 + ByteTrack / DeepSORT (Kinematic IoU > 0.55)',
    map_score: '0.894 mAP@0.5 | Precision: 0.918',
    verified_url: 'https://universe.roboflow.com/accident-detection-model/accident-detection-model'
  }
];
