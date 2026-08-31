export interface Camera {
  id: string;
  name: string;
  lat: number;
  lon: number;
  road_name: string;
  status: 'active' | 'offline' | 'degraded';
  fps: number;
  resolution: string;
  zone: string;
}

export interface PlateEvent {
  id: string;
  plate_text: string;
  confidence: number;
  camera_id: string;
  lat: number;
  lon: number;
  timestamp: string;
  image_path?: string;
  vehicle_type?: string;
  speed_kmh?: number;
  is_blacklisted?: boolean;
  blacklist_reason?: string;
}

export interface PotholeEvent {
  id: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  camera_id: string;
  lat: number;
  lon: number;
  timestamp: string;
  image_path?: string;
  status: 'reported' | 'scheduled' | 'fixed';
  area_sq_cm?: number;
  depth_estimate_cm?: number;
  confidence: number;
}

export interface AccidentEvent {
  id: string;
  severity: 'minor' | 'moderate' | 'severe' | 'critical';
  camera_id: string;
  lat: number;
  lon: number;
  timestamp: string;
  clip_path?: string;
  confirmed: boolean;
  vehicles_involved: number;
  collision_type: 'rear_end' | 'side_impact' | 'head_on' | 'pedestrian_involved' | 'rollover';
  deceleration_g: number;
  status: 'new' | 'dispatching' | 'resolved';
}

export interface BlacklistItem {
  id: string;
  plate_text: string;
  reason: string;
  flag_level: 'warning' | 'urgent' | 'felony';
  added_at: string;
}

export interface AlertItem {
  id: string;
  type: 'blacklist' | 'accident' | 'hazard';
  reference_id: string;
  camera_id: string;
  camera_name?: string;
  road_name?: string;
  timestamp: string;
  acknowledged: boolean;
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface TrajectoryPoint {
  camera_id: string;
  camera_name: string;
  road_name: string;
  lat: number;
  lon: number;
  timestamp: string;
  confidence: number;
  speed_kmh: number;
}

export interface PlateTrajectory {
  plate_text: string;
  total_sightings: number;
  first_seen: string;
  last_seen: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
  trajectory: TrajectoryPoint[];
}

export interface IngestionResult {
  frame_id: string;
  camera_id: string;
  timestamp: string;
  latency_ms: {
    anpr: number;
    pothole: number;
    accident: number;
    total: number;
  };
  anpr_detections: {
    plate_text: string;
    confidence: number;
    bbox: [number, number, number, number]; // [x, y, w, h] normalized
    is_blacklisted: boolean;
    reason?: string;
    ocr_crops?: string;
  }[];
  pothole_detections: {
    id: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    bbox: [number, number, number, number];
    area_score: number;
  }[];
  accident_detections: {
    detected: boolean;
    confidence: number;
    severity?: 'minor' | 'moderate' | 'severe' | 'critical';
    collision_type?: string;
    track_ids: number[];
    bbox: [number, number, number, number];
    deceleration_delta: number;
  }[];
}

export interface TrafficDensityAnalytics {
  camera_id: string;
  camera_name: string;
  road_name: string;
  current_vehicles_per_min: number;
  avg_speed_kmh: number;
  congestion_level: 'low' | 'moderate' | 'high' | 'gridlock';
  hourly_distribution: { hour: string; count: number }[];
}

export interface PotholeHeatmapPoint {
  lat: number;
  lon: number;
  intensity: number; // 0.0 - 1.0
  severity: string;
  pothole_id: string;
}

export interface DatasetSample {
  id: string;
  title: string;
  category: 'anpr' | 'pothole' | 'accident';
  image_url: string;
  dataset_source: string;
  default_plate?: string;
}

export interface RtoVehicleDetails {
  plate_number: string;
  clean_plate: string;
  carinfo_url: string;
  carinfo_direct_search_url: string;
  maker_model: string;
  vehicle_class: string;
  vehicle_color?: string;
  owner_name_masked: string;
  rto_name: string;
  rto_code: string;
  rto_state: string;
  registration_date: string;
  vehicle_age: string;
  fuel_type: string;
  emission_norm: string;
  engine_number_masked: string;
  chassis_number_masked: string;
  insurance_status: 'Active' | 'Expired' | 'Expiring Soon';
  insurance_expiry: string;
  insurance_provider: string;
  pucc_status: 'Valid' | 'Expired';
  pucc_expiry: string;
  fitness_upto: string;
  tax_status: string;
  challan_count: number;
  challan_amount: number;
  challan_summary?: string;
  is_blacklisted: boolean;
  blacklist_reason?: string;
}


