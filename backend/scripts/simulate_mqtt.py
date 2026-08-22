import time
import sys
import paho.mqtt.client as mqtt

BROKER = "broker.hivemq.com"
PORT = 1883

def publish_reading(asset_id: str, metric: str, value: float):
    # Determine client signature based on paho-mqtt version installed
    if hasattr(mqtt, "CallbackAPIVersion"):
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    else:
        client = mqtt.Client()
        
    topic = f"riskradar/{asset_id}/{metric}"
    print(f"Connecting to MQTT broker: {BROKER}...")
    client.connect(BROKER, PORT, 60)
    
    print(f"Publishing to topic '{topic}': {value}")
    client.publish(topic, str(value))
    
    # Wait briefly for delivery and disconnect
    time.sleep(1)
    client.disconnect()
    print("Telemetry published successfully.")

if __name__ == "__main__":
    asset = "BOILER-01"
    metric = "pressure"
    val = 49.5
    
    if len(sys.argv) > 1:
        asset = sys.argv[1]
    if len(sys.argv) > 2:
        metric = sys.argv[2]
    if len(sys.argv) > 3:
        try:
            val = float(sys.argv[3])
        except ValueError:
            pass
            
    publish_reading(asset, metric, val)
