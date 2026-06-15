# Road Defect Detection System

A full-stack road damage detection platform combining two complementary AI models — a **YOLO object detector** for bounding-box localisation and a **CNN binary classifier** for defect type confirmation — served through a FastAPI backend with a SQLite analytics store.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [YOLO Training Pipeline (Google Colab)](#yolo-training-pipeline)
   - [Dataset Extraction](#dataset-extraction)
   - [Dataset Cleaning](#dataset-cleaning)
   - [Dataset Preparation for YOLO](#dataset-preparation-for-yolo)
   - [YOLOv8 Model Training](#yolov8-model-training)
   - [Model Prediction](#model-prediction)
3. [CNN Training Pipeline (Google Colab)](#cnn-training-pipeline)
   - [Dataset Preparation](#dataset-preparation)
   - [Model Architecture](#model-architecture)
   - [Training Configuration](#training-configuration)
   - [Evaluation Results](#evaluation-results)
4. [Backend Architecture](#backend-architecture)
   - [API Endpoints](#api-endpoints)
   - [Model Loading Strategy](#model-loading-strategy)
   - [Database & Analytics](#database--analytics)
5. [Project Structure](#project-structure)
6. [Local Development](#local-development)
7. [Production Deployment (Render)](#production-deployment-render)
8. [Environment Variables](#environment-variables)

---

## Project Overview

The system detects two classes of road damage:

| Class | Description |
|-------|-------------|
| `pothole` | Depressions or holes in the road surface |
| `crack` | Surface fractures and fissures |

Two models serve different purposes:

- **YOLO (ONNX)** — `POST /predict-annotated/` — draws bounding boxes, returns coordinates and confidence per detection.
- **CNN (ResNet50, ONNX)** — `POST /classify` — classifies the dominant defect type in a whole image and returns per-class probabilities.

---

## YOLO Training Pipeline

The YOLOv8 model was trained in Google Colab using the Ultralytics library. The pipeline goes through four stages: dataset extraction, cleaning, YOLO-format preparation, and training.

### Dataset Extraction

The raw dataset is stored as a ZIP archive in Google Drive and extracted at the start of the notebook:

```python
zip_path    = "/content/drive/MyDrive/yolo_project/dataset.zip"
extract_path = "/content/drive/MyDrive/Datasets/New_Dataset"

with zipfile.ZipFile(zip_path, 'r') as zip_ref:
    zip_ref.extractall(extract_path)
```

The archive expands into a `dataset/classes/` directory containing per-class sub-folders, each holding `images/` and `labels/txt/` directories.

### Dataset Cleaning

Before training, the raw data is filtered to keep only `pothole` and `cracks` classes and to remove invalid samples. Three types of bad samples are discarded:

| Problem | Action |
|---------|--------|
| Label file missing | Skip image |
| Label file empty (0 bytes) | Skip image |
| Corrupt / unreadable image | Skip image (checked via `PIL.Image.verify()`) |

A second validation pass checks every retained label for YOLO format correctness:
- Exactly 5 values per line (`class_id x_center y_center width height`)
- `class_id` must be 0 or 1 (pothole / crack)
- Bounding box values must be normalised (0.0–1.0)

Any image-label pair that fails these checks is deleted from disk before the split step.

Clean output structure:
```
Clean_Pothole_Crack_Dataset/
  pothole/
    images/   ← valid pothole images
    labels/   ← matching YOLO .txt files
  cracks/
    images/   ← valid crack images
    labels/   ← matching YOLO .txt files
```

### Dataset Preparation for YOLO

All cleaned images and labels are first consolidated into a single temporary directory, then split 80 / 10 / 10 into train, validation, and test sets:

```python
random.seed(42)
n          = len(images)
train_end  = int(0.8 * n)   # 80 % train
val_end    = int(0.9 * n)   # 10 % val
# remainder  → 10 % test
```

Final YOLO directory layout:
```
RoadDamage_YOLO/
  images/
    train/   val/   test/
  labels/
    train/   val/   test/
  data.yaml
```

`data.yaml` class mapping:
```yaml
names:
  0: pothole
  1: crack
```

### YOLOv8 Model Training

Base model: **YOLOv8m** (medium) pretrained on COCO (`yolov8m.pt`).

```python
model = YOLO("yolov8m.pt")
results = model.train(
    data   = ".../RoadDamage_YOLO/data.yaml",
    epochs = 150,
    imgsz  = 640,
    batch  = 16,
    ...
)
```

Full hyperparameter configuration:

| Parameter | Value | Notes |
|-----------|-------|-------|
| Base model | YOLOv8m | Pretrained on COCO |
| Input size | 640 × 640 | |
| Batch size | 16 | |
| Max epochs | 150 | |
| Optimizer | AdamW | |
| Initial LR (`lr0`) | 0.0005 | |
| Weight decay | 0.0005 | |
| Early stopping patience | 30 epochs | |

**Augmentation (applied during training):**

| Augmentation | Value |
|--------------|-------|
| HSV hue shift | 0.015 |
| HSV saturation | 0.5 |
| HSV value | 0.3 |
| Rotation | ±5° |
| Translation | 0.1 |
| Scale | 0.3 |
| Horizontal flip | 0.5 |
| Mosaic | 0.5 |
| MixUp | 0.1 |

Best weights are saved automatically to:
```
YOLO_Training/road_damage_v1/weights/best.pt
```

### Model Prediction

After training, the best checkpoint is loaded for inference:

```python
model = YOLO(".../road_damage_v1/weights/best.pt")

# Batch prediction on validation set
model.predict(source=".../images/val", save=True, conf=0.25)

# Single image
model.predict(source="path/to/image.jpg", conf=0.25, save=True)
```

The trained `best.pt` is then **converted to ONNX** (`convert_model.py`) and deployed to the backend, eliminating the Ultralytics/PyTorch runtime dependency in production.

---

## CNN Training Pipeline

The CNN was trained in Google Colab using TensorFlow/Keras. The full pipeline is documented below.

### Dataset Preparation

**Source:** A zipped dataset stored in Google Drive (`yolo_project/dataset.zip`) containing images organised by class under a `classes/` directory.

**Step 1 — Extract:**
```python
zip_path = "/content/drive/MyDrive/yolo_project/dataset.zip"
extract_path = "/content/drive/MyDrive/cnn_project/extracted_dataset"
zipfile.ZipFile(zip_path).extractall(extract_path)
```

**Step 2 — Copy relevant classes:**  
Only `pothole` and `cracks` images are copied from the raw extraction into a clean `cnn_dataset/` folder:
```
cnn_dataset/
  pothole/   ← all pothole images
  cracks/    ← all crack images
```

**Step 3 — Train / Validation / Test split (70 / 15 / 15):**
```python
train_imgs, temp  = train_test_split(images, test_size=0.30, random_state=42)
val_imgs, test_imgs = train_test_split(temp,  test_size=0.50, random_state=42)
```

Final layout:
```
cnn_split/
  train/pothole/   train/cracks/
  val/pothole/     val/cracks/
  test/pothole/    test/cracks/
```

### Model Architecture

Transfer learning on **ResNet50** pretrained on ImageNet:

```
ResNet50 (frozen, imagenet weights, no top)
    └── GlobalAveragePooling2D
    └── Dense(256, activation='relu')
    └── Dropout(0.5)
    └── Dense(1, activation='sigmoid')   ← binary output: pothole probability
```

- Base model weights are **frozen** during initial training so only the custom head is learned.
- Binary sigmoid output: `p > 0.5` → pothole, otherwise crack.

### Training Configuration

| Parameter | Value |
|-----------|-------|
| Input size | 224 × 224 |
| Batch size | 16 |
| Optimizer | Adam (lr = 1e-3) |
| Loss | Binary cross-entropy |
| Max epochs | 30 |
| Early stopping patience | 8 epochs (monitors `val_loss`) |
| LR reduction patience | 4 epochs (factor 0.2, min 1e-6) |
| Best model saved by | `val_accuracy` |

**Data augmentation (training only):**
- Rotation ±20°
- Zoom ±20%
- Width / height shift ±20%
- Horizontal flip

**Class weighting:** `sklearn.utils.class_weight.compute_class_weight('balanced', ...)` is applied to handle class imbalance.

### Evaluation Results

After training, the best checkpoint (`best_cnn.keras`) is loaded and evaluated:

```python
test_loss, test_acc = best_model.evaluate(test_generator)
```

Evaluation output includes:
- **Test accuracy** and **test loss**
- **Classification report** — precision, recall, F1-score per class
- **Confusion matrix** — visualised with matplotlib

Training history (accuracy, loss, val_accuracy, val_loss, learning rate per epoch) is saved to `training_history.csv` for offline analysis.

---

## Backend Architecture

The backend is a **FastAPI** application (`backend/app/main.py`) that loads both models at startup and exposes REST endpoints.

```
backend/
  app/
    main.py        ← FastAPI app, CORS, lifespan startup
    cnn.py         ← CNNClassifier (ONNX → Keras fallback)
    model.py       ← YOLODetector (ONNX → ultralytics .pt fallback)
    database.py    ← SQLite helpers (init, record, fetch)
    utils.py       ← image decoding, base64 encoding
  models/
    best_cnn.onnx  ← production CNN model (downloaded at build time)
    best_cnn.keras ← local dev fallback (not committed)
  extracted_model/
    best.onnx      ← production YOLO model (downloaded at build time)
    best.pt        ← local dev fallback
    class_names.json
  data/
    detections.db  ← SQLite database
  download_models.py  ← Render build-time model downloader
  requirements.txt
  render.yaml
```

### API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/predict/` | YOLO inference — returns detections (no image) |
| `POST` | `/predict-annotated/` | YOLO inference — returns detections + base64 annotated JPEG |
| `POST` | `/classify` | CNN classification — returns `prediction`, `confidence`, `probabilities` |
| `GET` | `/history` | Scan history from SQLite (latest 200 by default, `?limit=N`) |
| `GET` | `/analytics` | Aggregated totals, monthly trends, damage distribution |

**`POST /predict-annotated/` query params:**
- `confidence` (float, 0–1, default 0.25) — detection confidence threshold
- `iou` (float, 0–1, default 0.45) — NMS IoU threshold

**`POST /classify` response:**
```json
{
  "prediction": "pothole",
  "confidence": 0.923456,
  "probabilities": {
    "crack": 0.076544,
    "pothole": 0.923456
  }
}
```

### Model Loading Strategy

Both `YOLODetector` and `CNNClassifier` use the same two-tier loading pattern:

1. **ONNX first (production):** `onnxruntime.InferenceSession` with CPU provider. Fast, no torch/TensorFlow required at runtime.
2. **Framework fallback (local dev):** Keras/TensorFlow (`best_cnn.keras`) or Ultralytics (`best.pt`) when the ONNX file is absent.

**CNN preprocessing** mirrors ResNet50's Caffe-style preprocessing (ImageNet BGR channel means subtracted, 0–255 scale — not divided by 255):
```
B -= 103.939   G -= 116.779   R -= 123.68
```

**YOLO post-processing:** Raw ONNX output `(1, 4+classes, anchors)` is transposed, filtered by confidence, then passed through `cv2.dnn.NMSBoxes` for non-maximum suppression. Bounding boxes are scaled back to original image dimensions.

### Database & Analytics

SQLite at `backend/data/detections.db`. Single table:

```sql
CREATE TABLE scan_results (
    id              TEXT PRIMARY KEY,   -- DET-0001, DET-0002, …
    created_at      TEXT NOT NULL,      -- ISO-8601 UTC
    filename        TEXT NOT NULL,
    model_type      TEXT NOT NULL,      -- 'yolo' | 'cnn'
    damage_type     TEXT NOT NULL,      -- 'pothole' | 'crack' | 'none'
    confidence      REAL NOT NULL,
    detection_count INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'processed'
);
```

On first startup with an empty database, 20 historical seed records (spread over the past 45 days) are inserted automatically so the analytics dashboard has data to display.

`GET /analytics` returns:
```json
{
  "totals":       { "uploads": 40, "detections": 62, "potholes": 22, "cracks": 18 },
  "trends":       [ { "name": "May", "potholes": 5, "cracks": 3, "accuracy": 89 }, … ],
  "distribution": [ { "name": "pothole", "value": 22 }, { "name": "crack", "value": 18 } ]
}
```

---

## Project Structure

```
finalproject2026/
  backend/        ← FastAPI + AI inference (this repo)
  frontend/       ← React/Next.js dashboard
  render.yaml     ← Render deployment config
```

---

## Local Development

```bash
# 1. Python environment
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt

# 2. Place model files (choose one option per model)
#    CNN  → backend/models/best_cnn.onnx  (or best_cnn.keras for Keras fallback)
#    YOLO → backend/extracted_model/best.onnx  (or best.pt for ultralytics fallback)

# 3. Run
uvicorn app.main:app --reload --port 8000
```

Interactive API docs available at `http://localhost:8000/docs`.

To convert a trained `.keras` model to ONNX for production:
```bash
python convert_model.py
```

---

## Production Deployment (Render)

Configured via `render.yaml`:

- **Build command:** `python download_models.py && pip install -r requirements.txt`
- **Start command:** `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

`download_models.py` fetches ONNX files from GitHub Releases URLs at build time, skipping any file already on disk.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `MODEL_YOLO_ONNX_URL` | Production | URL to download `best.onnx` (YOLO) |
| `MODEL_CNN_ONNX_URL` | Production | URL to download `best_cnn.onnx` (CNN) |
| `CNN_MODEL_PATH` | Optional | Override path to CNN ONNX file |
| `CNN_KERAS_PATH` | Optional | Override path to CNN Keras file |
| `YOLO_MODEL_PATH` | Optional | Override path to YOLO ONNX file |
| `YOLO_PT_PATH` | Optional | Override path to YOLO `.pt` file |
| `YOLO_META_PATH` | Optional | Override path to `class_names.json` |
| `DB_PATH` | Optional | Override SQLite database path |
| `CNN_INPUT_SIZE` | Optional | CNN input resolution (default: `224`) |
