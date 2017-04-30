var blessed = require('blessed');

var keys = require('../keys.json');

var session = require('../app')
// var steamFriends = require('../steam/steam.js').steamFriends; //testing: uncomment
  , screen = require('./screen')
  , chatwin = require('./chatwin')
  , cmd = require('./cmd');

var box = blessed.textbox({
    grabKeys: true,
    inputOnFocus: false,
    bottom: 0,
    height: 1
});

module.exports = { box, read };

box.on('keypress', (key, data) => {
    switch (data.full) {
        case 'C-u': editWrapper(edit.clearLine); break;
        case 'C-y': editWrapper(edit.yank); break;
        case 'C-w': editWrapper(edit.deleteWord); break;
        default: 
            if (data.ctrl || data.meta || data.code) {
                if (keys.hasOwnProperty(data.full)) {
                    var args = keys[data.full].split(' ');
                    cmd(args);
                }
            }
    }
});

function read() {
    box.readInput(() => {
        eval(box.getValue());
        box.clearValue();
        screen.render();
        read();
    });
}

function eval(msg) {
    if (msg.charAt(0) == '/') {
        var args = msg.substring(1).split(' ');
        cmd(args);
    } else {
        chatwin.print('log', msg);
        //testing - add steamFriends.sendMessage after checking currentChat
    }
}

var editWrapper = (func) => {
    box.setValue(func(box.getValue()));
    screen.render();
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
