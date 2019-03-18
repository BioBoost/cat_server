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

  remove_player(player) {
    delete this.players[player.get_name()];
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

module.exports = Channel;