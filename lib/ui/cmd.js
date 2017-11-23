var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json')
  , session = require('../app');
const { CHATIDLEN, STEAMIDLEN, CMD } = require('../const');

var { verify, checker, validator, 
    checkCond, arrLen, eresultMsg } = require('../helpers');
var ui = require('./ui');

module.exports = (args) => {
    switch (args[0]) {

        case CMD.connect:     return ui.steam.connect();
        case CMD.disconnect:  return steamDisconnectHandler();

        /* Steam */
        case CMD.add:         return addFriendWrapper(args);
        case CMD.accept:      return acceptFriendHandler(args[0]);
        case CMD.autojoin:    return autojoinWrapper(args);
        case CMD.block:       return blockUserWrapper(args);
        case CMD.join:        return joinChatWrapper(args);
        case CMD.nick:        return nickWrapper(args);
        case CMD.part:        return leaveChatHandler(args[0]);
        case CMD.pm:          return privateMessageWrapper(args);
        case CMD.remove:      return removeFriendWrapper(args);
        case CMD.status:      return statusWrapper(args);
        case CMD.unblock:     return unblockUserWrapper(args);

        /* Interface */
        case CMD.cmds:        return commandsWrapper(args);
        case CMD.get:         return getWrapper(args);
        case CMD.help:        return helpHandler(args);
        case CMD.set:         return setWrapper(args);
        case CMD.scrollb:     return ui.chatwin.scrollBack();
        case CMD.scrollf:     return ui.chatwin.scrollForward();
        case CMD.scrolluser:  return scrollUserHandler();
        case CMD.w:           return switchChatWrapper(args);

        /* Program */
        case CMD.debug:       return setLoggingLevelWrapper(args);
        case CMD.dump:        return dumpHandler();
        case CMD.logfile:     return logFileWrapper(args);
        case CMD.reload:      return reloadHandler(args);
        case CMD.save:        return saveHandler(args);
        case CMD.quit:        return quitHandler(args);
        case CMD['quit!']:    return process.exit(0);

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
    typeSteamId: validator(
        (cmd, arg) => arg.length === STEAMIDLEN && /^7656119.*/.test(arg),
        (cmd, arg) => [ doc.cmd.invalidSteamId, cmd, arg ]
    ),
    isConnected: validator(
        () => session.connected,
        () => [ doc.msg.notConnected ]
    )
};

function quitHandler(args) {
    config.save((err) => {
        if (err) 
            logger.log('error', doc.err.quitSaveError, args[0], err);
        else
            process.exit(0); 
    });
}

function saveHandler(args) {
    config.save((err) => {
        if (err)
            logger.log('error', doc.err.saveError, args[0], err);
        else
            logger.log('info', doc.cmd.saveSuccess, args[0]);
    });
}

function reloadHandler(args) {
    config.statFile((err) => {
        if (err) {
            logger.log('error', doc.err.reloadError, args[0], err);
        } else {
            config.reload((err) => {
                if (err) 
                    logger.log('error', doc.err.reloadError, args[0], err);
                else
                    logger.log('info', doc.cmd.reloadSuccess, args[0]);
            });
        }
    });
}

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

function helpHandler([ cmd, ...args ]) {
    const arg = args.join(' ').toLowerCase();
    if (arg.length > 0) {
        const tmpl = `${cmd}: `;

        if (arg === "all") {
            for (let entry in doc.help)
                logger.log('info', tmpl.concat(doc.help[entry]));
        } else {
            if (arg in doc.help)
                logger.log('info', tmpl.concat(doc.help[arg]));
            else
                logger.log('warn', doc.msg.helpNotExist, cmd, arg);
        }

    } else {
        logger.log('info', doc.msg.help, cmd);
    }
}

function scrollUserHandler() {
    session.scroll_user = session.scroll_user ? false : true;
    ui.userwin.listUpdate();
}

function dumpHandler() {
    const file = require('path')
        .join(__dirname, '..', '..', 'session.log');
    var obj = Object.assign({}, session);
    // JSON.stringify throws error on circular reference
    delete obj.idle_timeout;

    require('fs').writeFile(file, JSON.stringify(obj, null, 2), 'utf8', (err) => {
        if (err) logger.log('error', "dump error: ", err);
    });
}

const commandsWrapper = args => verify(logger,
    checker(
        vals.checkArgsLength(args, 0)
    ),
    () => {
        const cmds = Object.keys(CMD).join(", ");
        logger.log('info', doc.cmd.commands, args[0], cmds);
    }
)

const getWrapper = args => verify(logger,
    checker(
        vals.checkArgsRange(args, 0, 1)
    ),
    () => {
        if (config.isValidKey(args[1])
            || args[1] === undefined) {

            const res = config.get(args[1]);
            const val = typeof(res) === 'object' ?
                JSON.stringify(res) : "".concat(res);

            const msg = args[1] ? args[1].concat(': %s') : "%s";
            
            logger.log('debug', [typeof(res), args[1] || 'all'].join(': '));
            logger.log('info', msg, val);
        } else
            logger.log('warn', doc.cmd.invalidKey, args[0], args[1]);
    }
)

const setWrapper = args => verify(logger,
    checker(
        vals.checkArgsLength(args, 2)
    ),
    () => {
        if (config.isValidKey(args[1])) {
            const type = config.checkType(args[1]);
            let val = args[2];
            // Don't mutate val if type is 'string'
            if (type === 'number') 
                val = parseInt(val, 10);
            else if (type === 'boolean')
                val = (val === "true");
            else if (type === 'object')
                val = undefined;

            if (val === undefined)
                logger.log('warn', doc.cmd.cannotSetObject, args[0], args[1]);
            else {
                const res = config.set(args[1], val);
                if (res) {
                    if (args[1] === 'password')
                        val = "****";
                    logger.log('info', [args[0], args[1], val].join(': '));
                }
            }
        } else
            logger.log('warn', doc.cmd.invalidKey, args[0], args[1]);
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
        logger.log('debug', doc.debug.joinChat, args[0], target);
    }
)

const addFriendWrapper = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsLength(args, 1),
        vals.typeSteamId(args[0], args[1])
    ),
    () => {
        ui.steam.friends.addFriend(args[1]);
        logger.log('info', doc.cmd.addedFriend, args[0], args[1]);
    }
)

