var blessed = require('blessed');

var config = require('../config')
  , session = require('../app');
const {CHATIDLEN, STEAMIDLEN} = require('../const');

var scc = require('./ui');

module.exports = { 
    newChat, 
    deleteChat,
    print,
    message,
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
        width: scc.screen.width - config.get('userlistwidth') - 1,
        height: scc.screen.height - 2,
        scrollback: config.get('scrollback'),
        tags: true
    });
    scc.screen.append(chatWins[ID]);
    chatWins[ID].setBack();
    scc.screen.render();
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
        `{blue-fg}${scc.statusbar.time()} - {/blue-fg}${text}`
    );

    if (session.currentChat != ID) {
        if (ID.toString().length == STEAMIDLEN) {
            scc.statusbar.statusUpdate('v'
                + session.chats.indexOf(ID));
        } else {
            scc.statusbar.statusUpdate('u'
                + session.chats.indexOf(ID));
        }
    }
}

function message(ID, user, persona, msg) {
    var color = scc.userwin.getPersonaColor(persona);
    print(ID, `{${color}}${user}{/${color}}: ${msg}`);
}

function scrollBack() {
    var curr = session.currentChat;
    chatWins[curr].scroll(-chatWins[curr].height + 2);
    scc.screen.render();
}

function scrollForward() {
    var curr = session.currentChat;
    chatWins[curr].scroll(chatWins[curr].height + 2);
    scc.screen.render();
}

function switchChat(ID) {
    if (session.chats.includes(session.currentChat))
        session.lastChat = session.currentChat;
    else 
        session.lastChat = "log";

    session.currentChat = ID;

    chatWins[ID].setFront();
    scc.screen.render();

    scc.statusbar.statusUpdate('r' + session.chats.indexOf(ID));
    scc.statusbar.statusUpdate('w0' + session.chats.indexOf(ID));
    scc.statusbar.statusUpdate('p' + ID);

    setImmediate(
        () => scc.statusbar.statusUpdate('c' + ID)
    );
}
