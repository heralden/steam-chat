var util = require('util')
  , winston = require('winston')
  , EventEmitter = require('events');

var logger = require('../logger')
  , config = require('../config')
  , session = require('../app');

var screen = require('./screen')
  , inputbar = require('./inputbar')
  , statusbar = require('./statusbar')
  , userwin = require('./userwin')
  , chatwin = require('./chatwin');

screen.append(inputbar.box);
screen.append(statusbar.box);
screen.append(userwin.box);

chatwin.newChat('log');
screen.render();

logger.loadUiLogger();

inputbar.read();

var steam = require('../steam/steam');

function message(ID, user, persona, msg) {
    var color = userwin.getPersonaColor(persona);
    chatwin.print(ID, `{${color}}${user}{/${color}}: ${msg}`);
}

steam.on('connected', () => {
    session.connected = true;
    statusbar.statusUpdate('d0');
});
steam.on('disconnected', () => {
    session.connected = false;
    statusbar.statusUpdate('d1');
});

steam.on('updateNick', () => statusbar.statusUpdate('n'));

steam.on('rejoinGroupChats', () => {});
steam.on('autojoinGroupChats', () => {});

steam.on('isTyping', (steamID, user, persona) => 
    statusbar.statusUpdate('w1' + steamID));
steam.on('message', (steamID, user, persona, msg) => {
    statusbar.statusUpdate('w0' + steamID);
    message(steamID, user, persona, msg);
});
steam.on('groupMessage', (chatID, user, persona, msg) => {
    message(chatID, user, persona, msg);
});

steam.on('enteredChat', (chatID) => {});
steam.on('activity', (chatID, persona, user, actorUser) => {});

function formatTime(date) {
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

(function clock() {
    var date = new Date();
    statusbar.statusUpdate(`t${formatTime(date)}`);
    setTimeout(clock, 1000 - date.getMilliseconds());
})();

