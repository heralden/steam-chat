var blessed = require('blessed');

var config = require('../config')
  , session = require('../app')
  , { getPersonaColor } = require('../helpers');
const { CHATIDLEN, STEAMIDLEN } = require('../const');

var ui = require('./ui');

module.exports = { 
    newChat, 
    deleteChat,
    print,
    message,
    scrollBack, 
    scrollForward,
    scrollBottom,
    switchChat
};

var chatWins = {};

function newChat(ID) {
    session.chats.push(ID);
    chatWins[ID] = blessed.log({
        top: 0,
        left: 0,
        width: "100%-".concat(config.get('userlistwidth') + 1),
        height: "100%-2",
        scrollback: config.get('scrollback'),
        tags: true
    });
    ui.screen.append(chatWins[ID]);
    chatWins[ID].setBack();
    ui.screen.render();
}

function deleteChat(ID) {
    var index = session.chats.indexOf(ID);
    session.chats.splice(index, 1);

    chatWins[ID].destroy();

    switchChat(session.lastChat);
}

function print(ID, text) {
    if (chatWins[ID] === undefined) 
        newChat(ID);

    chatWins[ID].add(
        `{blue-fg}${ui.statusbar.time()} - {/blue-fg}${text}`
    );

    if (session.currentChat != ID) {
        if (ID.toString().length == STEAMIDLEN) {
            ui.statusbar.statusUpdate('v'
                + session.chats.indexOf(ID));
        } else {
            ui.statusbar.statusUpdate('u'
                + session.chats.indexOf(ID));
        }
    }
}

function message(ID, user, persona, msg) {
    var color = getPersonaColor(persona);
    print(ID, `{${color}}${user}{/${color}}: ${msg}`);
}

function scrollBack() {
    var curr = session.currentChat;
    chatWins[curr].scroll(-chatWins[curr].height + 2);
    ui.screen.render();
}

function scrollForward() {
    var curr = session.currentChat;
    chatWins[curr].scroll(chatWins[curr].height + 2);
    ui.screen.render();
}

function scrollBottom() {
    var curr = session.currentChat;
    chatWins[curr].setScrollPerc(100);
    ui.screen.render();
}

function switchChat(ID) {
    if (session.chats.includes(session.currentChat))
        session.lastChat = session.currentChat;
    else 
        session.lastChat = "log";

    session.currentChat = ID;

    chatWins[ID].setFront();
    ui.screen.render();

    ui.statusbar.statusUpdate('r' + session.chats.indexOf(ID));
    ui.statusbar.statusUpdate('w2' + session.chats.indexOf(ID));
    ui.statusbar.statusUpdate('p' + ID);

    setImmediate(
        () => {
            if (ID.length === CHATIDLEN)
                ui.userwin.updateGroup(ID);
            else
                ui.userwin.updateFriend();

            ui.statusbar.statusUpdate('c');
        }
    );
}
