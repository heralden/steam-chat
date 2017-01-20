var blessed = require('blessed');

var logger = require('../logger');
const {CHATIDLEN, STEAMIDLEN} = require('../const');

var session = require('../app')
  , screen = require('./screen');

var box = blessed.box({
    bottom: 1,
    height: 1,
    width: "100%",
    tags: true,
    style: { fg: 'white', bg: 'blue' }
});

module.exports = { box, statusUpdate };

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
        case 'a': away();           break;
        case 'c': current();        break;
        case 'd': disconnect(arg);  break;
        case 'n': nick();           break;
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
    screen.render();
}

function away() {
    stats.obj.nick = helpers.addSep(helpers.addAway(session.steamNick));
}

function current() {
    var currChat = session.currentChat;
    var currIndex = session.chats.indexOf(currChat);
    var currName = "undefined";

    if (currIndex == 0)
        currName = "log";
    else if (currChat.length == STEAMIDLEN) 
        currName = session.users[currChat].player_name;
    else if (currChat.length == CHATIDLEN)
        currName = session.clans[currChat].clan_name;

   stats.obj.current = helpers.addSep(currIndex + ':' + currName);
}

function disconnect(arg) {
    if (arg)
        stats.obj.disconnect = helpers.templDisconnect;
    else
        stats.obj.disconnect = "";
}

     
function nick() {
    stats.obj.nick = helpers.addSep(session.steamNick);
}

//TODO function people

function read(arg) {
    var index = parseInt(arg) + 1
      , i = unread.indexOf(index)
      , i_pm = unread.indexOf(helpers.addPm(index));

    if (i > -1) {
        stats.unread.splice(i, 1);
        helpers.setUnread(); 
    } else if (i_pm > -1) {
        stats.unread.splice(i_pm, 1);
        helpers.setUnread(); 
    }
}

function time(arg) {
    stats.obj.time = helpers.addSep(arg);
}

function unread(arg) {
    var index = parseInt(arg) + 1;

    if (stats.unread.indexOf(index) < 0) {
        stats.unread.push(index);
        helpers.setUnread(); 
    }
}

function unreadPm(arg) {
    var index = parseInt(arg) + 1
      , elem = helpers.addPm(index);

    if (stats.unread.indexOf(elem) < 0) {
        stats.unread.push(elem);
        helpers.setUnread(); 
    }
}

function write(arg) {
    var add = arg.substring(0, 1)
      , ID = arg.substring(1)
      , sw = stats.write;

    if (add) {
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
    formatAway: "{yellow-fg}%{/yellow-fg}",
    templDisconnect: " {red-fg}[DISCONNECTED]{/red-fg}",
    addSep:
        (str) => helpers.formatSep.replace("%", str),
    addPm:
        (str) => helpers.formatPm.replace("%", str),
    addAway:
        (str) => helpers.formatAway.replace("%", str),
    sortChatID:
        (a, b) => a.toString().replace(/\D/g, '') 
                - b.toString().replace(/\D/g, ''),
    buildUnread:
        () => helpers.addSep(stats.unread.sort(helpers.sortChatID)),
    setUnread: 
        () => stats.obj.unread = helpers.buildUnread()
};
