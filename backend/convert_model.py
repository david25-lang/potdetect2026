"""
Build-time script: converts both models to ONNX so the runtime needs only onnxruntime.
Run during Render build BEFORE installing requirements.txt.

  pip install tensorflow-cpu tf2onnx onnx ultralytics && python convert_model.py && pip install -r requirements.txt

Environment variables (set in Render dashboard):
  MODEL_CNN_KERAS_URL   – URL to download best_cnn.keras if not already on disk
  MODEL_CNN_ONNX_URL    – URL to download best_cnn.onnx directly (skips conversion)
  MODEL_YOLO_ONNX_URL   – URL to download best.onnx directly (skips conversion)
  MODEL_YOLO_PT_URL     – URL to download best.pt if best.onnx is not available
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
from pathlib import Path


def _download(url: str, dest: Path) -> None:
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  Downloading {dest.name} from {url} …", flush=True)
    try:
        urllib.request.urlretrieve(url, dest)
        print(f"  Saved {dest} ({dest.stat().st_size / 1e6:.1f} MB)")
    except Exception as exc:
        print(f"  ERROR downloading {dest.name}: {exc}", file=sys.stderr)
        sys.exit(1)

CNN_KERAS  = Path("models/best_cnn.keras")
CNN_ONNX   = Path("models/best_cnn.onnx")
YOLO_PT    = Path("extracted_model/best.pt")
YOLO_ONNX  = Path("extracted_model/best.onnx")
YOLO_META  = Path("extracted_model/class_names.json")
CNN_SIZE   = 224


def convert_cnn() -> None:
    # Already converted — nothing to do
    if CNN_ONNX.exists():
        print(f"CNN ONNX already exists at {CNN_ONNX}, skipping.")
        return

    # Try downloading the ONNX directly (fastest path, no conversion needed)
    onnx_url = os.getenv("MODEL_CNN_ONNX_URL", "").strip()
    if onnx_url:
        _download(onnx_url, CNN_ONNX)
        return

    # Try downloading the Keras model so we can convert it
    if not CNN_KERAS.exists():
        keras_url = os.getenv("MODEL_CNN_KERAS_URL", "").strip()
        if keras_url:
            _download(keras_url, CNN_KERAS)
        else:
            print(
                f"ERROR: {CNN_KERAS} not found and neither MODEL_CNN_ONNX_URL "
                "nor MODEL_CNN_KERAS_URL is set.",
                file=sys.stderr,
            )
            sys.exit(1)

    print(f"Converting CNN {CNN_KERAS} → {CNN_ONNX} …")
    import tensorflow as tf   # noqa: PLC0415
    import tf2onnx             # noqa: PLC0415
    import onnx                # noqa: PLC0415

    model = tf.keras.models.load_model(str(CNN_KERAS), compile=False)
    sig = [tf.TensorSpec(shape=(None, CNN_SIZE, CNN_SIZE, 3), dtype=tf.float32, name="input")]
    onnx_model, _ = tf2onnx.convert.from_keras(model, input_signature=sig, opset=17)
    onnx.save(onnx_model, str(CNN_ONNX))
    print(f"CNN saved → {CNN_ONNX} ({CNN_ONNX.stat().st_size / 1e6:.1f} MB)")


def convert_yolo() -> None:
    # Already converted — nothing to do
    if YOLO_ONNX.exists():
        print(f"YOLO ONNX already exists at {YOLO_ONNX}, skipping.")
        return

    # Try downloading the ONNX directly
    onnx_url = os.getenv("MODEL_YOLO_ONNX_URL", "").strip()
    if onnx_url:
        _download(onnx_url, YOLO_ONNX)
        return

    # Try downloading the .pt so we can convert it
    if not YOLO_PT.exists():
        pt_url = os.getenv("MODEL_YOLO_PT_URL", "").strip()
        if pt_url:
            _download(pt_url, YOLO_PT)
        else:
            print(
                f"ERROR: {YOLO_PT} not found and neither MODEL_YOLO_ONNX_URL "
                "nor MODEL_YOLO_PT_URL is set.",
                file=sys.stderr,
            )
            sys.exit(1)

    print(f"Converting YOLO {YOLO_PT} → {YOLO_ONNX} …")
    from ultralytics import YOLO  # noqa: PLC0415

    model = YOLO(str(YOLO_PT))
    YOLO_META.write_text(json.dumps(model.names))
    model.export(format="onnx", imgsz=640, simplify=True, opset=17)

    exported = YOLO_PT.with_suffix(".onnx")
    if exported != YOLO_ONNX:
        exported.rename(YOLO_ONNX)
    print(f"YOLO saved → {YOLO_ONNX} ({YOLO_ONNX.stat().st_size / 1e6:.1f} MB)")
    print(f"Class names saved → {YOLO_META}")


if __name__ == "__main__":
    convert_cnn()
    convert_yolo()
    print("All conversions done.")
