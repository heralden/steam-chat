var fs = require('fs')
  , path = require('path')
  , EventEmitter = require('events').EventEmitter;

var logger = require('../logger')
  , doc = require('../doc.json');

var steamHandler = require('./steamHandler.js');

const serversPath = path.join(__dirname, '..', 'servers.json');

class SteamChatClient extends EventEmitter {

    constructor() {
        super();

        this.Steam = require('steam');
        this.client = new this.Steam.SteamClient();
        this.user = new this.Steam.SteamUser(this.client);
        this.friends = new this.Steam.SteamFriends(this.client);

        steamHandler.call(this);
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

            logger.log('info', doc.msg.connecting);
            this.client.connect();
        });
    }
}

module.exports = SteamChatClient;
