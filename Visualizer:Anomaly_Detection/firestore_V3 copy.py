import firebase_admin
from firebase_admin import credentials, firestore
from datetime import datetime, timedelta

# ── Configuration ─────────────────────────────────────────────────────────────

SERVICE_ACCOUNT_PATH = "serviceAccountKey.json"
PROJECT_ID = "microalgaeproject-45b1f"

# Existing collection written by subscriber.py
SENSOR_COLLECTION = "sensor_readings"

# New collections written by anomaly detection V3
ANOMALY_COLLECTION = "anomaly_logs"
FORECAST_COLLECTION = "forecast_cache"

# Firestore field name for the turbidity / NTU value in sensor docs
TURBIDITY_FIELD = "turbidity"

# ─────────────────────────────────────────────────────────────────────────────

_db = None


def get_db():
    """Return a cached Firestore client, initialising Firebase Admin SDK once."""
    global _db
    if _db is None:
        if not firebase_admin._apps:
            cred = credentials.Certificate(SERVICE_ACCOUNT_PATH)
            firebase_admin.initialize_app(cred, {"projectId": PROJECT_ID})
        _db = firestore.client()
    return _db


def _parse_timestamp(ts_raw):
    """
    Normalise a Firestore Timestamp, aware datetime, or ISO string to a
    timezone-naive datetime (required by Prophet).
    """
    if ts_raw is None:
        return None
    if isinstance(ts_raw, datetime):
        return ts_raw.replace(tzinfo=None)
    # Firestore DatetimeWithNanoseconds has a .timestamp() method but is a datetime subclass
    if hasattr(ts_raw, "timestamp"):
        return datetime.utcfromtimestamp(ts_raw.timestamp())
    if isinstance(ts_raw, str):
        return datetime.fromisoformat(ts_raw.replace("Z", "+00:00")).replace(tzinfo=None)
    return ts_raw


# ── Read ──────────────────────────────────────────────────────────────────────

def get_sensor_readings(hours_back=None, limit=None):
    """
    Fetch sensor readings from Firestore ordered by timestamp ascending.

    Args:
        hours_back: Return only readings from the last N hours (None = all)
        limit:      Cap the number of documents returned

    Returns:
        List of dicts with keys:
            doc_id, timestamp (datetime, tz-naive), turbidity,
            temperature_C, pH_value, light_intensity_lux, water_level_pct
    """
    db = get_db()
    query = db.collection(SENSOR_COLLECTION).order_by(
        "timestamp", direction=firestore.Query.ASCENDING
    )

    if hours_back is not None:
        cutoff = datetime.utcnow() - timedelta(hours=hours_back)
        query = query.where("timestamp", ">=", cutoff)

    if limit is not None:
        query = query.limit(limit)

    rows = []
    for doc in query.stream():
        data = doc.to_dict()
        rows.append({
            "doc_id":             doc.id,
            "timestamp":          _parse_timestamp(data.get("timestamp")),
            "turbidity":          float(data.get(TURBIDITY_FIELD, 0.0)),
            "temperature_C":      float(data.get("temperature_C", 0.0)),
            "pH_value":           float(data.get("pH_value", 0.0)),
            "light_intensity_lux": float(data.get("light_intensity_lux", 0.0)),
            "water_level_pct":    float(data.get("water_level_pct", 0.0)),
        })

    return rows


def get_anomaly_log(limit=200):
    """
    Fetch recent anomaly log entries ordered by timestamp descending.

    Returns:
        List of dicts
    """
    db = get_db()
    docs = (
        db.collection(ANOMALY_COLLECTION)
        .order_by("timestamp", direction=firestore.Query.DESCENDING)
        .limit(limit)
        .stream()
    )
    return [doc.to_dict() for doc in docs]


def get_forecast_cache():
    """
    Fetch all cached forecast entries ordered by timestamp ascending.

    Returns:
        List of dicts with keys: timestamp, predicted_value, lower_bound, upper_bound
    """
    db = get_db()
    docs = (
        db.collection(FORECAST_COLLECTION)
        .order_by("timestamp", direction=firestore.Query.ASCENDING)
        .stream()
    )
    return [doc.to_dict() for doc in docs]


def get_latest_forecast_bounds(timestamp_dt):
    """
    Find the nearest cached forecast bounds at or before the given timestamp.
    Used for real-time anomaly classification of a single incoming reading.

    Args:
        timestamp_dt: timezone-naive datetime of the new reading

    Returns:
        Dict with lower_bound, upper_bound, predicted_value, or None if cache empty
    """
    cache = get_forecast_cache()
    if not cache:
        return None

    ts_iso = timestamp_dt.isoformat()
    # Cache timestamps are ISO strings (from Prophet get_forecast); find the latest <= ts_iso
    candidates = [e for e in cache if e.get("timestamp", "") <= ts_iso]
    if candidates:
        return candidates[-1]

    # If the reading is before all forecast entries, return the earliest one as best guess
    return cache[0]


# ── Write ─────────────────────────────────────────────────────────────────────

def write_anomaly_log(entries):
    """
    Write anomaly classification results to Firestore in batches.

    Args:
        entries: List of alert log dicts produced by detect_anomalies()
    """
    if not entries:
        return

    db = get_db()
    col = db.collection(ANOMALY_COLLECTION)

    # Firestore batch limit is 500 writes
    BATCH_SIZE = 500
    for i in range(0, len(entries), BATCH_SIZE):
        batch = db.batch()
        for entry in entries[i : i + BATCH_SIZE]:
            batch.set(col.document(), entry)
        batch.commit()

    print(f"[Firestore] Written {len(entries)} anomaly entries → '{ANOMALY_COLLECTION}'")


def write_forecast_cache(forecast_entries):
    """
    Replace the forecast cache collection with a fresh set of Prophet predictions.

    Args:
        forecast_entries: List of dicts from get_forecast() with keys:
                          timestamp, predicted_value, lower_bound, upper_bound
    """
    db = get_db()
    col = db.collection(FORECAST_COLLECTION)

    # Delete existing cache
    existing = list(col.stream())
    if existing:
        batch = db.batch()
        for doc in existing:
            batch.delete(doc.reference)
        batch.commit()

    # Write new entries
    generated_at = datetime.utcnow().isoformat()
    batch = db.batch()
    for entry in forecast_entries:
        batch.set(col.document(), {**entry, "generated_at": generated_at})
    batch.commit()

    print(f"[Firestore] Cached {len(forecast_entries)} forecast points → '{FORECAST_COLLECTION}'")
