var { createActions } = require('./helpers');

module.exports = { 
    CHATIDLEN: 18,
    STEAMIDLEN: 17,
    CMD: createActions(
        'accept',
        'add',
        'autojoin',
        'block',
        'cmds',
        'connect',
        'debug',
        'disconnect',
        'dump',
        'games',
        'get',
        'help',
        'join',
        'logfile',
        'nick',
        'part',
        'pm',
        'quit',
        'quit!',
        'reload',
        'remove',
        'save',
        'scrollb',
        'scrollf',
        'scrolluser',
        'set',
        'status',
        'unblock',
        'w'
    )
};
