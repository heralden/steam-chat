var blessed = require('blessed');

var logger = require('../logger')
  , session = require('../app')
  , { bool, safeGet, getPersonaColor } = require('../helpers');
const { CHATIDLEN, STEAMIDLEN } = require('../const');

var ui = require('./ui');

var box = {};

module.exports = { 
    box, 
    statusUpdate,
    time: () => stats.obj.time
        .replace(/\s*{cyan-fg}(\[|\]){\/cyan-fg}/g, ""),
    createBox: (screen) => {
        box = blessed.box({
            bottom: 1,
            height: 1,
            width: "100%",
            tags: true,
            style: { fg: 'white', bg: 'blue' }
        });
        screen.append(box);
    }
};

var stats = {
    obj: {
        time:       "",
        nick:       "",
        current:    "",
        write:      "",
        people:     "",
        unread:     "",
        disconnect: ""
    }, 
    unread: [],
    write: [],
    writeTimeout: null
};

function statusUpdate(call) {
    var type = call.substring(0, 1)
      , arg = call.substring(1);
    switch (type) {
        case 'c': current();        break;
        case 'd': disconnect(arg);  break;
        case 'n': nick(arg);        break;
        case 'p': people(arg);      break;
        case 'r': read(arg);        break;
        case 't': time(arg);        break;
        case 'u': unread(arg);      break;
        case 'v': unreadPm(arg);    break;
        case 'w': write(arg);       break;
        default:
            logger.log('debug', "Invalid statusUpdate call: %s %s", type, arg);
    }
    box.setContent(
        stats.obj.time
        + stats.obj.nick
        + stats.obj.current
        + stats.obj.write
        + stats.obj.people
        + stats.obj.unread
        + stats.obj.disconnect
    );
    ui.screen.render();
}

// c
// Updates the name of the current window
function current() {
    var currChat = session.currentChat;
    var currIndex = session.chats.indexOf(currChat) + 1;
    var currName = "undefined";

    if (currChat === "log")
        currName = "log";
    else if (currChat.length == STEAMIDLEN) 
        currName = session.users[currChat].player_name;
    else if (currChat.length == CHATIDLEN)
        currName = session.clans[currChat].clan_name;

   stats.obj.current = helpers.addSep(currIndex + ':' + currName);
}

// d{0|1}
// Displays or hides a disconnected notice
function disconnect(arg) {
    if (bool(arg))
        stats.obj.disconnect = helpers.templDisconnect;
    else
        stats.obj.disconnect = "";
}

// n{state}
// Updates your nickname as well as color
function nick(arg) {
    var color = "cyan-fg";
    if (arg !== 'online') // blue-fg won't be visible due to blue-bg
        color = getPersonaColor(arg);

    const nick = session.steamNick;
    stats.obj.nick = helpers.addSep(`{${color}}${nick}{/${color}}`);
}

// p{ID}
// Updates the count of different users in group chat or friends list
function people(arg) {
    var people = "";
    if (arg.length === CHATIDLEN) {
        let p = {
            admin: 0,
            moderator: 0,
            member: 0
        };
        const members = safeGet(session.clans, arg, 'members');
        for (var steamID in members) {
            const rank = members[steamID];
            p[rank] += 1;
        }
        people = people.concat(`${p.admin}A ${p.moderator}M ${p.member}`);
    } else {
        let p = {
            online: 0,
            ingame: 0,
            busy: 0,
            away: 0,
            snooze: 0,
            offline: 0
        };
        session.friends.forEach((steamID) => {
            if (steamID in session.users) {
                const persona = session.users[steamID].persona_state;
                p[persona] += 1;
            }
        });
        for (var persona in p) {
            const count = p[persona];
            if (count < 1) continue;

            var color = "cyan-fg";
            if (persona !== 'online') // blue-fg won't be visible due to blue-bg
                color = getPersonaColor(persona);

            if (people.length > 0) 
                people = people.concat(" ");
            people = people.concat(`{${color}}${count}{/${color}}`);
        }
    }
    stats.obj.people = helpers.addSep(people);
}

// r{i}
// Removes index for both group chat and PM
function read(arg) {
    var index = parseInt(arg) + 1
      , i = stats.unread.indexOf(index)
      , i_pm = stats.unread.indexOf(helpers.addPm(index));

    if (i > -1) {
        stats.unread.splice(i, 1);
        helpers.setUnread(); 
    } else if (i_pm > -1) {
        stats.unread.splice(i_pm, 1);
        helpers.setUnread(); 
    }
}

// t{str}
// Update time string
function time(arg) {
    stats.obj.time = helpers.addSep(arg);
}

// u{i}
// Add index for unread group chat
function unread(arg) {
    var index = parseInt(arg) + 1;

    if (stats.unread.indexOf(index) < 0) {
        stats.unread.push(index);
        helpers.setUnread(); 
    }
}

// v{i}
// Add index for unread PM
function unreadPm(arg) {
    var index = parseInt(arg) + 1
      , elem = helpers.addPm(index);

    if (stats.unread.indexOf(elem) < 0) {
        stats.unread.push(elem);
        helpers.setUnread(); 
    }
}

// w{0|1}{i}
// Adds or remove index for isTyping partner in PM
function write(arg) {
    var add = arg.substring(0, 1)
      , ID = arg.substring(1)
      , sw = stats.write;

    if (bool(add)) {
        if (sw.indexOf(ID) < 0) sw.push(ID);
        clearTimeout(stats.writeTimeout);
        stats.writeTimeout = setTimeout(() => {
            statusUpdate('w0' + ID);
        }, 15*1000);
    } else {
        var i = sw.indexOf(ID);
        if (i > -1) {
            sw.splice(i, 1);
            clearTimeout(stats.writeTimeout);
        }
    }

    for (var elemID in stats.write) {
        if (session.currentChat == elemID) {
            stats.obj.write = helpers.addSep("...");
            break;
        }
    }
}


var helpers = {
    formatSep: " {cyan-fg}[{/cyan-fg}%{cyan-fg}]{/cyan-fg}",
    formatPm: "{red-fg}%{/red-fg}",
    templDisconnect: " {red-fg}[DISCONNECTED]{/red-fg}",
    addSep:
        (str) => str.length > 0 ? helpers.formatSep.replace("%", str) : "",
    addPm:
        (str) => helpers.formatPm.replace("%", str),
    sortChatID:
        (a, b) => a.toString().replace(/\D/g, '') 
                - b.toString().replace(/\D/g, ''),
    buildUnread:
        () => helpers.addSep(stats.unread.sort(helpers.sortChatID)),
    setUnread: 
        () => { stats.obj.unread = helpers.buildUnread() }
};
