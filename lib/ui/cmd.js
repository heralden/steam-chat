var logger = require('../logger')
  , doc = require('../doc.json')
  , session = require('../app');
const { CHATIDLEN, STEAMIDLEN } = require('../const');

var { verify, checker, validator, checkCond, arrLen } = require('../helpers');
var ui = require('./ui');

module.exports = (args) => {
    switch (args[0]) {

        case 'connect':     return ui.steam.connect();
        case 'disconnect':  return steamDisconnectHandler();

        /* Steam */
        case 'add':         return addFriendWrapper(args);
        case 'accept':      return acceptFriendHandler(args[0]);
        case 'join':        return joinChatWrapper(args);
        case 'part':        return leaveChatHandler(args[0]);
        case 'persona':     return personaNameWrapper(args);
        case 'pm':          return privateMessageWrapper(args);
        case 'remove':      return removeFriendWrapper(args);

        /* Interface */
        case 'help':        return helpWrapper(args);
        case 'scrollb':     return ui.chatwin.scrollBack();
        case 'scrollf':     return ui.chatwin.scrollForward();
        case 'w':           return switchChatWrapper(args);

        /* Program */
        case 'debug':       return setLoggingLevelWrapper(args);
        case 'logfile':     return logFileWrapper(args);
        case 'quit':        return process.exit(0); 

        default:
            logger.log('warn', "Invalid command: %s", args[0]);
    }
}

const vals = {
    checkArgsLength: validator(
        (args, len) => args.length === len + 1,
        (args, len) => [ doc.cmd.wrongArgumentLength, args[0], len ]
    ),
    checkArgsRange: validator(
        (args, min, max) => args.length >= min + 1 && args.length <= max + 1,
        (args, min, max) => [ doc.cmd.argumentsNotInRange, args[0], min, max ]
    ),
    typeNumber: validator(
        (cmd, arg) => !isNaN(arg) || arg === undefined,
        (cmd, arg) => [ doc.cmd.notNumber, cmd, arg ]
    ),
    isConnected: validator(
        () => session.connected,
        () => [ doc.msg.notConnected ]
    )
};

function steamDisconnectHandler() {
    ui.steam.client.disconnect();
    ui.userwin.clearList();
    ui.statusbar.statusUpdate('d1');
}

function acceptFriendHandler(arg) {
    if (!session.connected) {
        logger.log('error', doc.msg.notConnected);
        return 1;
    }

    var friends = ui.steam.friends.friends;

    var id = Object.keys(friends).filter(
        ID => friends[ID] === ui.steam.Steam.EFriendRelationship.RequestRecipient
    );

    if (id.length === 0) {
        logger.log('warn', doc.msg.noPendingFriendRequests);
        return 1;
    }

    var names = id.map(ID => session.users[ID].player_name);

    ui.userwin.listSelect(names, item => {
        ui.steam.friends.addFriend(id[names.indexOf(item)]);
        logger.log('info', doc.msg.acceptedFriendRequest, arg, item);
    });
}

function leaveChatHandler(arg) {
    if (session.currentChat.length === CHATIDLEN) {
        if (session.connected) {
            ui.steam.friends.leaveChat(session.currentChat);
            delete session.clans[session.currentChat];
        } else {
            logger.log('error', doc.cmd.unableToLeaveChat, arg);
            return 1;
        }
    } else if (session.currentChat === "log") {
        return 1;
    }

    ui.chatwin.deleteChat(session.currentChat);
} 

const helpWrapper = args => verify(logger,
    checker(
        vals.checkArgsRange(args, 0, 1)
    ),
    () => {
        if (args[1]) {
            const arg = args[1].toLowerCase();
            const tmpl = `${args[0]}: `;

            if (arg === "all") {
                for (let entry in doc.help)
                    logger.log('info', tmpl.concat(doc.help[entry]));
            } else {
                if (arg in doc.help)
                    logger.log('info', tmpl.concat(doc.help[arg]));
                else
                    logger.log('warn', doc.msg.helpNotExist, args[0], arg);
            }

        } else {
            logger.log('info', doc.msg.help, args[0]);
        }
    }
)

const joinChatWrapper = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsRange(args, 0, 1),
        checkCond(
            arrLen(args[1]) !== CHATIDLEN && 
                arrLen(session.lastInvite) !== CHATIDLEN,
            [ doc.cmd.notChatOrInvite, args[0] ]
        )
    ),
    () => {
        let target;
        if (args[1]) target = args[1];
        else target = session.lastInvite;
        ui.steam.friends.joinChat(target);
        logger.log('debug', doc.cmd.joinChat, args[0], target);
    }
)

const addFriendWrapper = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsLength(args, 1),
        checkCond(
            args[1].length !== STEAMIDLEN || !/^7656119.*/.test(args[1]),
            [ doc.cmd.invalidSteamId, args[0], args[1] ]
        )
    ),
    () => {
        ui.steam.friends.addFriend(args[1]);
        logger.log('info', doc.cmd.addedFriend, args[0], args[1]);
    }
)


const personaNameWrapper = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsLength(args, 1)
    ),
    () => {
        ui.steam.friends.setPersonaName(args[1]);
        logger.log('debug', doc.cmd.changedPersona, args[0], args[1]);
    }
)

const privateMessageWrapper = args => verify(logger,
    checker(
        vals.isConnected()
    ),
    () => {
        var arg = args.slice(1).join(' ');
        ui.userwin.findFriend(arg, (id) => {
            if (id) {
                if (!session.chats.includes(id))
                    ui.chatwin.newChat(id);

                if (session.currentChat != id)
                    ui.chatwin.switchChat(id);
            } else if (id === null) { 
                // lookupName failed - notify that arg was invalid
                logger.log('warn', doc.cmd.userNotFound, args[0], arg);
            }
            ui.inputbar.read();
        });
    },
    true
)

const removeFriendWrapper = args => verify(logger,
    checker(
        vals.isConnected()
    ),
    () => {
        var arg = args.slice(1).join(' ');
        ui.userwin.findFriend(arg, (id, name) => {
            if (id) {
                if (session.friends.includes(id)) {
                    ui.steam.friends.removeFriend(id);
                    logger.log('info', doc.cmd.removedFriend, args[0], name);
                    //TODO - might need to update friends list here
                } else {
                    logger.log('warn', doc.cmd.userNotFriend, args[0], name);
                }
            } else if (id === null) {
                // lookupName failed - notify that arg was invalid
                logger.log('warn', doc.cmd.userNotFound, args[0], arg);
            }
            ui.inputbar.read();
        });
    },
    true
)

const switchChatWrapper = args => verify(logger,
    checker(
        vals.checkArgsLength(args, 1),
        vals.typeNumber(args[0], args[1]),
        checkCond(
            session.chats[parseInt(args[1]) - 1] === undefined, 
            [ doc.cmd.chatNotExist, args[0], args[1] ]
        )
    ),
    () => {
        ui.chatwin.switchChat(session.chats[parseInt(args[1]) - 1]);
        logger.log('debug', doc.cmd.switchChat, args[0], args[1]);
    }
)

const logFileWrapper = args => verify(logger,
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

const setLoggingLevelWrapper = args => verify(logger,
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
