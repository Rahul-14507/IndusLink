import datetime
import logging
import os
import threading
from typing import Tuple, Optional
import paho.mqtt.client as mqtt
from backend.app.db import get_db_connection, save_sensor_reading
from backend.engine.runner import run_scoring_pipeline

logger = logging.getLogger(__name__)

BROKER = os.environ.get("MQTT_BROKER", "broker.hivemq.com")
PORT = int(os.environ.get("MQTT_PORT", "1883"))
TOPIC_PATTERN = os.environ.get("MQTT_TOPIC", "agrlink/+/readings")

DEFAULT_LIMITS = {
    "temperature": (15.0, 40.0),
    "humidity": (30.0, 80.0),
    "pressure": (950.0, 1050.0),
    "vibration": (0.0, 10.0)
}

def get_limits_for_metric(asset_id: str, metric: str, conn) -> Tuple[Optional[float], Optional[float]]:
    """
    Looks up standard limits for this asset and metric from previous records,
    or returns default thresholds if not seeded.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT safe_min, safe_max 
                FROM sensor_readings 
                WHERE UPPER(asset_id) = %s AND metric = %s AND safe_min IS NOT NULL 
                ORDER BY ts DESC LIMIT 1
                """,
                (asset_id.strip().upper(), metric)
            )
            res = cur.fetchone()
            if res:
                return (
                    float(res["safe_min"]) if res["safe_min"] is not None else None,
                    float(res["safe_max"]) if res["safe_max"] is not None else None
                )
    except Exception as e:
        logger.error(f"Error querying safe limits: {e}")
        
    # Centralized fallbacks
    metric_lower = metric.lower().strip()
    if metric_lower in DEFAULT_LIMITS:
        return DEFAULT_LIMITS[metric_lower]
        
    # Wildcard checks
    if "temp" in metric_lower:
        return DEFAULT_LIMITS["temperature"]
    elif "press" in metric_lower:
        return DEFAULT_LIMITS["pressure"]
    elif "hum" in metric_lower:
        return DEFAULT_LIMITS["humidity"]
    elif "vib" in metric_lower:
        return DEFAULT_LIMITS["vibration"]
        
    return None, None

def should_save_reading(asset_id: str, metric: str, value: float, conn) -> bool:
    """
    Implements deadband reporting/filtering. Returns False if the new value is identical 
    to the last recorded value and less than 5 minutes have elapsed.
    """
    try:
        with conn.cursor() as cur:
            cur.execute(
                """
                SELECT value, ts FROM sensor_readings
                WHERE UPPER(asset_id) = %s AND metric = %s
                ORDER BY ts DESC LIMIT 1
                """,
                (asset_id.strip().upper(), metric)
            )
            res = cur.fetchone()
            if res:
                last_value = float(res["value"])
                last_ts = res["ts"]
                time_delta = (datetime.datetime.now(datetime.timezone.utc) - last_ts).total_seconds()
                if abs(value - last_value) < 0.001 and time_delta < 300:
                    return False
    except Exception as e:
        logger.error(f"Error checking duplicate readings: {e}")
    return True

