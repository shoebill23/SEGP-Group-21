import json
from pathlib import Path
from datetime import datetime

from prophet_dataset_generation import load_json_data
from prophet_model import train_prophet, get_forecast
from firestore_V3 import (
    get_sensor_readings,
    get_latest_forecast_bounds,
    write_anomaly_log,
    write_forecast_cache,
)


# ── Core classifier ───────────────────────────────────────────────────────────

def classify_anomaly(value, lower, upper):
    """Classify a reading as NORMAL or ANOMALY based on Prophet confidence bounds."""
    if value < lower or value > upper:
        return "ANOMALY"
    return "NORMAL"


# ── Real-time classification ───────────────────────────────────────────────────

def classify_reading_realtime(turbidity, timestamp_dt):
    """
    Classify a single incoming reading against the cached Prophet forecast bounds.
    Call this from subscriber.py immediately after a new MQTT message lands in
    Firestore, using the cached forecast written by the last retrain.

    Args:
        turbidity:    NTU value of the new reading
        timestamp_dt: timezone-naive datetime of the reading

    Returns:
        'ANOMALY' or 'NORMAL'
    """
    bounds = get_latest_forecast_bounds(timestamp_dt)
    if bounds is None:
        return "NORMAL"
    return classify_anomaly(turbidity, bounds["lower_bound"], bounds["upper_bound"])


# ── Internal helper ────────────────────────────────────────────────────────────

def _build_alert_log(df, historical_forecast):
    """
    Build the alert log list from a Prophet-fitted DataFrame.
    Shared by both detect_anomalies() and detect_anomalies_from_firestore().
    """
    alert_log = []
    anomaly_count = 0

    for i in range(len(df)):
        actual    = float(df["y"].iloc[i])
        timestamp = df["ds"].iloc[i]
        mu        = float(df["mu"].iloc[i])
        phase     = df["phase"].iloc[i]

        expected  = float(historical_forecast["yhat"].iloc[i])
        lower     = float(historical_forecast["yhat_lower"].iloc[i])
        upper     = float(historical_forecast["yhat_upper"].iloc[i])

        status = classify_anomaly(actual, lower, upper)
        if status == "ANOMALY":
            anomaly_count += 1

        deviation     = actual - expected
        deviation_pct = (deviation / expected * 100) if expected != 0 else 0.0

        entry = {
            "timestamp":      timestamp.isoformat() if hasattr(timestamp, "isoformat") else str(timestamp),
            "actual_value":   round(actual, 4),
            "expected_value": round(expected, 4),
            "lower_bound":    round(lower, 4),
            "upper_bound":    round(upper, 4),
            "mu":             round(mu, 4),
            "phase":          phase,
            "status":         status,
            "deviation":      round(deviation, 4),
            "deviation_pct":  round(deviation_pct, 2),
        }
        alert_log.append(entry)

        if status == "ANOMALY":
            print(f"  [ANOMALY] {entry['timestamp']} | "
                  f"Actual={actual:.3f} | Expected={expected:.3f} | "
                  f"Bounds=[{lower:.3f}, {upper:.3f}] | "
                  f"Deviation={deviation_pct:+.1f}%")

    return alert_log, anomaly_count


def _build_summary(df, anomaly_count, forecast_hours, forecast):
    return {
        "total_readings":    len(df),
        "anomalies_detected": anomaly_count,
        "anomaly_rate":      round(anomaly_count / len(df) * 100, 1),
        "latest_value":      round(float(df["y"].iloc[-1]), 4),
        "latest_mu":         round(float(df["mu"].iloc[-1]), 4),
        "latest_phase":      df["phase"].iloc[-1],
        "forecast_hours":    forecast_hours,
        "forecast_points":   len(forecast),
    }


def _print_summary(summary):
    print(f"\nSummary:")
    print(f"  Total readings:  {summary['total_readings']}")
    print(f"  Anomalies:       {summary['anomalies_detected']} ({summary['anomaly_rate']}%)")
    print(f"  Latest value:    {summary['latest_value']}")
    print(f"  Latest mu:       {summary['latest_mu']}")


def _write_json(result, path):
    output_path = Path(path)
    with open(output_path, "w") as f:
        json.dump(result, f, indent=2)
    print(f"\nAlert log written to: {output_path}")


# ── Firestore mode (NEW) ───────────────────────────────────────────────────────

