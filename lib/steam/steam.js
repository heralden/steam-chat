var fs = require('fs')
  , EventEmitter = require('events');

var config = require('../config')
  , logger = require('../logger');

var steamHandler = require('./steamHandler.js');

class UiEmitter extends EventEmitter {}

class SteamChatClient {

    constructor() {
        this.uiEmitter = new UiEmitter();

        this.Steam = require('steam');
        this.steamClient = new this.Steam.SteamClient();
        this.steamUser = new this.Steam.SteamUser(this.steamClient);
        this.steamFriends = new this.Steam.SteamFriends(this.steamClient);
    }

    connect() {
        fs.stat('../servers.json', (err) => {
            if (!err) {
                fs.readFile('../servers.json', (err, data) => {
                    if (err) logger.log('error', err);
                    else this.Steam.servers = JSON.parse(data);
                });
            } else if (err.code != "ENOENT") {
                logger.log('error', err);
            }

            this.steamClient.connect();
        });
    }
}

var scc = new SteamChatClient();
module.exports = scc;

steamHandler(scc.steamClient, scc.steamUser, scc.steamFriends);
scc.connect();
