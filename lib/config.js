var fs = require('fs');
var path = require('path');

var logger = require('./logger.js');
var doc = require('./doc.json');

class config {

    constructor(configPath) {
        this.config = struct();
        this.configFile = configPath;

        fs.stat(this.configFile, (err) => {
            if (err)
                logger.log('debug', "File %s stat failure", this.configFile, err);
            else this.load();
        });
    }

    set(field, value) {
        if (this.config[field] !== undefined) {
            this.config[field] = value;
            this.save();
        } else {
            logger.log('debug', "Setting invalid value", { field, value });
        }
    }

    get(field) {
        if (this.config[field] !== undefined) {
            return this.config[field];
        } else {
            logger.log('debug', "Getting invalid value", { field });
        }
    }

    save() {
        fs.writeFile(this.configFile, JSON.stringify(this.config), 'utf8', (err) => {
            if (err) logger.log('error', "Write error", err);
            else {
                logger.log('debug', "File %s saved", this.configFile);
                fs.chmodSync(this.configFile, '0600');
            }
        });
    }

    load() {
        fs.readFile(this.configFile, 'utf8', (err, data) => {
            if (err) logger.log('error', "Read error", err);
            else {
                var obj = JSON.parse(data);
                this.config = struct(obj);
            }
        });
    }

}

module.exports = new config(path.join(__dirname, '..', 'config.json'));

function struct(newObj) {

    var obj = { // Default values
        username: "",
        password: "",
        guardcode: "",
        twofactor: "",
        sentryauth: false,
        sentryfile: "",
        userlistwidth: 26, // 26 characters
        scrollback: 1000, // 1000 lines
        autojoin: [],
        ghostcheck: 5*60*1000, // 5 minutes
        max_reconnect: 5, // 5 attempts
        reconnect_timeout: 30*1000, // 30 seconds
        reconnect_long_timeout: 10*60*1000 // 10 minutes
    };

    if (newObj !== undefined)
        for (var key in newObj) { obj[key] = newObj[key]; }

    return obj;
}
