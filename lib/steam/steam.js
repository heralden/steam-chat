var fs = require('fs');

var config = require('../config.js');
var logger = require('../logger.js');

var steamHandler = require('./steamHandler.js');

class SteamChatClient {

    constructor() {
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