const autojoinWrapper = args => verify(logger,
    checker(
        vals.checkArgsRange(args, 0, 2)
    ),
    () => {
        switch (args[1]) {
            case 'add': 
                autojoinAdd(args);
                break;
            case 'rm': case 'remove':
                autojoinRemove(args);
                break;
            case 'run':
                autojoinRun(args);
                break;
            default:
                logger.log('info', doc.autojoin.noAction, args[0]);
        }
    }
)

function autojoinAdd([ cmd, action, val ]) {
    const add = (target) => {
        const autojoin = config.get('autojoin');
        if (autojoin.includes(target)) {
            logger.log('warn', doc.autojoin.alreadyAdded, cmd, target);
        } else {
            const arr = autojoin.concat(target);
            config.set('autojoin', arr);
            logger.log('info', "%s: %s", cmd, JSON.stringify(arr));
        }
    }

    if (val && val.length === CHATIDLEN) {
        add(val);
    } else if (val) {
        logger.log('warn', doc.autojoin.invalidChatId, cmd, val);
    } else if (session.currentChat.length === CHATIDLEN) {
        add(session.currentChat);
    } else {
        logger.log('warn', doc.autojoin.addError, cmd);
    }
}

function autojoinRemove([ cmd, action, val ]) {
    const remove = (target, autojoin) => {
        if (autojoin.includes(target)) {
            const arr = autojoin.filter(e => e != target);
            config.set('autojoin', arr);
            logger.log('info', "%s: %s", cmd, JSON.stringify(arr));
        } else {
            logger.log('warn', doc.autojoin.notInArray, cmd, target);
        }
    }

    const autojoin = config.get('autojoin');
    if (val && val.length === CHATIDLEN) {
        remove(val, autojoin);
    } else if (val && autojoin[val]) {
        remove(autojoin[val], autojoin);
    } else if (val === undefined && 
        session.currentChat.length === CHATIDLEN) {
        remove(session.currentChat, autojoin);
    } else {
        logger.log('warn', doc.autojoin.removeError, cmd);
    }
}

const autojoinRun = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsLength(args, 1)
    ),
    () => {
        const autojoin = config.get('autojoin');
        autojoin.forEach(id => {
            if (!session.chats.includes(id)) {
                ui.steam.friends.joinChat(id);
                logger.log('debug', doc.debug.joinChat, args[0], id);
            }
        });
    }
)

const blockUserWrapper = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsLength(args, 1),
        vals.typeSteamId(args[0], args[1])
    ),
    () => {
        ui.steam.friends.setIgnoreFriend(args[1], true, EResult => {
            var res = eresultMsg(EResult);
            logger.log('info', doc.msg.steamResponse, args[0], res);
        });
    }
)

const unblockUserWrapper = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsLength(args, 1),
        vals.typeSteamId(args[0], args[1])
    ),
    () => {
        ui.steam.friends.setIgnoreFriend(args[1], false, EResult => {
            var res = eresultMsg(EResult);
            logger.log('info', doc.msg.steamResponse, args[0], res);
        });
    }
)

const nickWrapper = args => verify(logger,
    checker(
        vals.isConnected(),
        vals.checkArgsLength(args, 1)
    ),
    () => {
        ui.steam.friends.setPersonaName(args[1]);
        logger.log('info', doc.cmd.changedName, args[0], args[1]);
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
    true, ui.inputbar.read
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
    true, ui.inputbar.read
)

const statusWrapper = args => verify(logger,
    checker(
        vals.checkArgsLength(args, 1)
    ),
    () => {
        const status = args[1].slice(0, 1).toUpperCase()
            .concat(args[1].slice(1)); // capitalize first letter

        if (status in ui.steam.Steam.EPersonaState && 
            status !== "Max" && status !== "Offline") {

            const target = ui.steam.Steam.EPersonaState[status];
            session.state = target;

            if (session.connected) 
                ui.steam.friends.setPersonaState(target);
            // if offline, setPersonaState will run in clientLogonHandler

            logger.log('info', doc.cmd.statusChanged, args[0], status);
        } else {
            logger.log('warn', doc.cmd.invalidStatus, args[0], status);
        }
    }
)

const switchChatWrapper = args => verify(logger,
    checker(
        vals.checkArgsLength(args, 1),
        vals.typeNumber(args[0], args[1])
    ),
    () => {
        if (session.chats[parseInt(args[1]) - 1] === undefined) {
            logger.log('silly', doc.cmd.chatNotExist, args[0], args[1]);
        } else {
            ui.chatwin.switchChat(session.chats[parseInt(args[1]) - 1]);
            logger.log('silly', doc.debug.switchChat, args[0], args[1]);
        }
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
