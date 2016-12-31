var util = require('util');
var path = require('path');

var winston = require('winston');
// Logging levels: { error: 0, warn: 1, info: 2, verbose: 3, debug: 4, silly: 5 } 

class logger {

    constructor() {
        this.winston = new (winston.Logger)({
            transports: [
                new (winston.transports.CustomLogger)({ 
                  name: 'ui-log',
                  level: 'info'
                })
            ]
        });
    }

    debugFile(bool) {
        if (bool) {
            this.winston.add(winston.transports.File, { 
              filename: path.join(__dirname, '..', 'debug.log'),
              level: 'debug'
            });
        } else {
            this.winston.remove(winston.transports.File);
        }
    }

}

class CustomLogger {

    constructor(options) {
        this.name = 'customLogger';
        this.level = options.level || 'info';
    }

    log(level, msg, meta, callback) {
        var obj = util.inspect(meta, { depth: null });
        if (obj == "{}") obj = "";

        console.log(level + ": " + msg + " " + obj);
        // ^TODO: update to use blessed ui
        callback(null, true);
    }

}

winston.transports.CustomLogger = CustomLogger;
util.inherits(CustomLogger, winston.Transport);

module.exports = new logger().winston;
