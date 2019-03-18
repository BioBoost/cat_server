# Cards Against Teachers Server

This is the game server of the Cards Against Teacher game. It is a simplified version of the well-known Cards Against Humanity game.

## API

### Joining an existing channel

Before you can join a game, you need to join an existing channel.

Topic: `oop2/cat/join`

Data: `{ "channel": "demo", "player": "snarly" }`

Where `demo` is the name of the channel and `snarly` is the players nickname.

#### On Join Success

If the join was succesfull the player will be added to the list of players of the channel. The player will also be notified at the topic `oop2/cat/players/snarly` (where `snarly` is the name of the player) with a message `{"status":"success","reason":"joined channel demo"}`.

#### On Join Failure

If the join failed, the player will be notified at the topic `oop2/cat/players/snarly` (where `snarly` is the name of the player) with a message `{"status":"failed","reason":"channel is full or nickname in use"}`.

#### List of Players in a Channel

The full list of players in a channel is published at `oop2/cat/channel/demo/players` (where `demo` is the name of the channel) every time someone joins or leaves the channel.

Data: `["snarly","bios","rambo"]`

### Chatting

Each channel also has a chat topic which can be used to interact between players. Just subscribe to the topic and publish messages shown in the format below. Each message should be accompanied by the sender of the message.

Topic: `oop2/cat/channel/demo/chat`

Data: `{ "player": "snarly", "message": "Hi, where u guys all from ?" }`

### Playing a Card

After receiving a question card, each player can publish an answer card in response. This needs to happen within the given timeframe.

Topic: `oop2/cat/channel/demo/playcard`

Data:

```json
{
  "card": "Trump looks like a bloated carrot",
  "player": "snarly"
}
```

A player can only publish a single card in response to a question card. Successive attempts will be ignored.

#### List of Played Cards

In response to each player publishing a card, all played cards are published as a list.

Topic: `oop2/cat/channel/demo/playedcards`

Data:

```json
{
  "question": "Who looks like what?",
  "responses": [{
      "card": "Trump looks like a bloated carrot",
      "player": 2
    },
    {
      "card": "Kim Jong Un looks like a kiddy hero",
      "player": 4
    }
  ]
}
```

The responses each have a player id assigned to them that is only known server-side, and is randomly determined every round. So client-side, the player only knows which card he/she played him/herself.

## Development

### Setup Game Server

When deploying your own game server it is important to realize that if you do not change the default MQTT server (labict.be) or the base topic, it will interfere with the production game server.

So before setting up your own game server, please change the base topic (in `cat_server.js`) to your own personal topic. For example `test/oop2/yourname/cat`.

After that you can start the game server using a manual approach or as a docker container.

#### Manual Approach

This approach requires nodejs to be installed on your development host.

Make sure all modules are installed:

```shell
npm install
```

Start server:

```shell
npm start
```

#### Using Docker

This approach requires docker to be installed on your development host.

Build the container:

```shell
docker build -t cat-server .
```

Run it interactively:

```shell
docker run -it --rm cat-server
```