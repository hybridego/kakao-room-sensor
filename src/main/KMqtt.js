const mqtt = require('mqtt')
let options = {
  host: '127.0.0.1',
  port: 1883,
  protocol: 'mqtt'
}
let mqttClient

class KMqtt {
  static init (host, port, protocol) {
    options = {host, port, protocol}
    mqttClient = mqtt.connect(options)
  }
  static KPublish (topic, message, qos) {
    mqttClient.publish(topic, message, qos)
  }
}

export default KMqtt
