var logger = require('../logger');

var statusUpdate = () => {};

module.exports = {

    loadUi: () => {
        statusUpdate = require('./statusbar').statusUpdate;
    },
    connected:    () => statusUpdate('d0'),
    disconnected: () => statusUpdate('d1'),
    updateNick:   () => statusUpdate('n'),

    rejoinGroupChats: () => {},
    autojoinGroupChats: () => {},

    isTyping: (steamID, user, persona) => statusUpdate('w1' + steamID),
    message: (steamID, user, persona, msg) => {
        statusUpdate('w0' + steamID);
    },
    groupMessage: (chatID, user, persona, msg) => {},

    enteredChat: (chatID) => {},
    activity: (chatID, persona, user, actorUser) => {}

};
