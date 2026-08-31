"""
ANPR Pipeline: YOLOv8 License Plate Detection + OpenCV CLAHE Pre-processing + EasyOCR
Trained/Evaluated on Roboflow Universe License Plate Recognition (10,125 images)
"""

import cv2
import numpy as np
import easyocr
import re
import time
from typing import Dict, Any, List, Optional
from ultralytics import YOLO

class ANPRPipeline:
    def __init__(self, model_path: str = "weights/yolov8n_plate.pt", use_gpu: bool = False):
        print(f"[ANPR] Initializing YOLOv8 Plate Detector ({model_path})...")
        self.detector = YOLO(model_path if model_path.endswith('.pt') else "yolov8n.pt")
        print("[ANPR] Initializing EasyOCR Reader (English/Alphanumeric)...")
        self.reader = easyocr.Reader(['en'], gpu=use_gpu)
        # Standard regional plate pattern (alphanumeric, 4-8 chars)
        self.plate_pattern = re.compile(r'^[A-Z0-9]{4,8}$')

    def preprocess_plate_crop(self, crop: np.ndarray) -> np.ndarray:
        """
        Enhance plate contrast and sharpness using OpenCV CLAHE & bilateral filtering.
        """
        if crop.size == 0:
            return crop
        gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
        # Noise reduction while keeping edges sharp
        filtered = cv2.bilateralFilter(gray, 11, 17, 17)
        # Contrast Limited Adaptive Histogram Equalization (CLAHE)
        clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
        enhanced = clahe.apply(filtered)
        # Otsu thresholding for OCR binarization
        _, thresh = cv2.threshold(enhanced, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return thresh

    def process_frame(self, frame: np.ndarray, camera_id: str, lat: float, lon: float) -> List[Dict[str, Any]]:
        t_start = time.perf_counter()
        results = self.detector(frame, verbose=False)[0]
        detections = []

        h, w = frame.shape[:2]

        for box in results.boxes:
            # Check class is license plate (or vehicle class depending on custom checkpoint)
            conf = float(box.conf[0])
            if conf < 0.40:
                continue

            xyxy = box.xyxy[0].cpu().numpy().astype(int)
            x1, y1, x2, y2 = max(0, xyxy[0]), max(0, xyxy[1]), min(w, xyxy[2]), min(h, xyxy[3])

            plate_crop = frame[y1:y2, x1:x2]
            if plate_crop.shape[0] < 10 or plate_crop.shape[1] < 20:
                continue

            # Step 2: OpenCV Preprocessing
            processed_crop = self.preprocess_plate_crop(plate_crop)

            # Step 3: OCR Extraction
            ocr_results = self.reader.readtext(processed_crop)
            if not ocr_results:
                ocr_results = self.reader.readtext(plate_crop)

            best_text = ""
            best_conf = 0.0

            for (_, text, ocr_conf) in ocr_results:
                clean_text = re.sub(r'[^A-Z0-9]', '', text.upper())
                if len(clean_text) >= 4 and ocr_conf > best_conf:
                    best_text = clean_text
                    best_conf = ocr_conf

            if best_text:
                detections.append({
                    "plate_text": best_text,
                    "confidence": round(best_conf * conf, 3),
                    "camera_id": camera_id,
                    "lat": lat,
                    "lon": lon,
                    "bbox": [round(x1/w, 3), round(y1/h, 3), round((x2-x1)/w, 3), round((y2-y1)/h, 3)],
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                    "latency_ms": round((time.perf_counter() - t_start) * 1000, 2)
                })

        return detections

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Standalone ANPR Pipeline Runner")
    parser.add_argument("--image", type=str, default="sample.jpg", help="Path to input image/frame")
    args = parser.parse_args()

    pipeline = ANPRPipeline()
    # Create synthetic test image if not present
    img = cv2.imread(args.image) if cv2.imread(args.image) is not None else np.zeros((720, 1280, 3), dtype=np.uint8)
    events = pipeline.process_frame(img, camera_id="CAM-01", lat=37.7749, lon=-122.4194)
    print(f"[ANPR Pipeline Output] Detected {len(events)} plate events: {events}")
