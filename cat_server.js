const mqtt = require('mqtt');

class Player {
  constructor(name) {
    this.name = name;
  }

  get_name() {
    return this.name;
  }
}

// Needs to be refactored to own file
class Channel {

  constructor(name) {
    this.name = name;
    this.players = {};
  }

  add_player(player) {
    if (Object.keys(this.players).length < 5 && !this.players[player.get_name()]) {
      console.log("Player " + player.get_name() + " joining the channel");
      this.players[player.get_name()] = player;
      return true;
    }
    return false;
  }

  get_players() {
    return this.players;
  }

  get_name() {
    return this.name;
  }
}

class Game {

  constructor(mqttHost) {
    console.log("Creating game server");
    this.BASE_TOPIC = "oop2/cat";
    this.JOIN_TOPIC = this.BASE_TOPIC + "/join";
    this.CHANNEL_TOPIC = this.BASE_TOPIC + "/channel";
    this.PLAYER_TOPIC = this.BASE_TOPIC + "/players";

    this.channels = {};
    this.client = mqtt.connect('mqtt://' + mqttHost);
    this.client.on('connect', () => this.handle_connected() );
  }

  handle_connected() {
    console.log("Connected to broker - Creating demo channel");
    this.channels['demo'] = new Channel('demo');        // Just for starting      
    this.client.subscribe(this.BASE_TOPIC + '/#', (err) => {
      if (!err) console.log("Subscribed successfully");
    });
    this.client.on('message', (topic, message) => this.handle_mqtt_message(topic, message) );
  }

  handle_mqtt_message(topic, message) {
    message = message.toString();
    console.log("Receiving: " + message + " @ " + topic);

    if (topic === this.JOIN_TOPIC) {
      let joinRequest = JSON.parse(message);   // { "channel": "demo", "player": "Nico" }
      this.join_channel(joinRequest.channel, joinRequest.player);
    }
  }

  join_channel(channelName, playerName) {
    console.log(playerName + " wants to join the channel " + channelName);
    let channel = this.channels[channelName];
    if (channel) {
      if (channel.add_player(new Player(playerName))) {
        this.publish_player_list(channel);
        this.client.publish(this.PLAYER_TOPIC + "/" + playerName, JSON.stringify({ status: 'success'}));
      } else {
        this.client.publish(this.PLAYER_TOPIC + "/" + playerName, JSON.stringify({ status: 'failed', reason: 'channel is full or nickname in use'}));
      }
    } else {
      this.client.publish(this.PLAYER_TOPIC + "/" + playerName, JSON.stringify({ status: 'failed', reason: 'channel does not exist'}));
    }
  }
  
  publish_player_list(channel) {
    this.client.publish(this.CHANNEL_TOPIC + "/" + channel.get_name()
      + '/players', JSON.stringify(Object.keys(channel.get_players())));
  }
}

let game = new Game('mqtt.labict.be');