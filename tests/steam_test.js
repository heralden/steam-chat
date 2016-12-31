var winston = require('winston');
var sinon = require('sinon');

var logger = require('../lib/logger.js');
var config = require('../lib/config.js');

var steam = require('../lib/steam/steam.js');
var ui = require('../lib/ui/ui.js');

logger.transports.customLogger.level = "debug";

sinon.stub(ui, "disconnected", () => {
    console.log("disconnected");
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
sinon.stub(ui, "log", (msg) => {
    console.log("log: " + msg);
});
sinon.stub(ui, "enteredChat", () => {
    console.log("enteredChat");
});
sinon.stub(ui, "activity", () => {
    console.log("activity");
});

setTimeout(() => { steam.steamClient.disconnect() }, 30*1000);
