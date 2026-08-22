import time
import sys
import json
import paho.mqtt.client as mqtt

BROKER = "broker.hivemq.com"
PORT = 1883

def publish_wokwi(asset_id: str, temp: float, hum: float, press: float, pot: int):
    if hasattr(mqtt, "CallbackAPIVersion"):
        client = mqtt.Client(mqtt.CallbackAPIVersion.VERSION2)
    else:
        client = mqtt.Client()
        
    topic = f"agrlink/{asset_id}/readings"
    payload = {
        "temperature": temp,
        "humidity": hum,
        "pressure": press,
        "raw_potentiometer": pot
    }
    payload_str = json.dumps(payload)
    
    print(f"Connecting to MQTT broker: {BROKER}...")
    client.connect(BROKER, PORT, 60)
    
    print(f"Publishing to topic '{topic}': {payload_str}")
    client.publish(topic, payload_str)
    
    time.sleep(1)
    client.disconnect()
    print("Wokwi telemetry published successfully.")

if __name__ == "__main__":
    asset = "agrlink-demo-001"
    temp = 24.50
    hum = 65.00
    press = 1012.34
    pot = 2300
    
    if len(sys.argv) > 1:
        asset = sys.argv[1]
    if len(sys.argv) > 2:
        temp = float(sys.argv[2])
    if len(sys.argv) > 3:
        hum = float(sys.argv[3])
    if len(sys.argv) > 4:
        press = float(sys.argv[4])
    if len(sys.argv) > 5:
        pot = int(sys.argv[5])
        
    publish_wokwi(asset, temp, hum, press, pot)
