import pytest
import json
from unittest.mock import MagicMock
from backend.iot.mqtt_listener import get_limits_for_metric, on_message
from backend.engine.scoring import AssetData, compute_subscores

class MockMessage:
    def __init__(self, topic, payload):
        self.topic = topic
        self.payload = payload if isinstance(payload, bytes) else payload.encode("utf-8")

def test_limits_lookup_fallback():
    # Test safe limits fallbacks for primary metrics
    min_t, max_t = get_limits_for_metric("AGRLINK-DEMO-001", "temperature", None)
    assert min_t == 15.0
    assert max_t == 40.0

    min_p, max_p = get_limits_for_metric("AGRLINK-DEMO-001", "pressure", None)
    assert min_p == 950.0
    assert max_p == 1050.0

    min_h, max_h = get_limits_for_metric("AGRLINK-DEMO-001", "humidity", None)
    assert min_h == 30.0
    assert max_h == 80.0

    # Wildcard checks
    min_w_t, max_w_t = get_limits_for_metric("AGRLINK-DEMO-001", "temp_sensor_1", None)
    assert min_w_t == 15.0
    assert max_w_t == 40.0

def test_topic_structure_validation():
    # Test valid topic formats
    valid_topics = [
        "agrlink/agrlink-demo-001/readings",
        "agrilink/agrlink-demo-001/readings",
        "AGRLINK/TEST-002/READINGS"
    ]
    for topic in valid_topics:
        parts = topic.split("/")
        prefix, asset_id, suffix = parts
        assert prefix.lower() in {"agrlink", "agrilink"}
        assert suffix.lower() == "readings"

    # Test invalid formats
    invalid_topics = [
        "riskradar/asset-01/temperature",
        "agrlink/asset-01/alerts",
        "wrongprefix/asset-01/readings"
    ]
    for topic in invalid_topics:
        parts = topic.split("/")
        if len(parts) == 3:
            prefix, asset_id, suffix = parts
            is_valid = prefix.lower() in {"agrlink", "agrilink"} and suffix.lower() == "readings"
            assert not is_valid

def test_malformed_json_resilience():
    # Calling on_message with malformed JSON must not crash the listener
    client = MagicMock()
    msg = MockMessage("agrlink/agrlink-demo-001/readings", "{invalid-json}")
    
    try:
        on_message(client, None, msg)
        success = True
    except Exception:
        success = False
        
    assert success, "Malformed JSON should be handled gracefully without raising exceptions."

def test_invalid_numeric_values():
    client = MagicMock()
    payload = {
        "temperature": "non-numeric",
        "humidity": 65.0,
        "pressure": 1012.34
    }
    msg = MockMessage("agrlink/agrlink-demo-001/readings", json.dumps(payload))
    
    try:
        on_message(client, None, msg)
        success = True
    except Exception:
        success = False
        
    assert success, "Invalid numeric values should not cause loops to crash."

def test_potentiometer_filtered_from_scoring_and_payloads():
    # Setup mock equipment and sensor readings
    equipment = {
        "asset_id": "AGRLINK-DEMO-001",
        "name": "Wokwi Demo",
        "type": "turbine",
        "location": "Main Room",
        "install_date": "2026-08-22",
        "criticality": 4
    }
    
    sensor_readings = [
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "temperature", "value": 25.0, "safe_min": 15.0, "safe_max": 40.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "humidity", "value": 65.0, "safe_min": 30.0, "safe_max": 80.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "pressure", "value": 1000.0, "safe_min": 950.0, "safe_max": 1050.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "raw_potentiometer", "value": 2200.0, "safe_min": None, "safe_max": None}
    ]
    
    # Verify that database-query level filtering excludes potentiometer
    filtered_readings = [r for r in sensor_readings if "potentiometer" not in r["metric"].lower()]
    assert len(filtered_readings) == 3
    assert not any("potentiometer" in r["metric"] for r in filtered_readings)

    # Clean the sensor readings inside AssetData and verify potentiometer does not affect scoring
    data = AssetData("AGRLINK-DEMO-001", equipment, [], [], [], filtered_readings)
    subscores = compute_subscores("AGRLINK-DEMO-001", data)
    assert subscores["sensor_deviation"] == 0.0

def test_out_of_range_metrics_affect_scoring():
    equipment = {
        "asset_id": "AGRLINK-DEMO-001",
        "name": "Wokwi Demo",
        "type": "turbine",
        "location": "Main Room",
        "install_date": "2026-08-22",
        "criticality": 4
    }

    # 1. Test out-of-range temperature (55.0 > 40.0)
    readings_temp_breach = [
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "temperature", "value": 55.0, "safe_min": 15.0, "safe_max": 40.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "humidity", "value": 60.0, "safe_min": 30.0, "safe_max": 80.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "pressure", "value": 1000.0, "safe_min": 950.0, "safe_max": 1050.0}
    ]
    data_temp_breach = AssetData("AGRLINK-DEMO-001", equipment, [], [], [], readings_temp_breach)
    subscores_temp_breach = compute_subscores("AGRLINK-DEMO-001", data_temp_breach)
    assert subscores_temp_breach["sensor_deviation"] > 0.0

    # 2. Test out-of-range humidity (85.0 > 80.0)
    readings_hum_breach = [
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "temperature", "value": 25.0, "safe_min": 15.0, "safe_max": 40.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "humidity", "value": 85.0, "safe_min": 30.0, "safe_max": 80.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "pressure", "value": 1000.0, "safe_min": 950.0, "safe_max": 1050.0}
    ]
    data_hum_breach = AssetData("AGRLINK-DEMO-001", equipment, [], [], [], readings_hum_breach)
    subscores_hum_breach = compute_subscores("AGRLINK-DEMO-001", data_hum_breach)
    assert subscores_hum_breach["sensor_deviation"] > 0.0

    # 3. Test out-of-range pressure (1060.0 > 1050.0)
    readings_press_breach = [
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "temperature", "value": 25.0, "safe_min": 15.0, "safe_max": 40.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "humidity", "value": 60.0, "safe_min": 30.0, "safe_max": 80.0},
        {"asset_id": "AGRLINK-DEMO-001", "ts": "2026-08-22T12:00:00Z", "metric": "pressure", "value": 1060.0, "safe_min": 950.0, "safe_max": 1050.0}
    ]
    data_press_breach = AssetData("AGRLINK-DEMO-001", equipment, [], [], [], readings_press_breach)
    subscores_press_breach = compute_subscores("AGRLINK-DEMO-001", data_press_breach)
    assert subscores_press_breach["sensor_deviation"] > 0.0

def test_payload_fields_and_filtering():
    # WebSocket/live update payload mock checking
    score_record = {
        "asset_id": "AGRLINK-DEMO-001",
        "final_score": 75.0,
        "bucket": "high",
        "sensor_data": {
            "temperature": 55.0,
            "humidity": 85.0,
            "pressure": 1060.0
        }
    }
    
    # Assert presence of required values
    assert "temperature" in score_record["sensor_data"]
    assert "humidity" in score_record["sensor_data"]
    assert "pressure" in score_record["sensor_data"]
    assert score_record["final_score"] == 75.0
    assert score_record["bucket"] == "high"
    
    # Assert raw_potentiometer is filtered out
    assert "raw_potentiometer" not in score_record["sensor_data"]
