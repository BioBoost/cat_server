class Card {
  constructor(owner, text) {
    this.owner = owner;
    this.text = text;
  }

  get_owner() {
    return this.owner;
  }

  get_text() {
    return this.text;
  }
}

module.exports = Card;