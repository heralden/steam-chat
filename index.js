var SteamChatClient = require('./steam.js')
  , Interface = require('./interface.js')
  , Keys = require('./keys.js');

var interface = new Interface();
var client = new SteamChatClient(interface);
var keys = new Keys(interface);

interface.buildUI();
interface.buildChat('log');
interface.input();
interface.loadClient(client);
keys.listen();
client.connect();
client.listen();

