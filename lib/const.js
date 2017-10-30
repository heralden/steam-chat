var { createActions } = require('./helpers');

module.exports = { 
    CHATIDLEN: 18,
    STEAMIDLEN: 17,
    CMD: createActions(
        'connect',
        'disconnect',
        'add',
        'accept',
        'join',
        'part',
        'persona',
        'pm',
        'remove',
        'cmds',
        'help',
        'scrollb',
        'scrollf',
        'w',
        'debug',
        'logfile',
        'quit'
    )
};
