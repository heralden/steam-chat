var blessed = require('blessed');

var config = require('../config')
  , session = require('../app');
const {CHATIDLEN, STEAMIDLEN} = require('../const');

var screen = require('./screen')
  , statusbar = require('./statusbar');

module.exports = { 
    newChat, 
    print, 
    scrollBack, 
    scrollForward,
    switchChat
};

var chatWins = {};

function newChat(ID) {
    session.chats.push(ID);
    chatWins[ID] = blessed.log({
        top: 0,
        left: 0,
        width: screen.width - config.get('userlistwidth') - 1,
        height: screen.height - 2,
        scrollback: config.get('scrollback'),
        tags: true
    });
    screen.append(chatWins[ID]);
    chatWins[ID].setBack();
    screen.render();
}

function print(ID, text) {
    if (chatWins[ID] === undefined) 
        newChat(ID);

    chatWins[ID].add(
        `{blue-fg}${statusbar.time()} - {/blue-fg}${text}`
    );

    if (session.currentChat != ID) {
        if (ID.toString().length == STEAMIDLEN) {
            statusbar.statusUpdate('v'
                + session.chats.indexOf(ID));
        } else {
            statusbar.statusUpdate('u'
                + session.chats.indexOf(ID));
        }
    }
}

function scrollBack() {
    var curr = session.currentChat;
    chatWins[curr].scroll(-chatWins[curr].height + 2);
    screen.render();
}

function scrollForward() {
    var curr = session.currentChat;
    chatWins[curr].scroll(chatWins[curr].height + 2);
    screen.render();
}

function switchChat(ID) {
    session.currentChat = ID;
    chatWins[ID].setFront();
    screen.render();

    statusbar.statusUpdate('r' + session.chats.indexOf(ID));
    statusbar.statusUpdate('w0' + session.chats.indexOf(ID));
    statusbar.statusUpdate('p' + ID);

    setImmediate(
        () => statusbar.statusUpdate('c' + ID)
    );
}
