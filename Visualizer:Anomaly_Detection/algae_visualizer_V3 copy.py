import io
import numpy as np
from datetime import datetime
import json
from pathlib import Path


NTU_CONFIG = {
    "unit":           "NTU",
    "expected_range": [0, 800],
    "healthy_max":    600,
    "max_dots":       1500,
}


# ── Simulation core ───────────────────────────────────────────────────────────

class EmpiricalAlgaeSim:
    def __init__(self, grid_size=200):
        self.grid_size = grid_size
        self.center    = np.array([grid_size / 2, grid_size / 2])
        self.config    = NTU_CONFIG
        self.unit      = "NTU"
        self.value_max = NTU_CONFIG["healthy_max"]

    def calculate_empirical_mu(self, val_now, val_prev, time_delta_hours):
        """Calculates mu based on real NTU sensor delta."""
        if val_now <= 0 or val_prev <= 0 or time_delta_hours <= 0:
            return 0.0
        return (np.log(val_now) - np.log(val_prev)) / time_delta_hours

    def generate_particle_grid(self, current_value, max_dots=None):
        """Generates (x, y) coordinates with coagulation pull based on NTU value."""
        if max_dots is None:
            max_dots = self.config["max_dots"]

        num_dots    = int(np.clip((current_value / self.value_max) * max_dots, 20, max_dots))
        particles   = np.random.uniform(0, self.grid_size, size=(num_dots, 2))
        pull_factor = np.clip(current_value / (self.value_max * 0.8), 0, 0.6)
        directions  = self.center - particles
        jitter      = np.random.uniform(0.1, 1.0, size=(num_dots, 1))
        particles  += directions * pull_factor * jitter

        return particles.round(2).tolist()

    def load_historical_data(self, json_source):
        """
        Loads historical NTU data from JSON. Parses real timestamps and computes
        actual time deltas for mu calculation.
        Same interface as V2.
        """
        if isinstance(json_source, (str, Path)):
            json_path = Path(json_source)
            if json_path.exists():
                with open(json_path, "r") as f:
                    data = json.load(f)
            else:
                data = json.loads(json_source)
        else:
            data = json_source

        if isinstance(data, dict):
            data = [data]

        processed = []
        for i, record in enumerate(data):
            value  = record.get("turbidity", record.get("ntu", 0.0))
            ts_raw = record.get("timestamp", record.get("time", None))
            if isinstance(ts_raw, str):
                ts = datetime.strptime(ts_raw, "%Y-%m-%d %H:%M:%S")
            else:
                ts = ts_raw

            mu = record.get("mu", record.get("growth_rate", None))
            if mu is None and i > 0 and processed:
                prev = processed[-1]
                if prev["timestamp"] and ts:
                    delta_h = (ts - prev["timestamp"]).total_seconds() / 3600.0
                    mu = self.calculate_empirical_mu(value, prev["value"], delta_h)
                else:
                    mu = 0.0
            elif mu is None:
                mu = 0.0

            processed.append({
                "timestamp": ts,
                "value":     float(value),
                "mu":        float(mu),
                "phase":     record.get("phase", record.get("growth_phase", "unknown")),
            })

        return processed

    def load_from_firestore(self, hours_back=None):
        """
        Load historical NTU readings from Firestore.

        Args:
            hours_back: Limit to readings from the last N hours (None = all)

        Returns:
            Same list-of-dicts format as load_historical_data()
        """
        from firestore_V3 import get_sensor_readings

        rows = get_sensor_readings(hours_back=hours_back)
        processed = []
        for r in rows:
            processed.append({
                "timestamp": r["timestamp"],
                "value":     r["turbidity"],
                "mu":        0.0,   # will be recalculated below
                "phase":     "unknown",
            })

        # Recalculate mu from actual time deltas
        for i in range(1, len(processed)):
            prev = processed[i - 1]
            curr = processed[i]
            if prev["timestamp"] and curr["timestamp"]:
                delta_h = (curr["timestamp"] - prev["timestamp"]).total_seconds() / 3600.0
                curr["mu"] = self.calculate_empirical_mu(curr["value"], prev["value"], delta_h)

        return processed

    def interpolate_between_points(self, val_start, val_end, mu_avg, num_steps):
        """Creates smooth interpolation between two readings."""
        if num_steps <= 1:
            return [val_end]

        interpolated = []
        for i in range(num_steps):
            fraction = i / (num_steps - 1)
            if val_start > 0 and val_end > 0 and val_end != val_start:
                val_interp = val_start * np.exp(np.log(val_end / val_start) * fraction)
            else:
                val_interp = val_start + (val_end - val_start) * fraction
            interpolated.append(val_interp)

        return interpolated

    def predict_future_fallback(self, val_current, mu_current, num_steps, step_hours=0.1):
        """Fallback prediction using exponential extrapolation."""
        predictions = []
        val     = val_current
        val_cap = self.config["expected_range"][1]

        for _ in range(num_steps):
            val = val * np.exp(mu_current * step_hours)
            val = min(val, val_cap)
            predictions.append(val)

        return predictions


