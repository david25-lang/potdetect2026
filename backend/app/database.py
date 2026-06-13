from __future__ import annotations

import os
import sqlite3
import uuid
from datetime import datetime, timezone
from pathlib import Path

_DEFAULT_DB = Path(__file__).resolve().parents[1] / "data" / "detections.db"

_DDL = """
CREATE TABLE IF NOT EXISTS scan_results (
    id              TEXT PRIMARY KEY,
    created_at      TEXT NOT NULL,
    filename        TEXT NOT NULL,
    model_type      TEXT NOT NULL,
    damage_type     TEXT NOT NULL,
    confidence      REAL NOT NULL,
    detection_count INTEGER NOT NULL DEFAULT 0,
    status          TEXT NOT NULL DEFAULT 'processed'
);
"""


def _db_path() -> Path:
    val = os.getenv("DB_PATH")
    return Path(val).expanduser().resolve() if val else _DEFAULT_DB


def _connect() -> sqlite3.Connection:
    path = _db_path()
    path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(str(path))
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    with _connect() as conn:
        conn.executescript(_DDL)
    _seed_if_empty()


def _seed_if_empty() -> None:
    with _connect() as conn:
        count = conn.execute("SELECT COUNT(*) FROM scan_results").fetchone()[0]
    if count > 0:
        return

    import random
    from datetime import timedelta

    random.seed(42)

    seed_records = [
        # (days_ago, filename, model_type, damage_type, confidence)
        (45, "highway_sector_01.jpg",   "yolo", "pothole", 0.97),
        (43, "bridge_lane_04.jpg",      "yolo", "crack",   0.89),
        (41, "arterial_road_08.jpg",    "cnn",  "crack",   0.84),
        (39, "district_road_12.mp4",    "yolo", "pothole", 0.93),
        (37, "ring_road_22.jpg",        "cnn",  "pothole", 0.91),
        (35, "highway_23.jpg",          "yolo", "crack",   0.88),
        (33, "bypass_road_05.jpg",      "cnn",  "crack",   0.76),
        (30, "inner_city_road_03.jpg",  "yolo", "pothole", 0.95),
        (28, "suburb_lane_11.jpg",      "yolo", "crack",   0.82),
        (26, "main_street_07.jpg",      "cnn",  "pothole", 0.90),
        (23, "expressway_16.jpg",       "yolo", "pothole", 0.96),
        (21, "back_road_09.jpg",        "cnn",  "crack",   0.78),
        (18, "coastal_road_14.jpg",     "yolo", "crack",   0.85),
        (16, "industrial_rd_02.jpg",    "yolo", "pothole", 0.92),
        (14, "campus_drive_06.jpg",     "cnn",  "pothole", 0.87),
        (12, "market_street_18.jpg",    "yolo", "crack",   0.80),
        (10, "north_avenue_21.jpg",     "yolo", "pothole", 0.94),
        (7,  "south_link_13.jpg",       "cnn",  "crack",   0.83),
        (4,  "east_bypass_10.jpg",      "yolo", "pothole", 0.91),
        (1,  "west_circuit_17.jpg",     "yolo", "crack",   0.86),
    ]

    now = datetime.now(timezone.utc)
    rows = []
    for i, (days_ago, filename, model_type, damage_type, confidence) in enumerate(seed_records, start=20):
        record_id = f"DET-{i:04d}"
        # scatter throughout the day so monthly trends look natural
        offset_hours = random.randint(0, 20)
        created_at = (now - timedelta(days=days_ago, hours=offset_hours)).isoformat()
        detection_count = random.randint(1, 4) if model_type == "yolo" else 1
        rows.append((record_id, created_at, filename, model_type, damage_type,
                      confidence, detection_count, "processed"))

    with _connect() as conn:
        conn.executemany(
            """
            INSERT INTO scan_results
                (id, created_at, filename, model_type, damage_type, confidence, detection_count, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            rows,
        )


# ---------------------------------------------------------------------------
# Write
# ---------------------------------------------------------------------------

def record_yolo_scan(filename: str, detections: list[dict], status: str = "processed") -> str:
    damage_type = "none"
    confidence = 0.0
    if detections:
        top = max(detections, key=lambda d: float(d.get("confidence", 0)))
        damage_type = str(top.get("class_name", "none"))
        confidence = float(top.get("confidence", 0.0))

    return _insert(filename, "yolo", damage_type, confidence, len(detections), status)


def record_cnn_scan(filename: str, result: dict, status: str = "processed") -> str:
    damage_type = str(result.get("prediction", "none"))
    confidence = float(result.get("confidence", 0.0))
    return _insert(filename, "cnn", damage_type, confidence, 1, status)


def _next_id() -> str:
    with _connect() as conn:
        row = conn.execute(
            "SELECT MAX(CAST(SUBSTR(id, 5) AS INTEGER)) FROM scan_results"
        ).fetchone()
    last = row[0] if row and row[0] is not None else 0
    return f"DET-{last + 1:04d}"


def _insert(
    filename: str,
    model_type: str,
    damage_type: str,
    confidence: float,
    detection_count: int,
    status: str,
) -> str:
    record_id = _next_id()
    created_at = datetime.now(timezone.utc).isoformat()
    with _connect() as conn:
        conn.execute(
            """
            INSERT INTO scan_results
                (id, created_at, filename, model_type, damage_type, confidence, detection_count, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (record_id, created_at, filename, model_type, damage_type, confidence, detection_count, status),
        )
    return record_id


# ---------------------------------------------------------------------------
# Read — history
# ---------------------------------------------------------------------------

def fetch_history(limit: int = 200) -> list[dict]:
    with _connect() as conn:
        rows = conn.execute(
            """
            SELECT id, created_at AS date, filename,
                   damage_type AS "damageType",
                   confidence, status
            FROM scan_results
            ORDER BY created_at DESC
            LIMIT ?
            """,
            (limit,),
        ).fetchall()
    return [dict(row) for row in rows]


# ---------------------------------------------------------------------------
# Read — analytics
# ---------------------------------------------------------------------------

def fetch_analytics() -> dict:
    with _connect() as conn:
        totals = dict(conn.execute(
            """
            SELECT
                COUNT(*)                                                 AS uploads,
                SUM(detection_count)                                     AS detections,
                SUM(CASE WHEN damage_type='pothole' THEN 1 ELSE 0 END)  AS potholes,
                SUM(CASE WHEN damage_type='crack'   THEN 1 ELSE 0 END)  AS cracks
            FROM scan_results
            WHERE status = 'processed'
            """
        ).fetchone() or {})

        trend_rows = conn.execute(
            """
            SELECT
                strftime('%Y-%m', created_at)                          AS month,
                SUM(CASE WHEN damage_type='pothole' THEN 1 ELSE 0 END) AS potholes,
                SUM(CASE WHEN damage_type='crack'   THEN 1 ELSE 0 END) AS cracks,
                ROUND(AVG(confidence) * 100, 0)                        AS accuracy
            FROM scan_results
            WHERE status = 'processed'
            GROUP BY month
            ORDER BY month
            LIMIT 12
            """
        ).fetchall()

        dist_rows = conn.execute(
            """
            SELECT damage_type AS name, COUNT(*) AS value
            FROM scan_results
            WHERE status = 'processed' AND damage_type != 'none'
            GROUP BY damage_type
            """
        ).fetchall()

    _MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    trends = []
    for row in trend_rows:
        d = dict(row)
        month_str = d.pop("month", "")
        try:
            month_num = int(month_str.split("-")[1]) - 1
            d["name"] = _MONTH_NAMES[month_num]
        except (IndexError, ValueError):
            d["name"] = month_str
        trends.append(d)
    distribution = [dict(row) for row in dist_rows]

    return {
        "trends": trends,
        "distribution": distribution,
        "totals": {
            "uploads":    int(totals.get("uploads", 0) or 0),
            "detections": int(totals.get("detections", 0) or 0),
            "potholes":   int(totals.get("potholes", 0) or 0),
            "cracks":     int(totals.get("cracks", 0) or 0),
        },
    }
