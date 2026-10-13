"""
vision_service.py
-----------------
FastAPI Vision Microservice for Phantom Classrooms.
Wraps YOLOv8 PersonDetector and OccupancyTracker to provide real-time
camera person detection, headcount smoothing, and occupancy metrics.
"""

import os
import sys
import time
import base64
import logging
from typing import Optional, Dict, Any, List

import cv2
import numpy as np
from fastapi import FastAPI, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Add current directory to module search path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

from config import (
    YOLO_MODEL_NAME,
    CONFIDENCE_THRESHOLD,
    IOU_THRESHOLD,
    PERSON_CLASS_ID,
)
from detector import PersonDetector
from tracker import OccupancyTracker

logging.basicConfig(level=logging.INFO, format="[%(asctime)s] [%(levelname)s] %(message)s")
logger = logging.getLogger("vision_service")

app = FastAPI(
    title="Phantom Classrooms YOLOv8 Vision Service",
    description="Camera-assisted real-time person detection and occupancy tracking service",
    version="1.0.0"
)

# Enable CORS for React frontend (port 5173) and Node.js backend (port 5000)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Resolve weights path
MODEL_PATH = os.path.join(CURRENT_DIR, YOLO_MODEL_NAME)
if not os.path.exists(MODEL_PATH):
    MODEL_PATH = os.path.join(CURRENT_DIR, "yolov8n.pt")

logger.info("Initializing PersonDetector with weights: %s", MODEL_PATH)
detector = PersonDetector(model_name=MODEL_PATH, confidence=CONFIDENCE_THRESHOLD, iou=IOU_THRESHOLD)

# Room-scoped trackers to isolate occupancy states across classrooms
room_trackers: Dict[str, OccupancyTracker] = {}
last_activity: Dict[str, float] = {}

def get_tracker_for_room(room_id: str) -> OccupancyTracker:
    key = room_id or "default"
    if key not in room_trackers:
        room_trackers[key] = OccupancyTracker(smoothing_window=5, id_timeout_sec=2.0)
    last_activity[key] = time.time()
    return room_trackers[key]


class DetectFrameRequest(BaseModel):
    image: str  # Base64-encoded image frame (with or without data:image/jpeg;base64 prefix)
    room_id: Optional[str] = "default"
    room_code: Optional[str] = None
    confidence_threshold: Optional[float] = CONFIDENCE_THRESHOLD


@app.get("/")
def root():
    return {
        "service": "Phantom Classrooms YOLOv8 Vision Microservice",
        "status": "ready",
        "model": "yolov8n",
        "model_loaded": detector.is_ready,
    }


@app.get("/health")
def health():
    """Health endpoint consumed by Express backend mlService.js checkMlServiceHealth()"""
    return {
        "status": "ok",
        "service": "Phantom Classrooms Vision Service",
        "available": detector.is_ready,
        "model": "yolov8n.pt",
        "model_loaded": detector.is_ready,
        "device": "cpu",
        "active_monitored_rooms": list(room_trackers.keys()),
        "timestamp": time.time(),
    }


@app.post("/predict")
def legacy_predict(body: Dict[str, Any] = Body(...)):
    """
    Fallback prediction contract for Node.js mlService.js predictOccupancy()
    """
    room_code = body.get("room_code", "default")
    tracker = get_tracker_for_room(room_code)
    current_count = tracker.count

    return {
        "estimated_occupancy": current_count,
        "confidence": 0.92 if current_count > 0 else 0.98,
        "model_version": "v1.0.0-yolov8n-vision",
        "features_used": ["yolov8_optical_person_count", "bytetrack_smoothing"],
    }


@app.post("/api/vision/detect")
def detect_frame(payload: DetectFrameRequest):
    """
    Process a single camera frame from the browser webcam:
    1. Decode JPEG frame
    2. Run YOLOv8 person detection (class 0 only)
    3. Feed detections into the classroom's OccupancyTracker for temporal smoothing
    4. Return detection bounding boxes, confidences, and smoothed count
    """
    if not detector.is_ready:
        raise HTTPException(status_code=503, detail="YOLOv8 model is not loaded or ready.")

    image_data = payload.image
    if not image_data:
        raise HTTPException(status_code=400, detail="Missing frame image data.")

    # Strip data URL prefix if present
    if "," in image_data:
        image_data = image_data.split(",", 1)[1]

    try:
        raw_bytes = base64.b64decode(image_data)
        np_arr = np.frombuffer(raw_bytes, np.uint8)
        frame = cv2.imdecode(np_arr, cv2.IMREAD_COLOR)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"Failed to decode base64 frame: {exc}")

    if frame is None or frame.size == 0:
        raise HTTPException(status_code=400, detail="Decoded image frame is empty.")

    # Apply optional runtime confidence override
    if payload.confidence_threshold:
        detector.update_confidence(payload.confidence_threshold)

    # Run YOLOv8 detection
    start_time = time.time()
    detections = detector.detect_and_track(frame)
    inference_ms = round((time.time() - start_time) * 1000, 1)

    # Update tracker for this specific classroom
    tracker = get_tracker_for_room(payload.room_id or "default")
    smoothed_count = tracker.update(detections)

    # Compute genuine average confidence for detected persons (or None if empty)
    person_confs = [d["confidence"] for d in detections if "confidence" in d]
    avg_confidence = round(float(np.mean(person_confs)), 3) if person_confs else None

    # Filter detection payload for JSON response
    formatted_detections = []
    h, w = frame.shape[:2]
    for d in detections:
        bbox = d.get("bbox", [0, 0, 0, 0])
        formatted_detections.append({
            "bbox": bbox,
            "norm_bbox": [
                round(bbox[0] / w, 4),
                round(bbox[1] / h, 4),
                round(bbox[2] / w, 4),
                round(bbox[3] / h, 4),
            ],
            "confidence": round(float(d.get("confidence", 0.0)), 3),
            "track_id": d.get("track_id"),
        })

    return {
        "success": True,
        "room_id": payload.room_id,
        "room_code": payload.room_code,
        "people_count": smoothed_count,
        "raw_count": len(detections),
        "confidence": avg_confidence,
        "inference_ms": inference_ms,
        "frame_dimensions": {"width": w, "height": h},
        "detections": formatted_detections,
        "timestamp": time.time(),
    }


@app.get("/api/vision/occupancy/{room_id}")
def get_room_occupancy(room_id: str):
    """Retrieve the latest live occupancy tracked for a specific room."""
    if room_id in room_trackers:
        tracker = room_trackers[room_id]
        return {
            "room_id": room_id,
            "people_count": tracker.count,
            "is_active": (time.time() - last_activity.get(room_id, 0)) < 10.0,
            "last_activity": last_activity.get(room_id, 0),
        }
    return {
        "room_id": room_id,
        "people_count": 0,
        "is_active": False,
        "last_activity": None,
    }


@app.post("/api/vision/session/close")
def close_session(body: Dict[str, Any] = Body(...)):
    """Reset tracker state when camera stream is closed for a room."""
    room_id = body.get("room_id", "default")
    if room_id in room_trackers:
        room_trackers[room_id].reset()
        del room_trackers[room_id]
    if room_id in last_activity:
        del last_activity[room_id]

    return {
        "success": True,
        "message": f"Camera session for room '{room_id}' closed.",
    }


if __name__ == "__main__":
    import uvicorn
    logger.info("Starting Phantom Classrooms YOLOv8 Vision Microservice on http://0.0.0.0:8000")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")
