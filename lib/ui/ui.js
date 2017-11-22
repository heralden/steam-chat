var util = require('util')
  , EventEmitter = require('events')
  , winston = require('winston')
  , blessed = require('blessed');

var logger = require('../logger')
  , config = require('../config')
  , session = require('../app')
  , { CHATIDLEN } = require('../const');

const createScreen = () => {
    var screen = blessed.screen({
        autoPadding: true,
        fullUnicode: true,
        fastCSR: true,
        title: "steam-chat"
    });

    return screen;
}

const handleSteam = (steam) => {
    steam.on('connected', () => {
        session.connected = true;
        this.statusbar.statusUpdate('d0');
    });
    steam.on('disconnected', () => {
        session.connected = false;
        this.statusbar.statusUpdate('d1');
    });

    steam.on('personaUpdate', (state) => {
        this.statusbar.statusUpdate('n' + state)
    });

    steam.on('autojoin', () => {
        this.cmd(['autojoin', 'run']);
    });

    steam.on('isTyping', (steamID, user, persona) => {
        this.statusbar.statusUpdate('w1' + steamID)
    });
    steam.on('message', (steamID, user, persona, msg) => {
        this.statusbar.statusUpdate('w0' + steamID);
        this.chatwin.message(steamID, user, persona, msg);
    });
    steam.on('groupMessage', (chatID, user, persona, msg) => {
        this.chatwin.message(chatID, user, persona, msg);
    });

    steam.on('listUpdate', () => {
        setImmediate(() => {
            this.userwin.listUpdate();
            this.statusbar.statusUpdate('p' + session.currentChat);
        });
    });
    steam.on('enteredChat', (chatID) => {
        if (!session.chats.includes(chatID))
            this.chatwin.newChat(chatID);
        if (session.currentChat !== chatID)
            this.chatwin.switchChat(chatID);
    });
    steam.on('activity', (chatID, text) => {
        this.chatwin.print(chatID, text);
    });
}

const formatTime = (date) => {
    var hour = ('0' + date.getHours()).slice(-2);
    var minute = ('0' + date.getMinutes()).slice(-2);
    var midabb = "";
    if (config.get('24hour') === false) {
        var raw = date.getHours();
        if (raw == 0) {
            hour = 12;
            midabb = " AM";
        } else if (raw < 12) {
            hour = raw;
            midabb = " AM";
        } else if (raw == 12) {
            hour = raw;
            midabb = " PM";
        } else {
            hour = raw - 12;
            midabb = " PM";
        }
    }
    return `${hour}:${minute}${midabb}`;
}

const clock = () => {
    var date = new Date();
    this.statusbar.statusUpdate(`t${formatTime(date)}`);
    setTimeout(clock.bind(this), 1000 - date.getMilliseconds());
}

var SteamChatClient = require('../steam/steam');

exports.screen = {};
exports.inputbar = require('./inputbar');
exports.statusbar = require('./statusbar');
exports.userwin = require('./userwin');
exports.chatwin = require('./chatwin');
exports.cmd = require('./cmd');
exports.steam = new SteamChatClient();

exports.init = () => {
    this.screen = createScreen();

    this.inputbar.createBox(this.screen);
    this.statusbar.createBox(this.screen);
    this.userwin.createBox(this.screen);

    this.chatwin.newChat('log');
    this.statusbar.statusUpdate('c' + 'log');

    logger.loadUiLogger();

    this.inputbar.read();
    this.steam.connect();

    handleSteam.call(this, this.steam);
    clock.call(this);
}