def detect_anomalies_from_firestore(hours_back=None, forecast_hours=48,
                                    forecast_freq="1h", alert_log_path=None):
    """
    Run anomaly detection on turbidity readings stored in Firestore.
    Trains Prophet on the stored data, classifies every historical reading,
    then writes the alert log and 48h forecast back to Firestore.

    Args:
        hours_back:      Limit to readings from the last N hours (None = all)
        forecast_hours:  How many hours ahead to forecast
        forecast_freq:   Forecast granularity (e.g. '1h', '8h')
        alert_log_path:  Optional path to also save results as a JSON file

    Returns:
        Dict with alert_log, forecast, summary
    """
    print("Fetching sensor readings from Firestore...")
    rows = get_sensor_readings(hours_back=hours_back)

    if len(rows) < 2:
        raise ValueError("Need at least 2 readings in Firestore for anomaly detection")

    # Convert to the flat list-of-dicts that load_json_data() already handles
    json_data = [
        {
            "timestamp": r["timestamp"].isoformat() if r["timestamp"] else "",
            "turbidity": r["turbidity"],
        }
        for r in rows
    ]

    df = load_json_data(json_data)
    print(f"Loaded {len(df)} readings from Firestore")
    print(f"  Time range:  {df['ds'].iloc[0]} -> {df['ds'].iloc[-1]}")
    print(f"  Value range: {df['y'].min():.3f} -> {df['y'].max():.3f}")

    print("\nTraining Prophet model...")
    model = train_prophet(df)

    print("Running anomaly classification on historical data...")
    historical_forecast = model.predict(df[["ds"]])

    alert_log, anomaly_count = _build_alert_log(df, historical_forecast)

    print(f"\nGenerating {forecast_hours}h forecast...")
    forecast = get_forecast(model, periods=forecast_hours, freq=forecast_freq)

    # Push results to Firestore
    write_anomaly_log(alert_log)
    write_forecast_cache(forecast)

    summary = _build_summary(df, anomaly_count, forecast_hours, forecast)
    _print_summary(summary)

    result = {"alert_log": alert_log, "forecast": forecast, "summary": summary}

    if alert_log_path:
        _write_json(result, alert_log_path)

    return result


# ── JSON mode — V2-compatible (unchanged interface) ────────────────────────────

def detect_anomalies(json_source, forecast_hours=48, forecast_freq="1h",
                     alert_log_path=None):
    """
    Run anomaly detection on historical JSON data using Prophet.
    Identical interface to anomaly_detection_V2.detect_anomalies().
    Results are also pushed to Firestore when reachable.

    Args:
        json_source:    JSON file path, JSON string, or list of dicts
        forecast_hours: How many hours ahead to forecast (default 48)
        forecast_freq:  Forecast granularity (default '1h')
        alert_log_path: Optional path to write alert log JSON file

    Returns:
        Dict with alert_log, forecast, summary
    """
    df = load_json_data(json_source)

    if len(df) < 2:
        raise ValueError("Need at least 2 data points for anomaly detection")

    print(f"Loaded {len(df)} readings")
    print(f"  Time range:  {df['ds'].iloc[0]} -> {df['ds'].iloc[-1]}")
    print(f"  Value range: {df['y'].min():.3f} -> {df['y'].max():.3f}")

    print("\nTraining Prophet model...")
    model = train_prophet(df)

    print("Running anomaly classification on historical data...")
    historical_forecast = model.predict(df[["ds"]])

    alert_log, anomaly_count = _build_alert_log(df, historical_forecast)

    print(f"\nGenerating {forecast_hours}h forecast...")
    forecast = get_forecast(model, periods=forecast_hours, freq=forecast_freq)

    # Push results to Firestore (non-fatal if SDK is not configured)
    try:
        write_anomaly_log(alert_log)
        write_forecast_cache(forecast)
    except Exception as e:
        print(f"[WARN] Could not write to Firestore: {e}")

    summary = _build_summary(df, anomaly_count, forecast_hours, forecast)
    _print_summary(summary)

    result = {"alert_log": alert_log, "forecast": forecast, "summary": summary}

    if alert_log_path:
        _write_json(result, alert_log_path)

    return result


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    print("=== Anomaly Detection V3 ===\n")
    print("1. Run on JSON file  (V2-compatible, also pushes to Firestore)")
    print("2. Run on Firestore sensor data")
    print()

    if len(sys.argv) > 1:
        json_file     = sys.argv[1]
        forecast_hours = int(sys.argv[2]) if len(sys.argv) > 2 else 48
        output_file   = sys.argv[3] if len(sys.argv) > 3 else "alert_log.json"
        detect_anomalies(json_file, forecast_hours=forecast_hours,
                         alert_log_path=output_file)
    else:
        choice = input("Select mode (1 or 2): ").strip()

        if choice == "2":
            hours      = input("Analyse readings from last N hours (blank = all): ").strip()
            hours_back = int(hours) if hours else None
            out        = input("Also save to file? (path or blank to skip): ").strip() or None
            detect_anomalies_from_firestore(hours_back=hours_back, alert_log_path=out)
        else:
            json_file      = input("Enter JSON data file path: ").strip()
            hours          = input("Forecast hours ahead (default 48): ").strip()
            forecast_hours = int(hours) if hours else 48
            output_file    = input("Output alert log path (default alert_log.json): ").strip()
            output_file    = output_file or "alert_log.json"
            detect_anomalies(json_file, forecast_hours=forecast_hours,
                             alert_log_path=output_file)
