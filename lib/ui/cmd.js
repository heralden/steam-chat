var logger = require('../logger')
  , doc = require('../doc.json')
  , session = require('../app');

var chatwin = require('./chatwin')
  , userwin = require('./userwin')
  , statusUpdate = require('./statusbar').statusUpdate
  , steam = require('../steam/steam')
  , steamClient = require('../steam/steam').client;

module.exports = (args) => {
    switch (args[0]) {

        case 'connect':     return steam.connect();
        case 'disconnect':  return steamDisconnectHandler();

        case 'w':           return switchChatWrapper(args);
        case 'scrollb':     return chatwin.scrollBack();
        case 'scrollf':     return chatwin.scrollForward();

        case 'logfile':     return logFileWrapper(args);
        case 'debug':       return setLoggingLevelWrapper(args);
        case 'quit':        return process.exit(0); 

        default:
            logger.log('warn', "Invalid command: %s", args[0]);
    }
}

function steamDisconnectHandler() {
    steamClient.disconnect();
    userwin.clearList();
    statusUpdate('d1');
}

const switchChatWrapper = args => verify(
    checker(
        helpers.checkArgsLength(args, 1),
        helpers.typeNumber(args[0], args[1]),
        checkCond(
            session.chats[parseInt(args[1]) - 1] === undefined, 
            [ doc.cmd.chatNotExist, args[0], args[1] ]
        )
    ),
    () => {
        chatwin.switchChat(session.chats[parseInt(args[1]) - 1]);
        logger.log('debug', doc.cmd.switchChat, args[0], args[1]);
    }
)

const logFileWrapper = args => verify(
    checker(
        helpers.checkArgsRange(args, 1, 2),
        checkCond(
            args[2] < 0 || args[2] > 5,
            [ doc.cmd.invalidLogFileLevel, args[0], args[2] ]
        )
    ),
    () => {
        var bool = undefined;
        switch (args[1].toLowerCase()) {
            case "true":  bool = true;  break;
            case "false": bool = false; break;
            default: logger.log('warn', doc.cmd.invalidBoolean, args[0], args[1]);
        }
        if (bool !== undefined) logger.logFile(bool, args[2] || 2);
    }
)

const setLoggingLevelWrapper = args => verify(
    checker(
        helpers.checkArgsLength(args, 1),
        helpers.typeNumber(args[0], args[1]),
        checkCond(
            args[1] < 0 || args[1] > 3,
            [ doc.cmd.invalidDebugLevel, args[0] ] 
        )
    ),
    () => {
        logger.setLoggingLevel(parseInt(args[1]));
        logger.log('info', doc.cmd.setLoggingLevel, args[0], args[1])
    }
)

const checker = (...args) => args.reduce((err, check) => {
    if (!check.res && err.length === 0)
        return check.msg;
    return err;
}, [])
const verify = (err, fun) => err.length > 0 ? logger.log('warn', ...err) : fun()
const checkCond = (cond, msg) => cond ? { res: false, msg } : { res: true }

const helpers = {
    checkArgsLength: (args, len) => {
        var targetLength = len + 1;
        if (args.length > targetLength)
            return { res: false, msg: [ doc.cmd.tooManyArguments, args[0] ] };
        else if (args.length < targetLength)
            return { res: false, msg: [ doc.cmd.notEnoughArguments, args[0] ] };
        else return { res: true };
    },
    checkArgsRange: (args, min, max) => {
        var targetMin = min + 1
          , targetMax = max + 1;
        if (args.length > targetMax)
            return { res: false, msg: [ doc.cmd.tooManyArguments, args[0] ] };
        else if (args.length < targetMin)
            return { res: false, msg: [ doc.cmd.notEnoughArguments, args[0] ] };
        else return { res: true };
    },
    typeNumber: (cmd, arg) => {
        if (isNaN(arg))
            return { res: false, msg: [ doc.cmd.notNumber, cmd, arg ] };
        else return { res: true };
    }
};
