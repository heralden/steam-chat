var logger = require('../logger.js');
var config = require('../config.js');
var doc = require('../doc.json');

var ui = require('../ui/ui.js');

var Steam = require('./steam.js').Steam;
var steamClient = require('./steam.js').steamClient;
var session = require('./steam.js').session;

module.exports = steamErrorHandler;

function steamErrorHandler(error) {
    logger.log('error', "{red-fg}%s{/red-fg}", error);

    ui.disconnected();

    var e = session.users;
    for (var steamID in e) {
        e[steamID].persona_state = Steam.EPersonaState.Offline;
    }

    if (session.steam_error.length < 1) { // not a login failure
        autoReconnect();
    }
}

function autoReconnect() {
    var max_reconnect = config.get('max_reconnect');
    var reconnect_timeout = config.get('reconnect_timeout');
    var reconnect_long_timeout = config.get('reconnect_long_timeout');

    if (session.reconnect_tries < max_reconnect) {
        logger.log('warn', doc.msg.reconnect, reconnect_timeout/1000);
        
        setTimeout(() => {
            if (!steamClient.connected) {
                logger.log('info', doc.msg.reconectAttempt);
                session.reconnect_tries++;
                steamClient.connect();
            }
        }, reconnect_timeout);

    } else {
        logger.log('warn', doc.msg.reconnectLong, reconnect_long_timeout/1000*60);

        setTimeout(() => {
            if (!steamClient.connected) {
                logger.log('info', doc.msg.reconnectAttempt);
                steamClient.connect();
            }
        }, reconnect_long_timeout);
    }
}
