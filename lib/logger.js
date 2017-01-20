var util = require('util')
  , path = require('path')
  , winston = require('winston');

// Logging levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 } 

class logger {

    constructor() {
        this.winston = new (winston.Logger)({
            transports: [
                new (winston.transports.Console)({
                    level: 'info',
                    colorize: true
                })
            ]
        });
        this.useDebugFile = false;
    }

    debugFile(bool) {
        if (bool && !this.useDebugFile) {
            this.winston.add(winston.transports.File, { 
                filename: path.join(__dirname, '..', 'debug.log'),
                level: 'debug'
            });
            this.useDebugFile = true;
        } else if (!bool && this.useDebugFile) {
            this.winston.remove(winston.transports.File);
            this.useDebugFile = false;
        }
    }

}

var myLogger = new logger().winston;

module.exports = myLogger;
