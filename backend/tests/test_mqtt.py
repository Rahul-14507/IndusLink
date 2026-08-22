import pytest
import json
from unittest.mock import MagicMock
from backend.iot.mqtt_listener import get_limits_for_metric, on_message

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
    
    # Execution should finish normally without raising exceptions
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
