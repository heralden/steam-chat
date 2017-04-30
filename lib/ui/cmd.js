var logger = require('../logger')
  , doc = require('../doc.json')
  , session = require('../app');

var chatwin = require('./chatwin');

module.exports = (args) => {
    switch (args[0]) {

        case 'w':       return switchChatWrapper(args);
        case 'scrollb': return chatwin.scrollBack();
        case 'scrollf': return chatwin.scrollForward();

        case 'debug':   return setLoggingLevelWrapper(args);
        case 'logfile': return logFileWrapper(args);
        case 'quit':    return process.exit(0); 

        default:
            logger.log('warn', "Invalid command: %s", args[0]);
    }
};

const logFileWrapper = args => {
    if (helpers.checkArgsRange(args, 1, 2)) return;
    var bool = undefined;
    switch (args[1].toLowerCase()) {
        case "true":  bool = true;  break;
        case "false": bool = false; break;
        default: logger.log('warn', doc.cmd.invalidBoolean, args[0], args[1]);
    }
    if (args[2] < 0 || args[2] > 5) {
        logger.log('warn', doc.cmd.invalidLogFileLevel, args[0], args[2]);
    } else if (bool !== undefined) logger.logFile(bool, args[2] || 2);
}

const setLoggingLevelWrapper = args => helpers.wrap(
    () => helpers.checkArgsLength(args, 1),
    () => helpers.typeNumber(args[0], args[1]),
    () => helpers.breakIf(
        args[1] < 0 || args[1] > 3,
        () => logger.log('warn', doc.cmd.invalidDebugLevel, args[0])
    ),
    () => logger.setLoggingLevel(parseInt(args[1])),
    () => logger.log('info', doc.cmd.setLoggingLevel, args[0], args[1])
)

const switchChatWrapper = args => helpers.wrap(
    () => helpers.checkArgsLength(args, 1),
    () => helpers.typeNumber(args[0], args[1]),
    () => helpers.breakIf(
        session.chats[parseInt(args[1]) -1] === undefined, 
        () => logger.log('verbose', doc.cmd.chatNotExist, args[0], args[1])
    ),
    () => chatwin.switchChat(
        session.chats[parseInt(args[1]) - 1]
    ),
    () => logger.log('debug', doc.cmd.switchChat, args[0], args[1])

)

const helpers = {
    wrap: (...args) => args.every(action => !action()),
    breakIf: (test, expr) => test && (expr() || true),
    checkArgsLength: (args, len) => {
        var targetLength = len + 1;
        if (args.length > targetLength) {
            logger.log('warn', doc.cmd.tooManyArguments, args[0]);
            return true;
        } else if (args.length < targetLength) {
            logger.log('warn', doc.cmd.notEnoughArguments, args[0]);
            return true;
        } else return false;
    },
    checkArgsRange: (args, min, max) => {
        var targetMin = min + 1
          , targetMax = max + 1;
        if (args.length > targetMax) {
            logger.log('warn', doc.cmd.tooManyArguments, args[0]);
            return true;
        } else if (args.length < targetMin) {
            logger.log('warn', doc.cmd.notEnoughArguments, args[0]);
            return true;
        } else return false;
    },
    typeNumber: (cmd, arg) => {
        if (isNaN(arg)) {
            logger.log('warn', doc.cmd.notNumber, cmd, arg);
            return true;
        } else return false;
    }
};
