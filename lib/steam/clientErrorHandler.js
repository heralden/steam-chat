var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json');

var session = require('../app');

function steamErrorHandler(error) {
    if (error === "Disconnected")
        logger.log('verbose', "{red-fg}Steam %s{/red-fg}", error);
    else
        logger.log('error', "{red-fg}Steam %s{/red-fg}", error);

    this.emit('disconnected');

    for (let steamID in session.users) {
        session.users[steamID].persona_state = 'offline';
    }

    if (session.steamError.length < 1) { // not a login failure
        autoReconnect.call(this);
    }
}

function autoReconnect() {
    var max_reconnect = config.get('max_reconnect');
    var reconnect_timeout = config.get('reconnect_timeout');
    var reconnect_long_timeout = config.get('reconnect_long_timeout');

    if (session.reconnectTries < max_reconnect) {
        logger.log('verbose', doc.msg.reconnect, reconnect_timeout/1000);
        
        setTimeout(() => {
            if (!this.client.connected) {
                logger.log('verbose', doc.msg.reconectAttempt);
                session.reconnectTries++;
                this.client.connect();
            }
        }, reconnect_timeout);

    } else {
        logger.log('warn', doc.msg.reconnectLong, reconnect_long_timeout/1000*60);

        setTimeout(() => {
            if (!this.client.connected) {
                logger.log('info', doc.msg.reconnectAttempt);
                this.client.connect();
            }
        }, reconnect_long_timeout);
    }
}

module.exports = steamErrorHandler;
