var blessed = require('blessed');

var logger = require('../logger')
  , config = require('../config')
  , session = require('../app')
  , { safeGet, getPersonaColor } = require('../helpers');

var ui = require('./ui');

var box = {};

// TODO: implement showGames()

module.exports = { 
    box, 
    updateFriend,
    updateGroup,
    clearList: () => box.setContent(""),
    listSelect,
    findFriend,
    createBox: (screen) => {
        box = blessed.box({
            top: 0,
            right: 0,
            width: config.get('userlistwidth') - 1,
            height: "100%-2",
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
        if (steamID in session.users) {
            addUser(session.users[steamID]);
        }
    });

    sortArr();
    updateBox();
}

function updateGroup(chatID) {

    clearArr();

    const clan = safeGet(session.clans, chatID, 'members');
    for (var steamID in clan) {
        if (steamID in session.users) {
            addUser(session.users[steamID]);
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

function addUser(user) {
    var color = "cyan-fg"
      , state = "online";

    if (user.persona_state in list) {
        color = getPersonaColor(user.persona_state);
        state = user.persona_state;
    }

    var name = `{${color}}${user.player_name}{/${color}}`; 

    list[state].push(name);
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
