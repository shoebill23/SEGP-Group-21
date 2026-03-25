import paho.mqtt.client as mqtt

broker = "broker.hivemq.com"
port = 1883

sensor_topic = "microalgae/sensor"
processed_topic = "microalgae/processed"

def on_connect(client, userdata, flags, rc):
    print("Broker connected")
    client.subscribe(sensor_topic)

def on_message(client, userdata, msg):
    message = msg.payload.decode()

    print("Broker received:", message)

    client.publish(processed_topic, message)

    print("Broker forwarded data")

client = mqtt.Client()

client.on_connect = on_connect
client.on_message = on_message

client.connect(broker, port)

client.loop_forever()