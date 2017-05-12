var util = require('util')
  , winston = require('winston');

var logger = require('../logger');

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

var steam = require('../steam/steam').uiEmitter

steam.on('connected', () => statusbar.statusUpdate('d0'));
steam.on('disconnected', () => statusbar.statusUpdate('d1'));
steam.on('updateNick', () => statusbar.statusUpdate('n'));

steam.on('rejoinGroupChats', () => {});
steam.on('autojoinGroupChats', () => {});

steam.on('isTyping', 
    (steamID, user, persona) => statusbar.statusUpdate('w1' + steamID));
steam.on('message', 
    (steamID, user, persona, msg) => statusbar.statusUpdate('w0' + steamID));
steam.on('groupMessage', (chatID, user, persona, msg) => {});

steam.on('enteredChat', (chatID) => {});
steam.on('activity', (chatID, persona, user, actorUser) => {});
