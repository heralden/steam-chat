var sinon = require('sinon');

var logger = require('../lib/logger');

var steam = require('../lib/steam/steam')
  , ui = require('../lib/ui/ui');

logger.transports.console.level = 'debug';

sinon.stub(ui, "connected", () => {
    console.log("connected");
});
sinon.stub(ui, "disconnected", () => {
    console.log("disconnected");
});
sinon.stub(ui, "updateNick", () => {
    console.log("updateNick");
});
sinon.stub(ui, "rejoinGroupChats", () => {
    console.log("rejoinGroupChats");
});
sinon.stub(ui, "autojoinGroupChats", () => {
    console.log("autojoinGroupChats");
});
sinon.stub(ui, "isTyping", () => {
    console.log("isTyping");
});
sinon.stub(ui, "message", () => {
    console.log("message");
});
sinon.stub(ui, "groupMessage", () => {
    console.log("groupMessage");
});
sinon.stub(ui, "enteredChat", () => {
    console.log("enteredChat");
});
sinon.stub(ui, "activity", () => {
    console.log("activity");
});
