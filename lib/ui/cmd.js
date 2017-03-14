var logger = require('../logger');

var chatwin = require('./chatwin');

module.exports = (args) => {
    switch (args[0]) {
        case 'scrollb': return chatwin.scrollBack();
        case 'scrollf': return chatwin.scrollForward();
        case 'quit':    return process.exit(0); 
        default:
            logger.log('warn', "Invalid command: %s", args[0]);
    }
};
