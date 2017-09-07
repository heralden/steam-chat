var logger = require('../logger')
  , doc = require('../doc.json')
  , session = require('../app');
const {CHATIDLEN, STEAMIDLEN} = require('../const');

var scc = require('./ui');

module.exports = (args) => {
    switch (args[0]) {

        case 'connect':     return scc.steam.connect();
        case 'disconnect':  return steamDisconnectHandler();

        case 'accept':      return acceptFriendHandler(args[0]);
        case 'join':        return joinChatWrapper(args);

        case 'w':           return switchChatWrapper(args);
        case 'part':        return leaveChatHandler(args[0]);
        case 'scrollb':     return scc.chatwin.scrollBack();
        case 'scrollf':     return scc.chatwin.scrollForward();

        case 'logfile':     return logFileWrapper(args);
        case 'debug':       return setLoggingLevelWrapper(args);
        case 'quit':        return process.exit(0); 

        default:
            logger.log('warn', "Invalid command: %s", args[0]);
    }
}

const checker = (...args) => args.reduce((err, check) => {
    if (!check.res && err.length === 0)
        return check.msg;
    return err;
}, [])
const verify = (err, fun) => err.length > 0 ? logger.log('warn', ...err) : fun()
const checkCond = (cond, msg) => cond ? { res: false, msg } : { res: true }
const validator = (msgFun, predFun) => (...args) => (
    { res: predFun(...args), msg: msgFun(...args) }
)

const vals = {
    checkArgsLength: validator(
        (args, len) => [ doc.cmd.wrongArgumentLength, args[0], len ],
        (args, len) => args.length === len + 1
    ),
    checkArgsRange: validator(
        (args, min, max) => [ doc.cmd.argumentsNotInRange, args[0], min, max ],
        (args, min, max) => args.length >= min + 1 && args.length <= max + 1
    ),
    typeNumber: validator(
        (cmd, arg) => [ doc.cmd.notNumber, cmd, arg ],
        (cmd, arg) => !isNaN(arg) || arg === undefined
    ),
    isConnected: validator(
        () => [ doc.msg.notConnected ],
        () => session.connected
    )
};

function steamDisconnectHandler() {
    scc.steam.client.disconnect();
    scc.userwin.clearList();
    scc.statusbar.statusUpdate('d1');
}

function acceptFriendHandler(arg) {
    if (!session.connected) {
        logger.log('error', doc.msg.notConnected);
        return 1;
    }

    var friends = scc.steam.friends.friends;

    var id = Object.keys(friends).filter(
        ID => friends[ID] === scc.steam.Steam.EFriendRelationship.RequestRecipient
    );

    if (id.length === 0) {
        logger.log('warn', doc.msg.noPendingFriendRequests);
        return 1;
    }

    var name = id.map(ID => session.users[ID].player_name);

    scc.userwin.listSelect(name, item => {
        scc.steam.friends.addFriend(id[name.indexOf(item)]);
        logger.log('info', doc.msg.acceptedFriendRequest, arg, item);
    });
}

function leaveChatHandler(arg) {
    if (session.currentChat.length === CHATIDLEN) {
        if (session.connected) {
            scc.steam.friends.leaveChat(session.currentChat);
            delete session.clans[session.currentChat];
        } else {
            logger.log('error', doc.cmd.unableToLeaveChat, arg);
            return 1;
        }
    } else if (session.currentChat === "log") {
        return 1;
    }

    scc.chatwin.deleteChat(session.currentChat);
} 

const joinChatWrapper = args => verify(
    checker(
        vals.checkArgsRange(args, 0, 1),
        vals.isConnected(),
        checkCond(
            len(args[1]) !== CHATIDLEN && 
                len(session.lastInvite) !== CHATIDLEN,
            [ doc.cmd.notChatOrInvite, args[0] ]
        )
    ),
    () => {
        let target;
        if (args[1]) target = args[1];
        else target = session.lastInvite;
        scc.steam.friends.joinChat(target);
        logger.log('debug', doc.cmd.joinChat, args[0], target);
    }
)

const switchChatWrapper = args => verify(
    checker(
        vals.checkArgsLength(args, 1),
        vals.typeNumber(args[0], args[1]),
        checkCond(
            session.chats[parseInt(args[1]) - 1] === undefined, 
            [ doc.cmd.chatNotExist, args[0], args[1] ]
        )
    ),
    () => {
        scc.chatwin.switchChat(session.chats[parseInt(args[1]) - 1]);
        logger.log('debug', doc.cmd.switchChat, args[0], args[1]);
    }
)

const logFileWrapper = args => verify(
    checker(
        vals.checkArgsRange(args, 1, 2),
        vals.typeNumber(args[0], args[2]),
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
        vals.checkArgsLength(args, 1),
        vals.typeNumber(args[0], args[1]),
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

const len = val => val ? val.length : 0
