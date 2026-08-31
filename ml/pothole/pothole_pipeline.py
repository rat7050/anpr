"""
Pothole Detection Pipeline: YOLOv8 Fine-Tuned Detector + Severity Estimator + De-duplication
Trained/Evaluated on Intel Unnati Training Program (2,475 images) & GeraPotHole (608 images)
"""

import cv2
import numpy as np
import time
import math
from typing import Dict, Any, List, Tuple
from ultralytics import YOLO

class PotholePipeline:
    def __init__(self, model_path: str = "weights/yolov8n_pothole.pt"):
        print(f"[Pothole] Initializing YOLOv8 Pothole Detector ({model_path})...")
        self.detector = YOLO(model_path if model_path.endswith('.pt') else "yolov8n.pt")
        # History cache for spatial-temporal de-duplication
        self.recent_detections: List[Dict[str, Any]] = []
        self.dedup_window_seconds = 10.0
        self.dedup_distance_threshold_m = 5.0 # meters

    def calculate_severity(self, bbox_area_norm: float, frame_area: float) -> Tuple[str, float]:
        """
        Classifies severity based on normalized bounding box surface area in the lower visual plane.
        """
        area_pixels = bbox_area_norm * frame_area
        # Scaled area approximation in sq cm
        estimated_area_cm2 = round(area_pixels * 0.18, 1)

        if bbox_area_norm > 0.08:
            return "critical", estimated_area_cm2
        elif bbox_area_norm > 0.04:
            return "high", estimated_area_cm2
        elif bbox_area_norm > 0.015:
            return "medium", estimated_area_cm2
        else:
            return "low", estimated_area_cm2

    def is_duplicate(self, lat: float, lon: float, current_time: float) -> bool:
        """
        De-duplicates detections of the same physical road defect within time & distance threshold.
        """
        self.recent_detections = [d for d in self.recent_detections if current_time - d["time"] < self.dedup_window_seconds]
        for past in self.recent_detections:
            # Approximate Euclidean distance in meters for close coordinates
            d_lat = (lat - past["lat"]) * 111000
            d_lon = (lon - past["lon"]) * 88000
            dist = math.sqrt(d_lat**2 + d_lon**2)
            if dist < self.dedup_distance_threshold_m:
                return True
        return False

    def process_frame(self, frame: np.ndarray, camera_id: str, lat: float, lon: float) -> List[Dict[str, Any]]:
        t_start = time.perf_counter()
        results = self.detector(frame, verbose=False)[0]
        detections = []
        current_time = time.time()
        h, w = frame.shape[:2]
        frame_area = h * w

        for box in results.boxes:
            conf = float(box.conf[0])
            if conf < 0.45:
                continue

            xyxy = box.xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = max(0, xyxy[0]), max(0, xyxy[1]), min(w, xyxy[2]), min(h, xyxy[3])
            
            box_w = x2 - x1
            box_h = y2 - y1
            norm_area = (box_w * box_h) / frame_area

            # Potholes appear on the road surface (lower half of camera perspective)
            if (y1 + y2) / (2 * h) < 0.35:
                continue

            severity, area_cm2 = self.calculate_severity(norm_area, frame_area)

            # Perform spatial de-duplication
            if self.is_duplicate(lat, lon, current_time):
                continue

            pothole_id = f"POT-{int(current_time % 10000):04d}"
            self.recent_detections.append({"lat": lat, "lon": lon, "time": current_time, "id": pothole_id})

            detections.append({
                "id": pothole_id,
                "severity": severity,
                "confidence": round(conf, 3),
                "area_sq_cm": area_cm2,
                "camera_id": camera_id,
                "lat": lat,
                "lon": lon,
                "bbox": [round(x1/w, 3), round(y1/h, 3), round(box_w/w, 3), round(box_h/h, 3)],
                "status": "reported",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "latency_ms": round((time.perf_counter() - t_start) * 1000, 2)
            })

        return detections

if __name__ == "__main__":
    pipeline = PotholePipeline()
    dummy = np.zeros((720, 1280, 3), dtype=np.uint8)
    events = pipeline.process_frame(dummy, camera_id="CAM-04", lat=37.7654, lon=-122.4192)
    print(f"[Pothole Pipeline Output] Emitted events: {events}")
