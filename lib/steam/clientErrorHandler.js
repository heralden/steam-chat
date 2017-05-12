var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json');

var session = require('../app')
  , ui = require('./steam').uiEmitter
  , Steam = require('./steam').Steam
  , steamClient = require('./steam').steamClient;

function steamErrorHandler(error) {
    if (error === "Disconnected")
        logger.log('verbose', "{red-fg}%s{/red-fg}", error);
    else
        logger.log('error', "{red-fg}%s{/red-fg}", error);

    ui.emit('disconnected');

    var e = session.users;
    for (var steamID in e) {
        e[steamID].persona_state = Steam.EPersonaState.Offline;
    }

    if (session.steamError.length < 1) { // not a login failure
        autoReconnect();
    }
}

function autoReconnect() {
    var max_reconnect = config.get('max_reconnect');
    var reconnect_timeout = config.get('reconnect_timeout');
    var reconnect_long_timeout = config.get('reconnect_long_timeout');

    if (session.reconnectTries < max_reconnect) {
        logger.log('verbose', doc.msg.reconnect, reconnect_timeout/1000);
        
        setTimeout(() => {
            if (!steamClient.connected) {
                logger.log('verbose', doc.msg.reconectAttempt);
                session.reconnectTries++;
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

module.exports = steamErrorHandler;
