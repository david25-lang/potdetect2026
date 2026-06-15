"""
Download pre-built ONNX model files from GitHub Releases at Render build time.

Set these environment variables in the Render dashboard:
  MODEL_YOLO_ONNX_URL   – URL for extracted_model/best.onnx  (YOLO)
  MODEL_CNN_ONNX_URL    – URL for models/best_cnn.onnx        (CNN)

Example (GitHub Release):
  https://github.com/YOUR_USER/YOUR_REPO/releases/download/v1.0-models/best.onnx

Files already present on disk are skipped.
"""
from __future__ import annotations

import os
import sys
import urllib.request
from pathlib import Path

DOWNLOADS = [
    ("MODEL_YOLO_ONNX_URL", Path("extracted_model/best.onnx")),
    ("MODEL_CNN_ONNX_URL",  Path("models/best_cnn.onnx")),
]


def download(url: str, dest: Path) -> None:
    if dest.exists():
        print(f"  already present: {dest}")
        return
    dest.parent.mkdir(parents=True, exist_ok=True)
    print(f"  downloading {dest.name} ...", flush=True)
    try:
        urllib.request.urlretrieve(url, dest)
        mb = dest.stat().st_size / 1_000_000
        print(f"  saved {dest} ({mb:.1f} MB)")
    except Exception as exc:
        print(f"  ERROR: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    any_missing = False
    for env_var, dest in DOWNLOADS:
        url = os.getenv(env_var, "").strip()
        if not url:
            if not dest.exists():
                print(f"WARNING: {env_var} is not set and {dest} is missing.", file=sys.stderr)
                any_missing = True
            else:
                print(f"  skipping {dest.name} (already on disk)")
        else:
            download(url, dest)

    if any_missing:
        sys.exit(1)

    print("All model files ready.")
