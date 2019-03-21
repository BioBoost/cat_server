const mqtt = require('mqtt');
const Player = require('./player.js')
const Card = require('./card.js');
const Channel = require('./channel.js');

class Game {

  constructor(mqttHost, baseTopic='oop2/cat') {
    console.log("Creating game server at " + baseTopic);
    this.baseTopic = baseTopic;
    this.JOIN_TOPIC = this.baseTopic + "/join";
    this.LEAVE_TOPIC = this.baseTopic + "/leave";
    this.CHANNEL_TOPIC = this.baseTopic + "/channel";
    this.PLAYER_TOPIC = this.baseTopic + "/players";

    this.channels = {};
    this.client = mqtt.connect('mqtt://' + mqttHost);
    this.client.on('connect', () => this.handle_connected() );
  }

  handle_connected() {
    console.log("Connected to broker - Creating demo channel");
    this.channels['demo'] = new Channel('demo');        // Just for starting      
    this.client.subscribe(this.baseTopic + '/#', (err) => {
      if (!err) console.log("Subscribed successfully");
    });
    this.client.on('message', (topic, message) => this.handle_mqtt_message(topic, message) );
  }

  handle_mqtt_message(topic, message) {
    message = message.toString();
    console.log("Receiving: " + message + " @ " + topic);

    let data = JSON.parse(message);
    if (topic === this.JOIN_TOPIC) {       // { "channel": "demo", "player": "Nico" }
      this.join_channel(data.channel, data.player);
    } else if (topic === this.LEAVE_TOPIC) {  // { "channel": "demo", "player": "Nico" }
      this.leave_channel(data.channel, data.player);
    } else if (topic.startsWith(this.CHANNEL_TOPIC)) {
      console.log("Receiving channel data");
      let parts = topic.split(this.CHANNEL_TOPIC+'/').join('').split('/');
      let channel = this.channels[parts[0]];
      if (channel) {
        console.log("Receiving data for channel " + channel.get_name());
        if (parts[1] === 'playcard') {    // { "card": "Little Trump", "player": "Nico" }
          this.handle_playing_card(channel, data);
        }
      }
    }
  }

  join_channel(channelName, playerName) {
    let player = new Player(playerName);
    console.log(player.get_name() + " wants to join the channel " + channelName);
    let channel = this.channels[channelName];

    // Create channel if non-existing
    if (!channel) {
      console.log(`Creating new channel ${channelName} for player ${playerName}`);
      channel = new Channel(channelName);
      this.channels[channelName] = channel;
    }

    if (channel.add_player(player)) {
      this.publish_player_list(channel);
      this.message_player(player, JSON.stringify({ status: 'success', reason: 'joined channel ' + channel.get_name() }));
    } else {
      this.message_player(player, JSON.stringify({ status: 'failed', reason: 'channel is full or nickname in use' }));
    }
  }

  leave_channel(channelName, playerName) {
    let channel = this.channels[channelName];
    let player = channel.get_player(playerName);

    if (!channel || !player) {
      player = new Player(playerName);
      this.message_player(player, JSON.stringify({ status: 'failed', reason: 'Unknown channel or player' }));
      return;
    }
    console.log(player.get_name() + " is leaving the channel " + channelName);

    channel.remove_player(player);
    this.publish_player_list(channel);
    this.message_player(player, JSON.stringify({ status: 'success', reason: 'left channel ' + channel.get_name() }));
  }
  
  publish_player_list(channel) {
    this.client.publish(this.CHANNEL_TOPIC + "/" + channel.get_name()
      + '/players', JSON.stringify(Object.keys(channel.get_players())));
  }

  message_player(player, message) {
    this.client.publish(this.PLAYER_TOPIC + "/" + player.get_name(), message);
  }

  handle_playing_card(channel, data) {
    let player = channel.get_player(data.player);
    if (player) {
      let card = new Card(player, data.card);
      console.log(player.get_name() + " played card " + card.get_text());
      channel.add_card(card);
      this.publish_all_played_cards(channel);
    } else {
      this.message_player(new Player(data.player), JSON.stringify({ status: 'failed', reason: 'did not join the channel ' + channel.get_name() }));
    }
  }

  publish_all_played_cards(channel) {
    let output = {
      question: channel.question,
      responses: channel.get_cards().map(function(card) {
        return { player: card.owner.name, card: card.text };
      })
    };

    this.client.publish(this.CHANNEL_TOPIC + "/" + channel.get_name()
      + '/playedcards', JSON.stringify(output));
  }
}

module.exports = Game;