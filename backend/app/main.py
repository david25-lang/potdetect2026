from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any, Optional

from fastapi import FastAPI, File, HTTPException, Query, UploadFile
from fastapi.middleware.cors import CORSMiddleware

from .cnn import CNNClassifier
from .database import fetch_analytics, fetch_history, init_db, record_cnn_scan, record_yolo_scan
from .model import YOLODetector
from .utils import encode_image_base64, read_image_upload


logger = logging.getLogger(__name__)
detector = YOLODetector()
classifier = CNNClassifier()


@asynccontextmanager
async def lifespan(app: FastAPI):
    init_db()
    detector.load()
    classifier.load()
    yield


app = FastAPI(
    title="YOLO Object Detection API",
    description="FastAPI backend for YOLO image inference.",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def health_check() -> dict[str, str]:
    return {"message": "YOLO API is running"}


@app.post("/predict/")
async def predict(
    image: UploadFile = File(...),
    confidence: Optional[float] = Query(default=None, ge=0.0, le=1.0),
) -> dict[str, Any]:
    image_array = await _read_request_image(image)
    detections = _predict(image_array, confidence)
    return {"detections": detections}


@app.post("/predict-annotated/")
async def predict_annotated(
    image: UploadFile = File(...),
    confidence: Optional[float] = Query(default=None, ge=0.0, le=1.0),
    iou: Optional[float] = Query(default=None, ge=0.0, le=1.0),
) -> dict[str, Any]:
    image_array = await _read_request_image(image)

    try:
        detections, annotated_image = detector.predict_with_annotation(
            image_array, confidence, iou
        )
        encoded_image = encode_image_base64(annotated_image)
    except Exception as exc:
        filename = image.filename or "unknown"
        record_yolo_scan(filename, [], status="failed")
        logger.exception("YOLO annotated inference failed")
        raise HTTPException(status_code=500, detail="YOLO inference failed.") from exc

    record_yolo_scan(image.filename or "unknown", detections)

    return {
        "detections": detections,
        "annotated_image": encoded_image,
        "image_format": "jpg",
    }


@app.post("/classify")
async def classify(
    image: UploadFile = File(...),
) -> dict[str, Any]:
    if not classifier.available:
        raise HTTPException(
            status_code=503,
            detail=(
                "CNN classifier is unavailable. "
                "Ensure onnxruntime is installed and best_cnn.onnx is in backend/models/. "
                "Run: python convert_model.py to generate the ONNX model from best_cnn.keras."
            ),
        )

    image_array = await _read_request_image(image)

    try:
        result = classifier.classify(image_array)
    except Exception as exc:
        record_cnn_scan(image.filename or "unknown", {}, status="failed")
        logger.exception("CNN classification failed")
        raise HTTPException(status_code=500, detail="CNN classification failed.") from exc

    record_cnn_scan(image.filename or "unknown", result)
    return result


# ---------------------------------------------------------------------------
# Analytics & History
# ---------------------------------------------------------------------------

@app.get("/history")
def history(limit: int = Query(default=200, ge=1, le=1000)) -> list[dict]:
    return fetch_history(limit)


@app.get("/analytics")
def analytics() -> dict[str, Any]:
    return fetch_analytics()


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _read_request_image(image: UploadFile) -> Any:
    try:
        return await read_image_upload(image)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


def _predict(image_array: Any, confidence: Optional[float]) -> list[dict]:
    try:
        return detector.predict(image_array, confidence)
    except Exception as exc:
        logger.exception("YOLO inference failed")
        raise HTTPException(status_code=500, detail="YOLO inference failed.") from exc
