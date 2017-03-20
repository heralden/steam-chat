var blessed = require('blessed');

//var config = require('../config');
var session = require('../app');

var session = require('../app')
  , screen = require('./screen')
  , statusUpdate = require('./statusbar').statusUpdate;

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
        //width: screen.width - config.get('userlistwidth') - 1,
        width: screen.width - 25 - 1,
        height: screen.height - 2,
        //scrollback: config.get('scrollback'),
        scrollback: 1000,
        tags: true
    });
    screen.append(chatWins[ID]);
    chatWins[ID].setBack();
    screen.render();
}

function print(ID, text) {
    chatWins[ID].add(text);
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

    statusUpdate('w' + session.chats.indexOf(ID));
    statusUpdate('p' + ID);

    process.nextTick(() => {
        statusUpdate('c' + ID);
    });
}
