var fs = require('fs')
  , util = require('util')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter;

var logger = require('../logger');

var steamHandler = require('./steamHandler.js');

const serversPath = path.join(__dirname, '..', 'servers.json');

class SteamChatClient extends EventEmitter {

    constructor() {
        super();

        this.Steam = require('steam');
        this.client = new this.Steam.SteamClient();
        this.user = new this.Steam.SteamUser(this.client);
        this.friends = new this.Steam.SteamFriends(this.client);

        steamHandler(this.client, this.user, this.friends);
    }

    connect() {
        fs.stat(serversPath, (err) => {
            if (!err) {
                fs.readFile(serversPath, (err, data) => {
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

module.exports = SteamChatClient;