# ── Web API helper (NEW) ───────────────────────────────────────────────────────

def render_particle_frame(ntu_value, mode="historical", dpi=100, figsize=(6, 6)):
    """
    Render a single particle frame as PNG bytes.
    Use this from a web API endpoint to serve visualisation frames without
    a display (matplotlib Agg backend — no plt.show() needed).

    Args:
        ntu_value: Current NTU sensor value
        mode:      'historical', 'anomaly', or 'prediction'
        dpi:       Image resolution
        figsize:   Figure size in inches

    Returns:
        PNG image as bytes
    """
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt

    sim       = EmpiricalAlgaeSim()
    particles = np.array(sim.generate_particle_grid(ntu_value))

    fig, ax = plt.subplots(figsize=figsize)
    ax.set_xlim(0, 200)
    ax.set_ylim(0, 200)
    ax.set_facecolor("black")
    fig.patch.set_facecolor("black")

    color_map = {
        "historical": ("green",     0.6),
        "anomaly":    ("red",       0.7),
        "prediction": ("lightblue", 0.5),
    }
    color, alpha = color_map.get(mode, ("green", 0.6))

    if len(particles) > 0:
        ax.scatter(particles[:, 0], particles[:, 1], s=8, c=color, alpha=alpha)

    ax.set_title(f"NTU={ntu_value:.1f} | {mode.upper()}", color="white", fontsize=10)
    ax.tick_params(colors="white")
    for spine in ax.spines.values():
        spine.set_edgecolor("white")

    buf = io.BytesIO()
    fig.savefig(buf, format="png", dpi=dpi, bbox_inches="tight",
                facecolor=fig.get_facecolor())
    plt.close(fig)
    buf.seek(0)
    return buf.read()


# ── Internal helpers ───────────────────────────────────────────────────────────

def _calculate_time_gap_hours(ts1, ts2):
    if ts1 and ts2:
        return (ts2 - ts1).total_seconds() / 3600.0
    return 8.0


def _build_smooth_sequence(historical_data, viz_sim, frames_per_hour,
                            prophet_forecast, predict_steps, anomaly_log):
    """Build the interpolated frame sequence from historical data and predictions."""
    anomaly_lookup = {}
    if anomaly_log:
        for entry in anomaly_log:
            anomaly_lookup[entry.get("timestamp", "")] = entry.get("status", "NORMAL")

    smooth_sequence = []

    for i in range(len(historical_data)):
        record = historical_data[i]

        if i < len(historical_data) - 1:
            next_record  = historical_data[i + 1]
            gap_hours    = _calculate_time_gap_hours(record["timestamp"], next_record["timestamp"])
            interp_steps = max(int(gap_hours * frames_per_hour), 2)
            val_values   = viz_sim.interpolate_between_points(
                record["value"], next_record["value"], record["mu"], interp_steps
            )
            ts_str     = record["timestamp"].isoformat() if record["timestamp"] else ""
            is_anomaly = anomaly_lookup.get(ts_str, "NORMAL") == "ANOMALY"

            for val in val_values[:-1]:
                smooth_sequence.append({
                    "value":     val,
                    "mu":        record["mu"],
                    "phase":     record["phase"],
                    "timestamp": record["timestamp"],
                    "mode":      "anomaly" if is_anomaly else "historical",
                })
        else:
            ts_str     = record["timestamp"].isoformat() if record["timestamp"] else ""
            is_anomaly = anomaly_lookup.get(ts_str, "NORMAL") == "ANOMALY"
            smooth_sequence.append({
                "value":     record["value"],
                "mu":        record["mu"],
                "phase":     record["phase"],
                "timestamp": record["timestamp"],
                "mode":      "anomaly" if is_anomaly else "historical",
            })

    historical_frame_count = len(smooth_sequence)

    if prophet_forecast and len(prophet_forecast) > 0:
        for pred in prophet_forecast:
            smooth_sequence.append({
                "value":     max(pred["predicted_value"], 0),
                "mu":        0.0,
                "phase":     "predicted (Prophet)",
                "timestamp": pred.get("timestamp"),
                "mode":      "prediction",
            })
        prediction_count = len(prophet_forecast)
    else:
        last = historical_data[-1]
        for pred_val in viz_sim.predict_future_fallback(
            last["value"], last["mu"], predict_steps, step_hours=0.05
        ):
            smooth_sequence.append({
                "value":     pred_val,
                "mu":        last["mu"],
                "phase":     "predicted (exponential)",
                "timestamp": None,
                "mode":      "prediction",
            })
        prediction_count = predict_steps

    return smooth_sequence, historical_frame_count, prediction_count


