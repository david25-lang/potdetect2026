"""
Download model files from Cloudinary at Render build time.

Required environment variables (set in Render dashboard):
  CLOUDINARY_YOLO_ONNX_URL   – public URL for extracted_model/best.onnx
  CLOUDINARY_YOLO_PT_URL     – public URL for extracted_model/best.pt
  CLOUDINARY_CNN_KERAS_URL   – public URL for models/best_cnn.keras

Files already present on disk are skipped.
"""
from __future__ import annotations

import os
import sys
import urllib.request
from pathlib import Path

DOWNLOADS = [
    ("CLOUDINARY_YOLO_ONNX_URL",  Path("extracted_model/best.onnx")),
    ("CLOUDINARY_YOLO_PT_URL",    Path("extracted_model/best.pt")),
    ("CLOUDINARY_CNN_KERAS_URL",  Path("models/best_cnn.keras")),
]


def download(url: str, dest: Path) -> None:
    if dest.exists():
        print(f"  already present: {dest}")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  downloading {dest.name} …", flush=True)
    try:
        urllib.request.urlretrieve(url, dest)
        mb = dest.stat().st_size / 1_000_000
        print(f"  saved {dest} ({mb:.1f} MB)")
    except Exception as exc:
        print(f"  ERROR downloading {dest}: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    missing = False
    for env_var, dest in DOWNLOADS:
        url = os.getenv(env_var, "").strip()
        if not url:
            if not dest.exists():
                print(f"WARNING: {env_var} not set and {dest} not found.", file=sys.stderr)
                missing = True
            continue
        download(url, dest)

    if missing:
        print("Set the missing env vars or ensure model files are present.", file=sys.stderr)
        sys.exit(1)

    print("All model files ready.")
