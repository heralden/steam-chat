var blessed = require('blessed');

var keys = require('../keys.json');

var config = require('../config')
  , session = require('../app')
  , { safeGet } = require('../helpers');

var ui = require('./ui');

var box = {};

module.exports = { 
    read,
    box,
    createBox: (screen) => {
        box = blessed.textbox({
            grabKeys: true,
            inputOnFocus: false,
            bottom: 0,
            height: 1
        });

        handleKeys(box);

        screen.append(box);
    }
};

function handleKeys(box) {
    box.on('keypress', (key, data) => {

        // Clear any active idle timeout
        clearTimeout(session.idle_timeout);
        // Start new timeout if /status hasn't been used
        if (session.state === ui.steam.Steam.EPersonaState.Online)
            idleTimer();

        switch (data.full) {
            case 'C-u': editWrapper(edit.clearLine); break;
            case 'C-y': editWrapper(edit.yank); break;
            case 'C-w': editWrapper(edit.deleteWord); break;
            default: 
                if (data.ctrl || data.meta || data.code) {
                    if (keys.hasOwnProperty(data.full)) {
                        var args = keys[data.full].split(' ');
                        ui.cmd(args);
                    }
                }
        }
    });
}

function read() {
    if (box instanceof blessed.textbox) {
        box.readInput(() => {
            eval(box.getValue());
            box.clearValue();
            ui.screen.render();
        });
    }
}

function eval(msg) {
    if (msg.charAt(0) == '/') {
        var args = msg.substring(1).split(' ');
        var halt = ui.cmd(args);
        if (halt !== true) read();
    } else {
        if (msg.length > 0) {
            const curr = session.currentChat;
            if (curr === 'log')
                ui.chatwin.print('log', msg);
            else if (session.connected) {
                ui.steam.friends.sendMessage(curr, msg);
                ui.chatwin.message(curr, 
                    session.steamNick, 'online', msg);
            }
        }
        read();
    }
}

var editWrapper = (func) => {
    box.setValue(func(box.getValue()));
    ui.screen.render();
};
var edit = {
    clearLine(text) {
        session.yank_buffer = text;
        return "";
    },
    deleteWord(text) {
        var i = helpers.indexOfLastSpace(text);
        session.yank_buffer = text.substring(i);
        return text.substring(0, i);
    },
    yank: (text) => text + session.yank_buffer
};

var helpers = {
    indexOfLastSpace: 
        (text) => text.replace(/\s+$/gm,'').lastIndexOf(' ') + 1
};

function idleTimer() {
    // Set personaState to online if not already
    if (session.connected) {
        const personaState = safeGet(session.users, 
            session.steamID, 'persona_state');
        if (personaState !== 'online') {
            ui.steam.friends.setPersonaState(
                ui.steam.Steam.EPersonaState.Online
            );
        }
    }

    // First start timeout for Away, then Snooze
    session.idle_timeout = setTimeout(() => {
        if (session.connected) {

            ui.steam.friends.setPersonaState(
                ui.steam.Steam.EPersonaState.Away
            );

            session.idle_timeout = setTimeout(() => {
                if (session.connected) {

                    ui.steam.friends.setPersonaState(
                        ui.steam.Steam.EPersonaState.Snooze
                    );

                }
            }, config.get('snooze_timeout'));

        }
    }, config.get('away_timeout'));
}