def _run_playback(smooth_sequence, historical_frame_count, prediction_count,
                  viz_sim, playback_speed):
    """Run the interactive matplotlib playback loop."""
    import matplotlib.pyplot as plt

    plt.ion()
    fig, ax  = plt.subplots(figsize=(8, 8))
    scatter  = ax.scatter([], [], s=10, c="green", alpha=0.6)
    ax.set_xlim(0, 200)
    ax.set_ylim(0, 200)
    ax.set_title("Algae Growth Simulation")
    total_frames = len(smooth_sequence)
    unit         = "NTU"

    try:
        for i, frame in enumerate(smooth_sequence):
            val   = frame["value"]
            mu    = frame["mu"]
            phase = frame["phase"]
            mode  = frame["mode"]

            particles = np.array(viz_sim.generate_particle_grid(val))

            if len(particles) > 0:
                scatter.set_offsets(particles)
                if mode == "prediction":
                    scatter.set_color("lightblue")
                    scatter.set_alpha(0.5)
                elif mode == "anomaly":
                    scatter.set_color("red")
                    scatter.set_alpha(0.7)
                else:
                    scatter.set_color("green")
                    scatter.set_alpha(0.6)
            else:
                scatter.set_offsets(np.empty((0, 2)))

            if mode == "prediction":
                pred_frame = i - historical_frame_count + 1
                title = (f"PREDICTED Growth (frame {i+1}/{total_frames})\n"
                         f"{unit}={val:.3f}, Phase: {phase}\n"
                         f"Projected {pred_frame}/{prediction_count} steps ahead")
            elif mode == "anomaly":
                ts_display = frame["timestamp"]
                if hasattr(ts_display, "strftime"):
                    ts_display = ts_display.strftime("%Y-%m-%d %H:%M")
                title = (f"ANOMALY DETECTED (frame {i+1}/{total_frames})\n"
                         f"{unit}={val:.3f}, mu={mu:.4f}, Phase: {phase}\n"
                         f"Time: {ts_display}")
            else:
                ts_display = frame["timestamp"]
                if hasattr(ts_display, "strftime"):
                    ts_display = ts_display.strftime("%Y-%m-%d %H:%M")
                title = (f"Historical Data (frame {i+1}/{total_frames})\n"
                         f"{unit}={val:.3f}, mu={mu:.4f}, Phase: {phase}\n"
                         f"Time: {ts_display}")

            ax.set_title(title, fontsize=10)
            plt.pause(playback_speed)

        print("\nPlayback complete!")
        plt.pause(3)

    except KeyboardInterrupt:
        print("\nPlayback stopped.")
    finally:
        plt.close()


# ── Public API ─────────────────────────────────────────────────────────────────

def visualize_historical_data(json_source, playback_speed=0.03,
                              frames_per_hour=3, predict_steps=50,
                              prophet_forecast=None, anomaly_log=None):
    """
    Visualize historical NTU data from JSON with smooth interpolation.
    Identical interface to algae_visualizer_V2.visualize_historical_data().

    Args:
        json_source:      JSON file path, JSON string, or dict/list
        playback_speed:   Delay between frames in seconds
        frames_per_hour:  Interpolation frames per hour of real time gap
        predict_steps:    Fallback prediction frames (ignored if prophet_forecast given)
        prophet_forecast: Optional Prophet forecast list from get_forecast()
        anomaly_log:      Optional anomaly alert log list for red-frame colouring
    """
    viz_sim        = EmpiricalAlgaeSim()
    historical_data = viz_sim.load_historical_data(json_source)

    if not historical_data:
        print("No data to visualize!")
        return

    smooth_sequence, historical_frame_count, prediction_count = _build_smooth_sequence(
        historical_data, viz_sim, frames_per_hour, prophet_forecast, predict_steps, anomaly_log
    )

    _print_playback_info(historical_data, smooth_sequence,
                         historical_frame_count, prediction_count,
                         prophet_forecast, anomaly_log)

    _run_playback(smooth_sequence, historical_frame_count, prediction_count,
                  viz_sim, playback_speed)


