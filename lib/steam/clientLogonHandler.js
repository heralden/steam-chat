var logger = require('../logger.js');
var config = require('../config.js');
var doc = require('../doc.json');

var ui = require('../ui/ui.js');

var Steam = require('./steam.js').Steam;
var steamClient = require('./steam.js').steamClient;
var steamFriends = require('./steam.js').steamFriends;
var session = require('./steam.js').session;

module.exports = logonRes;

function logonRes(logonResp) {
    if (logonResp.eresult == Steam.EResult.OK) {
        loginAccepted();
    } else if (logonResp.eresult == Steam.EResult.AccountLogonDenied) {
        loginDenied();
    } else if (logonResp.eresult == Steam.EResult.InvalidLoginAuthCode) {
        logger.log('error', doc.err.invalidCode);
        config.set('guardcode', "");
    } else if (logonResp.eresult == Steam.EResult.InvalidPassword) {
        logger.log('error', doc.err.loginTimeout);
    } else {
        loginOther(logonResp);
    }
}

function loginAccepted() {
    session.steamID = steamClient.steamID;

    ui.connected();
    logger.log('info', "Logged in!");

    if (session.away)
        steamFriends.setPersonaState(Steam.EPersonaState.Away);
    else
        steamFriends.setPersonaState(Steam.EPersonaState.Online);

    ui.rejoinGroupChats();
    ui.autojoinGroupChats();
}

function loginDenied() {
    logger.log('error', doc.err.steamGuard);
    session.steam_error = 'AccountLogonDenied';
    config.set('sentryauth', false);
}

function loginOther(logonResp) {
    for (var errmsg in Steam.EResult) {
        if (Steam.EResult[errmsg] === logonResp.eresult) {
            logger.log('error', '{red-fg}%s{/red-fg}', errmsg);
            logger.log('debug', 'logOnResponse error: %s', errmsg);
            session.steam_error = errmsg;
        }
    }
}
