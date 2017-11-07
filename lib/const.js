var { createActions } = require('./helpers');

module.exports = { 
    CHATIDLEN: 18,
    STEAMIDLEN: 17,
    CMD: createActions(
        'connect',
        'disconnect',
        'add',
        'accept',
        'block',
        'join',
        'part',
        'persona',
        'pm',
        'remove',
        'unblock',
        'cmds',
        'get',
        'help',
        'set',
        'scrollb',
        'scrollf',
        'w',
        'debug',
        'logfile',
        'reload',
        'save',
        'quit',
        'quit!'
    )
};
