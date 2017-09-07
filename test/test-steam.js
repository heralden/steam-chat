var logger = require('../lib/logger');

var SteamChatClient = require('../lib/steam/steam');

logger.transports.console.level = 'debug';

var steam = new SteamChatClient();
steam.connect();
