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
