var util = require('util')
  , path = require('path')
  , winston = require('winston');

var doc = require('./doc.json');

// Logging levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 } 

var logger = new (winston.Logger)({
    transports: [
        new (winston.transports.Console)({
            level: 'info',
            colorize: true
        })
    ]
});

exports.log = (...args) => logger.log(...args)
exports.transports = logger.transports;

class CustomLogger {

    constructor(options) {
        this.name = 'customLogger';
        this.level = options.level || 'info';

        this.chatwin = require('./ui/chatwin');
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

        if (obj) 
            this.chatwin.print('log', level + msg + '\n' + obj);
        else 
            this.chatwin.print('log', level + msg);

        callback(null, true);
    }

}

var useLogFile = false;

winston.transports.CustomLogger = CustomLogger;
util.inherits(CustomLogger, winston.Transport);

exports.loadUiLogger = () => {
    logger.configure({
        transports: [
            new (winston.transports.CustomLogger)({ 
                name: 'ui-log',
                level: 'info'
            })
        ]
    });
}

exports.setLoggingLevel = (level) => {
    logger.transports.customLogger.level = getLogLevel(level + 2);
}

exports.logFile = (bool, level) => {
    if (bool && !useLogFile) {
        logger.add(winston.transports.File, { 
            filename: path.join(__dirname, '..', 'steam-chat.log'),
            level: getLogLevel(level)
        });
        useLogFile = true;
        logger.log('info', doc.cmd.logFileEnable, level);
    } else if (!bool && useLogFile) {
        logger.remove(winston.transports.File);
        useLogFile = false;
        logger.log('info', doc.cmd.logFileDisable);
    }
}

function getLogLevel(num) {
    switch (num) {
        case 0: return 'error';
        case 1: return 'warn';
        case 2: return 'info';
        case 3: return 'verbose';
        case 4: return 'debug';
        case 5: return 'silly';
        default: return 'info';
    }
}
