var logger = require('../logger');

var chatwin = require('./chatwin');

module.exports = (args) => {
    switch (args[0]) {
        case 'scrollb': chatwin.scrollBack(); break;
        case 'scrollf': chatwin.scrollForward(); break;
        case 'quit':    return process.exit(0); 
        default:
            logger.log('warn', "Invalid command: %s", args[0]);
    }
};
