import paho.mqtt.client as mqtt
import json
import random
import time
from datetime import datetime

broker = "broker.hivemq.com"
port = 1883
topic = "microalgae/sensor"

client = mqtt.Client()
client.connect(broker, port)

# Number of sensor readings
num_readings = 10

for i in range(num_readings):

    data = {
        "temperature_C": round(random.uniform(20, 30), 2),
        "pH_value": round(random.uniform(6, 9), 2),
        "light_intensity_lux": round(random.uniform(100, 800), 2),
        "water_level_pct": round(random.uniform(50, 100), 2),
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }

    message = json.dumps(data)

    client.publish(topic, message)

    print(f"Sensor Reading {i+1} Sent:", message)

    time.sleep(5)

print("Sensor simulation finished.")