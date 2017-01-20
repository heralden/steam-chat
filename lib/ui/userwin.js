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

module.exports = { box, updateList };

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

function updateList() {
    for (var steamID in session.friends) {

        var user = session.users[steamID];

        if (user.game_name.length > 0) {
            list.ingame.push(user.player_name);
            break;
        }

        switch (session.users[steamID].persona_state) {
            case 'online': 
                list.online.push(user.player_name);
                break;
            case 'busy': 
                list.busy.push(user.player_name);
                break;
            case 'away': 
                list.away.push(user.player_name);
                break;
            case 'snooze': 
                list.snooze.push(user.player_name);
                break;
            case 'offline': 
                list.offline.push(user.player_name);
                break;
            default:
                logger.log('debug', "Unhandled persona_state in updateList");
                list.online.push(user.player_name);
        }
    }

    for (var arr in list) {
        list[arr].sort(
            (a, b) => a.localeCompare(b)
        );
    }

    this.updateBox();
}

function updateBox() {
    for (var arr in list.arrOrder) {
        box.insertBottom(list[arr]);
    }
    /* 
    for (var elem in list[arr]) {
        box.insertBottom(elem);
    }
    */
}

// updateBox(), clearUsers(), showGames()

// updateBox()
// Use: To add: insertBottom(lines), insertLine(i, lines) or insertTop(lines)
//      To remove: (from index of array) deleteLine(i)
