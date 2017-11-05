var nconf = require('nconf')
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
    reconnect_long_timeout: 10*60*1000  // 10 minutes
};

function setPath(configPath) {
    nconf.file(configPath);
    nconf.stores.file.store = 
        Object.assign({}, defaults, nconf.stores.file.store);
}

setPath(path.join(__dirname, '..', 'config.json'));

module.exports = {
    set: (...args) => nconf.set(...args),
    get: (...args) => nconf.get(...args),
    save: (...args) => nconf.save(...args),
    reload: (...args) => nconf.load(...args),
    getPath: () => nconf.stores.file.file,
    setPath,
    isValidKey: (key) => Object.keys(defaults).includes(key)
};
