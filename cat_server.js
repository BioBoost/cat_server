const mqtt = require('mqtt');
const client  = mqtt.connect('mqtt://mqtt.labict.be');

// Needs to be refactored to own file
class Channel {
  constructor(mqttClient, channelName) {
    this.mqttClient = mqttClient;
    this.channelName = channelName;
    this.players = [];
    this.subscribe();
  }

  subscribe() {
    this.mqttClient.subscribe('oop2/cat/channel/' + this.channelName + '/#', (err) => {
      if (!err) console.log("Subscribed");
    });
  }

  handle_message(topic, message) {
    if (topic === 'oop2/cat/channel/' + this.channelName + '/join') {
      this.add_player(message);
    }
  }

  add_player(playername) {
    console.log("Player " + playername + " joining the channel");
    this.players.push(playername);
    this.mqttClient.publish('oop2/cat/channel/' + this.channelName + '/players', JSON.stringify(this.players));
  }
}

let channels = []

client.on('connect', function () {
  console.log("Connected to broker");
  channels.push(new Channel(client, 'demo'));
});
 
client.on('message', function (topic, message) {
  // message is Buffer
  console.log(message.toString());

  if (topic.startsWith("oop2/cat/channel/demo")) {
    channels[0].handle_message(topic, message.toString());
  }
});