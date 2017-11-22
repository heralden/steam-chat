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
        userwidth = config.get('userlistwidth') - 1;
        box = blessed.box({
            top: 0,
            right: 0,
            width: userwidth,
            height: "100%-2",
            tags: true,
            style: { scrollbar: { bg: 'blue' } }
        });
        screen.append(box);
    }
};

var userwidth;
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

    clearList();

    session.friends.forEach((steamID) => {
        if (steamID in session.users) {
            addUser(session.users[steamID]);
        }
    });

    sortList();
    updateBox();
}

function updateGroup(chatID) {

    clearList();

    const clan = safeGet(session.clans, chatID, 'members');
    for (var steamID in clan) {
        if (steamID in session.users) {
            addUser(session.users[steamID]);
        }
    }

    sortList();
    updateBox();
}

function addUser(user) {
    var state = list.arrOrder.includes(user.persona_state) ? 
        user.persona_state : 
        "online";
    list[state].push(user.player_name);
}

function clearList() {
    list.arrOrder.forEach(
        (arr) => list[arr].length = 0
    );
}

function sortList() {
     list.arrOrder.forEach(
        (arr) => list[arr].sort(
            (a, b) => a.localeCompare(b)
        )
    );
}
   
function updateBox() { 

    box.setContent("");

    list.arrOrder.forEach((state) => {

        const color = getPersonaColor(state);

        const arr = list[state].map((str) => {
            if (str.length > userwidth) 
                return `{${color}}${str.slice(0, userwidth-1)}{/${color}}$`
            else
                return `{${color}}${str}{/${color}}`;
        });

        if (arr.length > 0)
            box.insertBottom(arr);
    });

    if (box.getContent().length > 0)
        box.deleteLine(0);

    ui.screen.render();
}

function coloredList() {
    var local = {};

    list.arrOrder.forEach((state) => {

        const color = getPersonaColor(state);

        local[state] = list[state].map(
            (name) => `{${color}}${name}{/${color}}`
        );

    });

    return local;
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
        const colored = coloredList();
        var names = list.arrOrder.reduce(
            (acc, e) => acc.concat(colored[e]), []
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
