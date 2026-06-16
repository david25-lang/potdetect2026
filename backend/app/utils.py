from __future__ import annotations

import base64
import os

import cv2
import numpy as np
from fastapi import UploadFile


MAX_IMAGE_BYTES = int(os.getenv("MAX_IMAGE_BYTES", str(10 * 1024 * 1024)))

ACCEPTED_MIME_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/bmp",
    "image/tiff",
}


async def read_image_upload(file: UploadFile) -> np.ndarray:
    content_type = (file.content_type or "").lower().split(";")[0].strip()
    if content_type and content_type not in ACCEPTED_MIME_TYPES:
        raise ValueError(
            f"Unsupported file type '{content_type}'. "
            "Accepted formats: JPEG, PNG, WebP, BMP, TIFF."
        )

    contents = await file.read()

    if not contents:
        raise ValueError("Uploaded image is empty.")

    if len(contents) > MAX_IMAGE_BYTES:
        raise ValueError(
            f"Uploaded image is too large. Limit is {MAX_IMAGE_BYTES // (1024 * 1024)} MB."
        )

    image_array = np.frombuffer(contents, dtype=np.uint8)
    image = cv2.imdecode(image_array, cv2.IMREAD_COLOR)

    if image is None:
        raise ValueError(
            "Could not decode the image. "
            "Make sure the file is a valid JPEG, PNG, WebP, BMP, or TIFF."
        )

    return image


def encode_image_base64(image: np.ndarray, extension: str = ".jpg") -> str:
    success, encoded = cv2.imencode(extension, image)
    if not success:
        raise ValueError("Annotated image could not be encoded.")

    return base64.b64encode(encoded.tobytes()).decode("utf-8")
