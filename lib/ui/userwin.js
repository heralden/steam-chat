var blessed = require('blessed');

var logger = require('../logger')
  , config = require('../config')
  , session = require('../app')
  , { safeGet, getPersonaColor } = require('../helpers');
const { CHATIDLEN } = require('../const');

var ui = require('./ui');

var box = {};

module.exports = { 
    box, 
    listUpdate,
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

function listUpdate() {
    const curr = session.currentChat;

    if (curr.length === CHATIDLEN)
        updateGroup(curr);
    else
        updateFriend();
}

function updateFriend() {

    clearList();

    session.friends.forEach((steamID) => {
        if (steamID in session.users) {
            let state = session.users[steamID].persona_state;
            if (!list.arrOrder.includes(state)) state = 'online';
            list[state].push(steamID);
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
            let state = session.users[steamID].persona_state;
            if (!list.arrOrder.includes(state)) state = 'online';
            list[state].push(steamID);
        }
    }

    sortList();
    updateBox();
}

function clearList() {
    list.arrOrder.forEach(
        (arr) => list[arr].length = 0
    );
}

function sortList() {
    list.arrOrder.forEach(
        (arr) => list[arr].sort((a, b) => {
            const nameA = session.users[a].player_name;
            const nameB = session.users[b].player_name;
            return nameA.localeCompare(nameB);
        })
    );
}

function formatName(name, color) {
    return `{${color}}${name}{/${color}}`;
}
   
function updateBox() { 

    box.setContent("");

    const scroll = session.scroll_user
        , games  = session.show_games;

    list.arrOrder.forEach((state) => {

        const color = getPersonaColor(state);

        // Create a new array with formatted names
        const arr = list[state].map((ID) => {

            let name;
            if (games && session.users[ID].game_name.length)
                name = session.users[ID].game_name;
            else
                name = session.users[ID].player_name;

            if (name.length >= userwidth) {
                // Handle overflow

                if (scroll) return '$'.concat(formatName(
                    name.slice(userwidth-1), color
                ));
                else return formatName(
                    name.slice(0, userwidth-1), color
                ).concat('$');

            } else {
                return formatName(name, color);
            }
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

        local[state] = list[state].map((ID) => {
            const name = session.users[ID].player_name;
            return `{${color}}${name}{/${color}}`;
        });

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
    for (let id in session.users) {
        if (session.users[id].player_name.toLowerCase() == name)
            return { id: id, name: session.users[id].player_name };
    }
    // Search for partial matches
    for (let id in session.users) {
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
