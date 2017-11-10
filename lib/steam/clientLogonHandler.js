var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json')
  , { eresultMsg } = require('../helpers');

var session = require('../app');

function logonRes(logonResp) {
    switch (logonResp.eresult) {
        case this.Steam.EResult.OK:
            loginAccepted.call(this);
            break;
        case this.Steam.EResult.AccountLogonDenied:
            loginDenied.call(this);
            break;
        case this.Steam.EResult.InvalidLoginAuthCode:
            logger.log('error', doc.err.invalidCode);
            config.set('guardcode', "");
            break;
        case this.Steam.EResult.InvalidPassword:
            logger.log('error', doc.err.loginTimeout);
            break;
        case this.Steam.EResult.AccountLogonDeniedNeedTwoFactorCode:
            logger.log('error', doc.err.needTwoFactor);
            break;
        default: 
            loginOther.call(this, logonResp);
    }
}

function loginAccepted() {
    session.steamID = this.client.steamID;

    this.emit('connected');
    logger.log('info', "Logged in!");

    if (session.away)
        this.friends.setPersonaState(this.Steam.EPersonaState.Away);
    else
        this.friends.setPersonaState(this.Steam.EPersonaState.Online);

    this.emit('rejoinGroupChats');
    this.emit('autojoinGroupChats');
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
