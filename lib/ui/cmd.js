var logger = require('../logger')
  , doc = require('../doc.json')
  , session = require('../app');

var chatwin = require('./chatwin');

module.exports = (args) => {
    switch (args[0]) {

        case 'w':       return switchChatWrapper(args);

        case 'scrollb': return chatwin.scrollBack();
        case 'scrollf': return chatwin.scrollForward();
        case 'quit':    return process.exit(0); 

        default:
            logger.log('warn', "Invalid command: %s", args[0]);
    }
};

function switchChatWrapper(args) {
    if (helpers.checkArgsLength(args, 2)) return;
    if (helpers.typeNumber(args[1])) return;
    if (session.chats[parseInt(args[1]) - 1] === undefined) {
        logger.log('verbose', doc.cmd.chatNotExist, args[0], args[1]);
    } else chatwin.switchChat(
        session.chats[parseInt(args[1]) - 1]
    );
}

var helpers = {
    checkArgsLength: (args, len) => {
        if (args.length > len) {
            logger.log('warn', doc.cmd.tooManyArguments, args[0]);
            return 1;
        } else if (args.length < len) {
            logger.log('warn', doc.cmd.notEnoughArguments, args[0]);
            return 1;
        } else return 0;
    },
    typeNumber: (arg) => {
        if (isNaN(arg)) {
            logger.log('warn', doc.cmd.notNumber, args[0], args[1]);
            return 1;
        } else return 0;
    }
};
