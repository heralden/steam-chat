var fs = require('fs')
  , util = require('util')
  , EventEmitter = require('events').EventEmitter;

var config = require('../config')
  , logger = require('../logger');

var steamHandler = require('./steamHandler.js');

class SteamChatClient extends EventEmitter {

    constructor() {
        super();

        this.Steam = require('steam');
        this.client = new this.Steam.SteamClient();
        this.user = new this.Steam.SteamUser(this.client);
        this.friends = new this.Steam.SteamFriends(this.client);
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

            this.client.connect();
        });
    }
}

var scc = new SteamChatClient();
module.exports = scc;

steamHandler(scc.client, scc.user, scc.friends);
scc.connect();
