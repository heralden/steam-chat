var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json');

var session = require('../app')
  , ui = require('./steam').uiEmitter
  , Steam = require('./steam').Steam
  , steamClient = require('./steam').steamClient
  , steamFriends = require('./steam').steamFriends;

function logonRes(logonResp) {
    switch (logonResp.eresult) {
        case 'Steam.EResult.OK':
            loginAccepted();
            break;
        case 'Steam.EResult.AccountLogonDenied':
            loginDenied();
            break;
        case 'Steam.EResult.InvalidLoginAuthCode':
            logger.log('error', doc.err.invalidCode);
            config.set('guardcode', "");
            break;
        case 'Steam.EResult.InvalidPassword':
            logger.log('error', doc.err.loginTimeout);
            break;
        case 'Steam.EResult.AccountLogonDeniedNeedTwoFactorCode':
            logger.log('error', doc.err.needTwoFactor);
            break;
        default: 
            loginOther(logonResp);
    }
}

function loginAccepted() {
    session.steamID = steamClient.steamID;

    ui.emit('connected');
    logger.log('info', "Logged in!");

    if (session.away)
        steamFriends.setPersonaState(Steam.EPersonaState.Away);
    else
        steamFriends.setPersonaState(Steam.EPersonaState.Online);

    ui.emit('rejoinGroupChats');
    ui.emit('autojoinGroupChats');
}

function loginDenied() {
    logger.log('error', doc.err.steamGuard);
    session.steamError = 'AccountLogonDenied';
    config.set('sentryauth', false);
}

function loginOther(logonResp) {
    for (var errmsg in Steam.EResult) {
        if (Steam.EResult[errmsg] === logonResp.eresult) {
            logger.log('error', '{red-fg}%s{/red-fg}', errmsg);
            logger.log('debug', 'logOnResponse error: %s', errmsg);
            session.steamError = errmsg;
        }
    }
}

module.exports = logonRes;
