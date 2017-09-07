var util = require('util')
  , winston = require('winston')
  , EventEmitter = require('events');

var logger = require('../logger')
  , config = require('../config')
  , session = require('../app');

const handleSteam = (steam) => {
    steam.on('connected', () => {
        session.connected = true;
        this.statusbar.statusUpdate('d0');
    });
    steam.on('disconnected', () => {
        session.connected = false;
        this.statusbar.statusUpdate('d1');
    });

    steam.on('updateNick', () => this.statusbar.statusUpdate('n'));

    steam.on('rejoinGroupChats', () => {});
    steam.on('autojoinGroupChats', () => {});

    steam.on('isTyping', (steamID, user, persona) => 
        this.statusbar.statusUpdate('w1' + steamID));
    steam.on('message', (steamID, user, persona, msg) => {
        this.statusbar.statusUpdate('w0' + steamID);
        this.chatwin.message(steamID, user, persona, msg);
    });
    steam.on('groupMessage', (chatID, user, persona, msg) => {
        this.chatwin.message(chatID, user, persona, msg);
    });

    steam.on('enteredChat', (chatID) => {});
    steam.on('activity', (chatID, persona, user, actorUser) => {});
}

const formatTime = (date) => {
    var hour = ('0' + date.getHours()).slice(-2);
    var minute = ('0' + date.getMinutes()).slice(-2);
    var midabb = "";
    if (config.get('timeformat') === "12h") {
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

exports.screen = {};
exports.chatwin = {};
exports.cmd = {}; 
exports.inputbar = {}; 
exports.statusbar = {}; 
exports.userwin = {}; 
exports.steam = { friends: { joinChat: function() {} } };

exports.init = () => {
    this.screen = require('./screen');
    this.chatwin = require('./chatwin');
    this.cmd = require('./cmd');
    this.inputbar = require('./inputbar');
    this.statusbar = require('./statusbar');
    this.userwin = require('./userwin');

    this.screen.append(this.inputbar.box);
    this.screen.append(this.statusbar.box);
    this.screen.append(this.userwin.box);

    this.chatwin.newChat('log');
    this.screen.render();

    logger.loadUiLogger();

    this.inputbar.read();

    this.steam = require('../steam/steam').init();
    handleSteam.call(this, this.steam);
    clock.call(this);
}
