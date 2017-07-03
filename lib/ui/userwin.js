var blessed = require('blessed');

var logger = require('../logger')
  , config = require('../config');

var session = require('../app')
  , screen = require('./screen');

var box = blessed.box({
    top: 0,
    right: 0,
    width: config.get('userlistwidth') - 1,
    height: screen.height - 2,
    tags: true,
    style: { scrollbar: { bg: 'blue' } }
});

// TODO: implement showGames()

module.exports = { 
    box, 
    updateFriend,
    updateGroup,
    clearList: () => box.setContent(""),
    getPersonaColor,
    listSelect
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
        // use .replace() to remove curly bracket contents if wrong order
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

    box.deleteLine(0);
    screen.render();
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
        height: screen.height - 2,
        tags: true,
        keys: true,
        vi: true,
        items: arr,
        style: { selected: { fg: 'cyan' } }
    });
}

function listSelect(arr, cb) {
    var list = newListSelect(arr);
    screen.append(list);
    screen.render();

    process.nextTick(() => {
        list.pick((err, item) => {
            if (err) {
                logger.log('error', "Error with listSelect", err, item);
                return 1;
            }
            cb(item);
            list.destroy();
        });
    });
}
