import paho.mqtt.client as mqtt
import firebase_admin
from firebase_admin import credentials, firestore
import json

cred = credentials.Certificate("serviceAccountKey.json")
firebase_admin.initialize_app(cred)

db = firestore.client()

broker = "broker.hivemq.com"
port = 1883
topic = "microalgae/processed"

def on_connect(client, userdata, flags, rc):
    print("Subscriber connected")
    client.subscribe(topic)

def on_message(client, userdata, msg):

    message = msg.payload.decode()

    data = json.loads(message)

    print("Subscriber received:", data)

    db.collection("main_tank_data").add(data)

    print("Data uploaded to Firebase")

client = mqtt.Client()

client.on_connect = on_connect
client.on_message = on_message

client.connect(broker, port)

client.loop_forever()