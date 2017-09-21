var fs = require('fs')
  , path = require('path');

var logger = require('./logger')
  , doc = require('./doc.json');

class Config {

    constructor(configFile) {
        this.config = struct();
        this._configFile = configFile;
        this._checkConfig(configFile);
    }

    setPath(configFile) {
        this._configFile = configFile;
        logger.log('debug', "Config path has been changed: %s", configFile);
        this._checkConfig(configFile);
    }

    getPath() {
        return this._configFile;
    }

    _checkConfig(configFile) {
        fs.stat(configFile, (err) => {
            if (err)
                logger.log('debug', "File %s stat failure.", configFile, err);
            else this._load(this._configFile);
        });
    }

    set(field, value) {
        if (this.config[field] !== undefined) {
            this.config[field] = value;
            this._save(this._configFile);
        } else {
            logger.log('warn', "Setting invalid value.", { field, value });
        }
    }

    get(field) {
        if (this.config[field] !== undefined) {
            return this.config[field];
        } else {
            logger.log('warn', "Getting invalid value.", { field });
        }
    }

    _save(configFile) {
        fs.writeFile(configFile, JSON.stringify(this.config), 'utf8', (err) => {
            if (err) logger.log('error', "Write error.", err);
            else {
                logger.log('debug', "Config file has been saved: %s", this._configFile);
                fs.chmodSync(this._configFile, '0600');
            }
        });
    }

    _load(configFile) {
        fs.readFile(configFile, 'utf8', (err, data) => {
            if (err) logger.log('error', "Read error.", err);
            else {
                var obj = JSON.parse(data);
                this.config = struct(obj);
                logger.log('debug', "Config file has been loaded: %s", this._configFile);
            }
        });
    }

}

function struct(newObj) {

    var obj = { // Default values
        username: "",
        password: "",
        guardcode: "",
        twofactor: "",
        sentryauth: false,
        sentryfile: "",
        autojoin: [],
        timeformat: "12h",                  // 12h or 24h
        userlistwidth: 26,                  // 26 characters
        scrollback: 1000,                   // 1000 lines
        ghostcheck: 5*60*1000,              // 5 minutes
        max_reconnect: 5,                   // 5 attempts
        reconnect_timeout: 30*1000,         // 30 seconds
        reconnect_long_timeout: 10*60*1000  // 10 minutes
    };

    if (newObj !== undefined)
        for (var key in newObj) { obj[key] = newObj[key]; }

    return obj;
}

module.exports = new Config(path.join(__dirname, '..', 'config.json'));
