var nconf = require('nconf')
  , fs = require('fs')
  , path = require('path');

const defaults = {
    username: "",
    password: "",
    guardcode: "",
    twofactor: "",
    sentryauth: false,
    sentryfile: "",
    autojoin: [],
    "24hour": false,
    userlistwidth: 26,                  // 26 characters
    scrollback: 1000,                   // 1000 lines
    ghostcheck: 5*60*1000,              // 5 minutes
    max_reconnect: 5,                   // 5 attempts
    reconnect_timeout: 30*1000,         // 30 seconds
    reconnect_long_timeout: 10*60*1000, // 10 minutes
    away_timeout: 10*60*1000,           // 10 minutes
    snooze_timeout: 120*60*1000,        // 120 minutes
    friends: {}
};

module.exports = {
    set: (...args) => nconf.set(...args),
    get: (...args) => nconf.get(...args),
    save: (...args) => nconf.save(...args),
    reload: (...args) => nconf.load(...args),
    getPath: () => nconf.stores.file.file,
    setPath: (configPath) => {
        nconf.file(configPath);
        nconf.stores.file.store = 
            Object.assign({}, defaults, nconf.stores.file.store);
    },
    isValidKey: (key) => Object.keys(defaults).includes(key),
    checkType: (key) => module.exports.isValidKey(key) 
                            && typeof(defaults[key]),
    statFile: (cb) => fs.stat(module.exports.getPath(), cb)
};

module.exports.setPath(path.join(__dirname, '..', 'config.json'));
