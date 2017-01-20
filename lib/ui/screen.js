var blessed = require('blessed');

var screen = blessed.screen({
    autoPadding: true,
    fullUnicode: true,
    fastCSR: true
});

screen.title = "steam-chat";

module.exports = screen;
