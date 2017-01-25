var util = require('util')
  , winston = require('winston');

var logger = require('../logger');

var screen = require('./screen')
  , inputbar = require('./inputbar')
  , statusbar = require('./statusbar')
  , userwin = require('./userwin')
  , chatwin = require('./chatwin');

class CustomLogger {

    constructor(options) {
        this.name = 'customLogger';
        this.level = options.level || 'info';
    }

    log(level, msg, meta, callback) {
        var obj = util.inspect(meta, { depth: null });
        if (obj == "{}") obj = "";

        var levelColor = "";
        switch (level) {
            case 'error':   levelColor = 'red-fg';     break;
            case 'warn':    levelColor = 'yellow-fg';  break;
            case 'info':    levelColor = 'green-fg';   break;
            case 'verbose': levelColor = 'cyan-fg';    break;
            case 'debug':   levelColor = 'blue-fg';    break;
            case 'silly':   levelColor = 'magenta-fg'; break;
        }

        var levelFormat = "{%}&{/%}: ";
        level = levelFormat.replace("&", level)
                           .replace(/%/g, levelColor);

        chatwin.print('log', level + msg + '\n' + obj);

        callback(null, true);
    }

}

winston.transports.CustomLogger = CustomLogger;
util.inherits(CustomLogger, winston.Transport);

screen.append(inputbar.box);
screen.append(statusbar.box);
screen.append(userwin.box);

chatwin.newChat('log');
screen.render();

logger.configure({
    transports: [
        new (winston.transports.CustomLogger)({ 
            name: 'ui-log',
            level: 'info'
        })
    ]
});

inputbar.read();
