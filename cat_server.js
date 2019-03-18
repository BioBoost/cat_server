const mqtt = require('mqtt');
const Player = require('./lib/player.js')
const Card = require('./lib/card.js');

// Needs to be refactored to own file
class Channel {

  constructor(name) {
    this.name = name;
    this.players = {};
    this.playedCards = [];
    this.question = "Who looks like what?";
  }

  add_player(player) {
    if (Object.keys(this.players).length < 5 && !this.players[player.get_name()]) {
      console.log("Player " + player.get_name() + " joining the channel");
      this.players[player.get_name()] = player;
      return true;
    }
    return false;
  }

  get_player(name) {
    return this.players[name];
  }

  get_players() {
    return this.players;
  }

  get_name() {
    return this.name;
  }

  add_card(card) {
    // Check if player not already played card
    if (!this.playedCards.filter( c => c.owner.name === card.owner.name ).length) {
      this.playedCards.push(card);
    } else {
      console.log("Player " + card.owner.name + " already played card");
    }
  }

  get_cards() {
    return this.playedCards;
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

    let data = JSON.parse(message);
    if (topic === this.JOIN_TOPIC) {       // { "channel": "demo", "player": "Nico" }
      this.join_channel(data.channel, data.player);
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
    if (channel) {
      if (channel.add_player(player)) {
        this.publish_player_list(channel);
        this.message_player(player, JSON.stringify({ status: 'success', reason: 'joined channel ' + channel.get_name() }));
      } else {
        this.message_player(player, JSON.stringify({ status: 'failed', reason: 'channel is full or nickname in use' }));
      }
    } else {
      this.message_player(player, JSON.stringify({ status: 'failed', reason: 'channel does not exist' }));
    }
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

let game = new Game('mqtt.labict.be');