var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json')
  , { eresultMsg } = require('../helpers');

var session = require('../app')
  , steam = require('./steam')
  , Steam = require('./steam').Steam
  , steamClient = require('./steam').client
  , steamFriends = require('./steam').friends;

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

    steam.emit('connected');
    logger.log('info', "Logged in!");

    if (session.away)
        steamFriends.setPersonaState(Steam.EPersonaState.Away);
    else
        steamFriends.setPersonaState(Steam.EPersonaState.Online);

    steam.emit('rejoinGroupChats');
    steam.emit('autojoinGroupChats');
}

function loginDenied() {
    logger.log('error', doc.err.steamGuard);
    session.steamError = 'AccountLogonDenied';
    config.set('sentryauth', false);
}

function loginOther(logonResp) {
    const res = eresultMsg(logonResp.eresult);
    logger.log('error', '{red-fg}%s{/red-fg}', res);
    logger.log('debug', 'logOnResponse error: %s', res);
    session.steamError = res;
}

module.exports = logonRes;
