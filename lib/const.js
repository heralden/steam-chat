var { createActions } = require('./helpers');

module.exports = { 
    CHATIDLEN: 18,
    STEAMIDLEN: 17,
    CMD: createActions(
        'connect',
        'disconnect',
        'add',
        'accept',
        'autojoin',
        'block',
        'join',
        'nick',
        'part',
        'pm',
        'remove',
        'status',
        'unblock',
        'cmds',
        'get',
        'help',
        'set',
        'scrollb',
        'scrollf',
        'scrolluser',
        'w',
        'debug',
        'dump',
        'logfile',
        'reload',
        'save',
        'quit',
        'quit!'
    )
};