def visualize_from_firestore(hours_back=None, playback_speed=0.03,
                             frames_per_hour=3, predict_steps=50,
                             prophet_forecast=None, anomaly_log=None):
    """
    Visualize NTU readings loaded directly from Firestore.
    Automatically uses the latest cached anomaly log and Prophet forecast
    from Firestore unless overridden.

    Args:
        hours_back:       Limit to readings from the last N hours (None = all)
        playback_speed:   Delay between frames in seconds
        frames_per_hour:  Interpolation frames per hour of real time gap
        predict_steps:    Fallback prediction frames
        prophet_forecast: Override the Firestore forecast cache
        anomaly_log:      Override the Firestore anomaly log
    """
    from firestore_V3 import get_anomaly_log, get_forecast_cache

    viz_sim        = EmpiricalAlgaeSim()
    historical_data = viz_sim.load_from_firestore(hours_back=hours_back)

    if not historical_data:
        print("No data in Firestore to visualize!")
        return

    # Auto-load from Firestore if not explicitly provided
    if anomaly_log is None:
        anomaly_log = get_anomaly_log(limit=10000)

    if prophet_forecast is None:
        cached = get_forecast_cache()
        if cached:
            prophet_forecast = [{
                "timestamp":       r["timestamp"],
                "predicted_value": r["predicted_value"],
                "lower_bound":     r["lower_bound"],
                "upper_bound":     r["upper_bound"],
            } for r in cached]

    smooth_sequence, historical_frame_count, prediction_count = _build_smooth_sequence(
        historical_data, viz_sim, frames_per_hour, prophet_forecast, predict_steps, anomaly_log
    )

    _print_playback_info(historical_data, smooth_sequence,
                         historical_frame_count, prediction_count,
                         prophet_forecast, anomaly_log)

    _run_playback(smooth_sequence, historical_frame_count, prediction_count,
                  viz_sim, playback_speed)


def _print_playback_info(historical_data, smooth_sequence,
                         historical_frame_count, prediction_count,
                         prophet_forecast, anomaly_log):
    print(f"Starting smooth playback (NTU mode)...")
    print(f"  Historical: {len(historical_data)} readings -> {historical_frame_count} interpolated frames")
    print(f"  Prediction: {prediction_count} frames" +
          (" (Prophet)" if prophet_forecast else " (exponential fallback)"))
    print(f"  Total:      {len(smooth_sequence)} frames")
    if anomaly_log:
        n = sum(1 for e in anomaly_log if e.get("status") == "ANOMALY")
        print(f"  Anomalies flagged: {n}")
    print("Press Ctrl+C to stop\n")


# ── Entry point ────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import sys

    print("=== Algae Visualizer V3 (NTU) ===")
    print("1. Playback from JSON  (V2-compatible)")
    print("2. Playback from Firestore")
    print("3. Full pipeline from JSON  (anomaly detection + Prophet + visualization)")
    print("4. Full pipeline from Firestore")
    print()

    if len(sys.argv) > 1:
        json_file      = sys.argv[1]
        playback_speed = float(sys.argv[2]) if len(sys.argv) > 2 else 0.03
        visualize_historical_data(json_file, playback_speed=playback_speed)
    else:
        choice = input("Select mode (1/2/3/4): ").strip()

        if choice == "2":
            hours      = input("Load readings from last N hours (blank = all): ").strip()
            hours_back = int(hours) if hours else None
            visualize_from_firestore(hours_back=hours_back)

        elif choice == "3":
            json_file = input("Enter JSON file path: ").strip()
            print("\nRunning anomaly detection...")
            from anomaly_detection_V3 import detect_anomalies
            result = detect_anomalies(json_file, forecast_hours=48)
            print("\nStarting visualization with Prophet forecast...")
            visualize_historical_data(
                json_file,
                prophet_forecast=result["forecast"],
                anomaly_log=result["alert_log"],
            )

        elif choice == "4":
            hours      = input("Analyse readings from last N hours (blank = all): ").strip()
            hours_back = int(hours) if hours else None
            print("\nRunning anomaly detection from Firestore...")
            from anomaly_detection_V3 import detect_anomalies_from_firestore
            result = detect_anomalies_from_firestore(hours_back=hours_back, forecast_hours=48)
            print("\nStarting visualization from Firestore...")
            visualize_from_firestore(
                hours_back=hours_back,
                prophet_forecast=result["forecast"],
                anomaly_log=result["alert_log"],
            )

        else:
            json_file = input("Enter JSON file path: ").strip()
            visualize_historical_data(json_file)