def on_message(client, userdata, msg):
    try:
        parts = msg.topic.split("/")
        if len(parts) != 3:
            return
        
        prefix, asset_id, suffix = parts
        if prefix.lower() not in {"agrlink", "agrilink"} or suffix.lower() != "readings":
            return
            
        asset_id = asset_id.strip().upper()
        payload_str = msg.payload.decode("utf-8")
        
        logger.info(f"MQTT Ingestion: Received telemetry payload for {asset_id}: {payload_str}")
        
        import json
        try:
            data = json.loads(payload_str)
        except ValueError as json_err:
            logger.warning(f"MQTT Ignored: Payload is not valid JSON on topic {msg.topic}: {json_err}")
            return
            
        # Parse metrics
        metrics = ["temperature", "humidity", "pressure"]
        if "raw_potentiometer" in data:
            logger.info(f"Live MQTT received debug trace: asset={asset_id} raw_potentiometer={data['raw_potentiometer']} [IGNORED]")
            
        conn = get_db_connection()
        try:
            for metric in metrics:
                if metric not in data:
                    logger.warning(f"MQTT Warning: Metric '{metric}' missing in payload from {asset_id}")
                    continue
                    
                try:
                    value = float(data[metric])
                except (ValueError, TypeError) as num_err:
                    logger.warning(f"MQTT Warning: Value for '{metric}' is not numeric ({data[metric]}): {num_err}")
                    continue
                    
                if should_save_reading(asset_id, metric, value, conn):
                    safe_min, safe_max = get_limits_for_metric(asset_id, metric, conn)
                    reading_data = {
                        "asset_id": asset_id,
                        "ts": datetime.datetime.now(datetime.timezone.utc),
                        "metric": metric,
                        "value": value,
                        "safe_min": safe_min,
                        "safe_max": safe_max,
                        "source": "live"
                    }
                    save_sensor_reading(reading_data, conn)
                    logger.info(f"MQTT Ingested: {asset_id} -> {metric}: {value} (Safe: {safe_min} - {safe_max})")
                else:
                    logger.debug(f"MQTT Ignored Duplicate: {asset_id} -> {metric}: {value}")
        finally:
            conn.close()
            
        # Trigger central scoring pipeline
        run_scoring_pipeline(asset_id)
        
    except Exception as e:
        logger.error(f"MQTT message handler failed: {e}", exc_info=True)

def on_connect(client, userdata, flags, rc, properties=None):
    logger.info(f"MQTT connected with result code: {rc}")
    client.subscribe(TOPIC_PATTERN)
    logger.info(f"MQTT Subscribed to: {TOPIC_PATTERN}")
    
    # Also subscribe to the alternate spelling for robustness
    if "agrlink" in TOPIC_PATTERN:
        alt_topic = TOPIC_PATTERN.replace("agrlink", "agrilink")
        client.subscribe(alt_topic)
        logger.info(f"MQTT Subscribed to alternate: {alt_topic}")
    elif "agrilink" in TOPIC_PATTERN:
        alt_topic = TOPIC_PATTERN.replace("agrilink", "agrlink")
        client.subscribe(alt_topic)
        logger.info(f"MQTT Subscribed to alternate: {alt_topic}")

def start_listener():
    global _mqtt_client
    logger.info("Initializing MQTT listener background task...")
    
    # Auto-provision Wokwi demo asset AGRLINK-DEMO-001 if missing
    conn = get_db_connection()
    try:
        with conn.cursor() as cur:
            logger.info("Auto-provisioning demo asset AGRLINK-DEMO-001 as boiler...")
            cur.execute(
                """
                INSERT INTO equipment (asset_id, name, type, location, install_date, criticality)
                VALUES ('AGRLINK-DEMO-001', 'Wokwi ESP32 Steam Boiler', 'boiler', 'IoT Demo Lab', CURRENT_DATE, 4)
                ON CONFLICT (asset_id) DO UPDATE 
                SET name = EXCLUDED.name, type = EXCLUDED.type, location = EXCLUDED.location
                """
            )
            conn.commit()
            logger.info("Demo asset AGRLINK-DEMO-001 provisioned successfully.")
    except Exception as e:
        logger.error(f"Failed to auto-provision demo asset: {e}")
        if conn:
            conn.rollback()
    finally:
        if conn:
            conn.close()
            
    try:
        # Determine client signature based on paho-mqtt version installed
        if hasattr(mqtt, "CallbackAPIVersion"):
            _mqtt_client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
        else:
            _mqtt_client = mqtt.Client()
            
        _mqtt_client.on_connect = on_connect
        _mqtt_client.on_message = on_message
        
        _mqtt_client.connect(BROKER, PORT, 60)
        _mqtt_client.loop_start()
        
        logger.info(f"MQTT client loop started in background thread. Broker: {BROKER}")
    except Exception as e:
        logger.error(f"Failed to start MQTT listener: {e}", exc_info=True)

def stop_listener():
    global _mqtt_client
    if _mqtt_client:
        logger.info("Stopping MQTT background client...")
        _mqtt_client.loop_stop()
        _mqtt_client.disconnect()
        logger.info("MQTT background client stopped.")
