var blessed = require('blessed');

var logger = require('../logger')
  , config = require('../config')
  , session = require('../app');

var ui = require('./ui');

var box = {};

// TODO: implement showGames()

module.exports = { 
    box, 
    updateFriend,
    updateGroup,
    clearList: () => box.setContent(""),
    getPersonaColor,
    listSelect,
    findFriend,
    createBox: (screen) => {
        box = blessed.box({
            top: 0,
            right: 0,
            width: config.get('userlistwidth') - 1,
            height: ui.screen.height - 2,
            tags: true,
            style: { scrollbar: { bg: 'blue' } }
        });
        screen.append(box);
    }
};

var list = {
    online:  [],
    ingame:  [],
    busy:    [],
    away:    [],
    snooze:  [],
    offline: [],
    arrOrder: [ 'online', 'ingame', 'busy',
                'away', 'snooze', 'offline' ]
};

function updateFriend() {

    clearArr();

    session.friends.forEach((steamID) => {
        if (session.users.hasOwnProperty(steamID)) {
            addUser(session.users[steamID], (user, state) => {
                list[state].push(user);
            });
        }
    });

    sortArr();
    updateBox();
}

function updateGroup(chatID) {

    clearArr();

    for (var steamID in session.clans[chatID].members) {
        if (session.users.hasOwnProperty(steamID)) {
            addUser(session.users[steamID], (user, state) => {
                list[state].push(user);
            });
        }
    }

    sortArr();
    updateBox();
}

function clearArr() {
    list.arrOrder.forEach(
        (arr) => list[arr].length = 0
    );
}

function sortArr() {
     list.arrOrder.forEach(
        (arr) => list[arr].sort(
            (a, b) => a.localeCompare(b)
        //TODO use .replace() to remove curly bracket contents if wrong order
        )
    );
}
   
function updateBox() { 

    box.setContent("");

    list.arrOrder.forEach((arrName) => {
        var arr = list[arrName];
        if (arr.length > 0)
            box.insertBottom(arr);
    });

    if (box.getContent().length > 0)
        box.deleteLine(0);

    ui.screen.render();
}

function addUser(user, cb) {
    var userFormat = "{%}&{/%}"
      , color = "cyan-fg"
      , stateArr = "online";

    if (list.hasOwnProperty(user.persona_state)) {

        color = getPersonaColor(user.persona_state);

        stateArr = user.persona_state;

    } else { 
        logger.log('debug', "Unhandled persona_state in updateList");
    }

    var username = userFormat.replace("&", user.player_name)
                             .replace(/%/g, color);

    cb(username, stateArr);
}

function getPersonaColor(personaState) {
    switch (personaState) {
        case 'ingame':  return "green-fg";
        case 'online':  return "blue-fg";
        case 'busy':    return "red-fg";
        case 'away':    return "yellow-fg";
        case 'snooze':  return "white-fg";
        case 'offline': return "grey-fg";
        default:        return "cyan-fg";
    }
}

function newListSelect(arr) { 
    return blessed.list({
        top: 0,
        right: 0,
        width: config.get('userlistwidth') - 1,
        height: ui.screen.height - 2,
        tags: true,
        keys: true,
        vi: true,
        items: arr,
        style: { selected: { fg: 'cyan' } }
    });
}

function listSelect(arr, cb) {
    var selector = newListSelect(arr);
    ui.screen.append(selector);
    ui.screen.render();

    process.nextTick(() => {
        selector.pick((err, item) => {
            if (err) {
                logger.log('error', "Error with listSelect", err, item);
                cb(undefined);
            }
            cb(item);
            selector.destroy();
        });
    });
}

function lookupName(name) {
    name = name.toLowerCase();
    // Search for perfect matches
    for (var id in session.users) {
        if (session.users[id].player_name.toLowerCase() == name)
            return { id: id, name: session.users[id].player_name };
    }
    // Search for partial matches
    for (var id in session.users) {
        if (session.users[id].player_name
            .toLowerCase().slice(0, name.length) == name)
            return { id: id, name: session.users[id].player_name };
    }
    // Return null for unsuccessful match
    return { id: null, name: undefined };
}

function findFriend(arg, cb) {
    if (arg) {
        // Find by steamID
        var target = Object.keys(session.users).find((id) => id == arg);
        if (target) cb(target, target);
        else {
            // Find by player_name
            var res = lookupName(arg);
            cb(res.id, res.name);
        }
    } else {
        var names = list.arrOrder.reduce(
            (acc, e) => acc.concat(list[e]), []
        );
        listSelect(names, name => {
            if (name === undefined) {
                // No item selected; take no further action
                cb(undefined); 
            } else {
                var res = lookupName(name);
                cb(res.id, name);
            }
        });
    }
}
