import datetime
import logging
import threading
from typing import Tuple, Optional
import paho.mqtt.client as mqtt
from backend.app.db import get_db_connection, save_sensor_reading
from backend.engine.runner import run_scoring_pipeline

logger = logging.getLogger(__name__)

BROKER = "broker.hivemq.com"
PORT = 1883
TOPIC_PATTERN = "riskradar/+/+"

_mqtt_client = None

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
        
    # Default fallbacks
    metric_lower = metric.lower()
    if "temp" in metric_lower:
        return 20.0, 100.0
    elif "press" in metric_lower:
        return 5.0, 50.0
    elif "vib" in metric_lower:
        return 0.0, 10.0
    return None, None

def on_message(client, userdata, msg):
    try:
        # Topic pattern is riskradar/<asset_id>/<metric>
        parts = msg.topic.split("/")
        if len(parts) != 3:
            return
        
        _, asset_id, metric = parts
        asset_id = asset_id.strip().upper()
        
        payload_str = msg.payload.decode("utf-8")
        value = float(payload_str)
        
        logger.info(f"MQTT Ingestion: Received telemetry for {asset_id} -> {metric}: {value}")
        
        conn = get_db_connection()
        try:
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

def start_listener():
    global _mqtt_client
    logger.info("Initializing MQTT listener background task...")
    
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
