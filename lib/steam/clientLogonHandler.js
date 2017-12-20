var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json')
  , { eresultMsg } = require('../helpers')
  , { CHATIDLEN } = require('../const')
  , session = require('../app');

function logonRes(logonResp) {
    const res = eresultMsg(logonResp.eresult);
    if (res !== 'OK') {
        session.steamError = res;
    }

    switch (logonResp.eresult) {

        case this.Steam.EResult.OK:
            loginAccepted.call(this);
            break;

        case this.Steam.EResult.AccountLogonDenied:
            logger.log('error', doc.err.steamGuard);
            config.set('sentryauth', false);
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
            logger.log('error', '{red-fg}Steam %s{/red-fg}', res);
            logger.log('debug', 'logOnResponse error: %s', res);
    }
}

function loginAccepted() {
    session.steamID = this.client.steamID;
    session.steamError = "";

    this.emit('connected');
    logger.log('info', doc.msg.loggedIn);

    if (session.state > 1) { // /status has been used
        this.friends.setPersonaState(session.state);
    } else if (session.idle_state > 1) { // you were previously idle
        this.friends.setPersonaState(session.idle_state);
    } else {
        this.friends.setPersonaState(
            this.Steam.EPersonaState.Online
        );
        this.emit('idle');
    }

    // Rejoin any group chats you were disconnected from
    session.chats.forEach((ID) => {
        if (ID.length === CHATIDLEN)
            this.friends.joinChat(ID);
    });

    this.emit('autojoin');
}

module.exports = logonRes;
