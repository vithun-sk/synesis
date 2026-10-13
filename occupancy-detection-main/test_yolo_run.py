import os
import cv2
import torch
import numpy as np
from ultralytics import YOLO

print("PyTorch version:", torch.__version__)
model_path = os.path.join(os.path.dirname(__file__), "yolov8n.pt")
print("Loading model from:", model_path)
model = YOLO(model_path)
print("Model loaded successfully!")
print("Classes:", len(model.names))

# Run test prediction
dummy = np.zeros((480, 640, 3), dtype=np.uint8)
res = model.predict(dummy, classes=[0], verbose=False)
print("Test inference successful! Detections count:", len(res[0].boxes))
