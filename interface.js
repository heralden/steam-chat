var fs = require('fs');

module.exports = interface;

function interface() {
  this.blessed = require('blessed');
  this.program = this.blessed.program();

  this.screen = this.blessed.screen({
    autoPadding: true,
    fullUnicode: true,
    smartCSR: true,
    resizeTimeout: 600
  }); 

  this.session = {
    currentChat: 0,
    lastChat: 0,
    chat: [],
    status: ['','','','',''],
    unread: [],
    away: false,
    friends: {},
    groups: {},
    yankBuffer: ''
  };

  this.doc = JSON.parse(fs.readFileSync('doc.json'));

  if (fs.existsSync('config.json')) {
    var config = JSON.parse(fs.readFileSync('config.json'));
    this.userlistwidth = config.userlistwidth;
    this.scrollback = config.scrollback;
    this.autojoin = config.autojoin;
  } else {
    this.userlistwidth = 26;
    this.scrollback = 1000;
    this.autojoin = [];
  }

  if (process.env.NODE_ENV == 'debug') {
    this.session.debug = true;
  } else if (process.env.NODE_ENV == 'debug_v') { // print personaState and chatMsg events
    this.util = require('util');
    this.session.debug = true;
    this.session.debug_v = true;
  }

  this.screen.on('resize', function() { 
    this.resize();
  }.bind(this));
}

interface.prototype.loadClient = function(steamChatClient) {
  this.steam = steamChatClient;

  if (this.session.debug_v) {
    this.chatPrint("DBG: Debug mode level 2 has been activated!", 'log');
  } else if (this.session.debug) {
    this.chatPrint("DBG: Debug mode has been activated!", 'log');
  }
};

interface.prototype.buildUI = function() {
	this.userWin = this.blessed.box({
		top: 0,
		right: 0,
		width: this.userlistwidth - 1,
		height: this.screen.height - 2,
		tags: true,
		style: { scrollbar: { bg: 'blue' } }
	});
	this.screen.append(this.userWin);
	this.statusBar = this.blessed.box({
		bottom: 1,
		width: this.screen.width,
		height: 1,
		tags: true,
		style: { fg: 'white', bg: 'blue' }
	});
	this.screen.append(this.statusBar);
	this.inputBar = this.blessed.textbox({
		keys: true,
		inputOnFocus: false,
		bottom: 0,
		height: 1
	});
	this.screen.append(this.inputBar);
	this.line = this.blessed.line({
		right: this.userlistwidth - 1,
		height: this.screen.height - 2,
		orientation: 'vertical',
		type: 'line'
	});
	this.screen.append(this.line);
	this.screen.render();

  (function statusClock() {
    var time = this.currentTime();
    var seconds = parseInt(time.slice(3,5));
    var timeoutDelay = (60 - seconds) * 1000;
    this.statusUpdate('t' + time);
    setTimeout(statusClock.bind(this), timeoutDelay);
  }).bind(this)();

  this.statusUpdate('d1');
};

interface.prototype.resize = function() {
    this.resizeUI();
    for (var index in this.session.chat) {
      if (this.session.chat.hasOwnProperty(index)){
        this.resizeChat(this.session.chat[index]);
      }
    }
    this.switchChat(this.session.chat[this.session.currentChat]);
};

interface.prototype.resizeUI = function() {

  var userWinContent = this.userWin.getContent();
  this.userWin.destroy();
	this.userWin = this.blessed.box({
		top: 0,
		right: 0,
		width: this.userlistwidth - 1,
		height: this.screen.height - 2,
		tags: true,
		style: { scrollbar: { bg: 'blue' } }
	});
	this.screen.append(this.userWin);
  this.userWin.insertTop(userWinContent);

  var statusBarContent = this.statusBar.getContent();
  this.statusBar.destroy();
	this.statusBar = this.blessed.box({
		bottom: 1,
		width: this.screen.width,
		height: 1,
		tags: true,
		style: { fg: 'white', bg: 'blue' }
	});
	this.screen.append(this.statusBar);
  this.statusBar.setContent(statusBarContent);

  this.line.destroy();
	this.line = this.blessed.line({
		right: this.userlistwidth - 1,
		height: this.screen.height - 2,
		orientation: 'vertical',
		type: 'line'
	});
	this.screen.append(this.line);
	this.screen.render();

};

interface.prototype.buildChat = function(ID) {
  this.session.chat.push(ID);
  this.session[ID] = this.blessed.log({
    top: 0,
    left: 0,
    width: this.screen.width - this.userlistwidth - 1,
    height: this.screen.height - 2,
    scrollback: this.scrollback,
    tags: true
  });
  this.screen.append(this.session[ID]);
  this.session[ID].setBack();
  this.screen.render();
};

interface.prototype.resizeChat = function(ID) {
  var content = this.session[ID].getContent();
  this.session[ID].destroy();
  this.session[ID] = this.blessed.log({
    top: 0,
    left: 0,
    width: this.screen.width - this.userlistwidth - 1,
    height: this.screen.height - 2,
    scrollback: this.scrollback,
    tags: true
  });
  this.screen.append(this.session[ID]);
  this.session[ID].add(content);
  this.session[ID].setBack();
  this.screen.render();
};

interface.prototype.switchChat = function(targetChat) {
  if (this.session[targetChat] !== undefined) {
    this.session.lastChat = this.session.currentChat;
    this.session.currentChat = this.session.chat.indexOf(targetChat);
    this.session[targetChat].setFront();
    this.screen.render();
    this.statusUpdate('w' + this.session.chat.indexOf(targetChat));
    this.statusUpdate('p' + targetChat);
    process.nextTick(function() {
      this.statusUpdate('c' + targetChat);
    }.bind(this));
    this.updateList();
  }
};

interface.prototype.input = function() {
  this.screen.render();
  this.inputBar.readInput( function() {
    var text = this.inputBar.getValue();
    if (text.charAt(0) == '/') {
      this.inputBar.clearValue();
      this.interpretCommand(text.substring(1));
    } else {
      this.inputBar.clearValue();
      this.input();
      if (this.session.currentChat == 0) {
        this.chatPrint(text, this.session.chat[this.session.currentChat]);
      } else if (this.steam.steamClient.connected) {
        if (this.session.chat[this.session.currentChat].length == 18) { 
          if (this.steam.steamFriends.chatRooms.hasOwnProperty(this.session.chat[this.session.currentChat])) {
            this.steam.steamFriends.sendMessage(this.session.chat[this.session.currentChat], text);
            if (this.steam.steamFriends.personaStates.hasOwnProperty(this.steam.steamClient.steamID)) {
              this.chatPrint(this.steam.steamFriends.personaStates[this.steam.steamClient.steamID].player_name + ': ' + text, this.session.chat[this.session.currentChat]);
            } else {
              this.chatPrint('undefined: ' + text, this.session.chat[this.session.currentChat]);
            }
          } else {
            this.chatPrint("Error: You are not currently in this group chat.", 'log');
          }
        } else {
          this.steam.steamFriends.sendMessage(this.session.chat[this.session.currentChat], text);
          if (this.steam.steamFriends.personaStates.hasOwnProperty(this.steam.steamClient.steamID)) {
            this.chatPrint(this.steam.steamFriends.personaStates[this.steam.steamClient.steamID].player_name + ': ' + text, this.session.chat[this.session.currentChat]);
          } else {
            this.chatPrint('undefined: ' + text, this.session.chat[this.session.currentChat]);
          }
        }
      } else {
        this.chatPrint("Error: No connection with Steam.", 'log');
      }
    }
  }.bind(this));
};

interface.prototype.currentTime = function() {
  var date = new Date();
  var current_hour = ('0' + date.getHours()).slice(-2);
  var current_minute = ('0' + date.getMinutes()).slice(-2);
  return current_hour + ':' + current_minute;
};

interface.prototype.chatPrint = function(text, targetChat) {
  this.session[targetChat].add(this.currentTime() + ' - ' + text);
  if (this.session.currentChat !== this.session.chat.indexOf(targetChat)) {
    if (targetChat.toString().length == 17) { 
      this.statusUpdate('v' + this.session.chat.indexOf(targetChat));
    } else {
      this.statusUpdate('u' + this.session.chat.indexOf(targetChat));
    }
  }
};

interface.prototype.interpretCommand = function(command) {
	var cmd = command.split(' ', 1).join('').trim(),
	args = command.substring(command.indexOf(cmd) + cmd.length + 1).trim();
	switch(cmd.toLowerCase()) {
		case 'quit':
			return process.exit(0);
    case 'debug':
      this.session.debug = !this.session.debug;
      this.chatPrint("DBG: Debug mode has been set to {white-fg}" + this.session.debug + "{/white-fg}!", 'log');
      this.input();
      break;
    case 'debug_v':
      if (this.util === undefined) {
        this.util = require('util');
      }
      this.session.debug_v = !this.session.debug_v;
      this.chatPrint("DBG: Debug verbose mode has been set to {white-fg}" + this.session.debug_v + "{/white-fg}!", 'log');
      this.input();
      break;
    case 'dump':
      if (this.util === undefined) {
        this.util = require('util');
      }
      fs.writeFile('steamDump.txt', this.util.inspect(this.steam, { depth: null }));
      fs.chmod('steamDump.txt', 0600);
      this.input();
      break;
		case 'scrollb':
			this.session[this.session.chat[this.session.currentChat]].scroll(-this.session[this.session.chat[this.session.currentChat]].height + 2);
			this.screen.render();
      this.input();
			break;
		case 'scrollf':
			this.session[this.session.chat[this.session.currentChat]].scroll(this.session[this.session.chat[this.session.currentChat]].height - 2);
			this.screen.render();
      this.input();
			break;
    case 'connect':
      this.steam.connect();
      this.input();
      break;
    case 'disconnect':
      this.steam.steamClient.disconnect();
      this.clearFriends();
      this.statusUpdate('d1');
      if (this.steam.steamClient.connected == false) {
        this.chatPrint('Steam: {red-fg}Disconnected{/red-fg}', 'log');
      }
      this.input();
      break;
    case 'w':
      if (args) {
        var targetIndex = parseInt(args) - 1;
        if (this.session.chat[targetIndex] !== undefined) {
          this.switchChat(this.session.chat[targetIndex]);
        }
      } else {
        this.chatPrint(cmd + ": Error: No argument specified.", 'log');
      }
      this.input();
      break;
    case 'part':
    if (this.session.chat[this.session.currentChat].length == 18) {
      if (this.steam.steamClient.connected) {
        this.steam.steamFriends.leaveChat(this.session.chat[this.session.currentChat]);
      }
      this.session[this.session.chat[this.session.currentChat]].destroy();
      this.session.chat.splice(this.session.currentChat, 1);
      delete this.session.groups[this.session.chat[this.session.currentChat]];
    } else if (this.session.chat[this.session.currentChat].length == 17) {
      this.session[this.session.chat[this.session.currentChat]].destroy();
      this.session.chat.splice(this.session.currentChat, 1);
    } else {
      if (this.session.debug) this.chatPrint("DBG: part function failure: " + this.session.chat[this.session.currentChat], 'log');
    }
    if (this.session.lastChat > this.session.currentChat) {
      this.session.lastChat -= 1;
    }
    this.switchChat(this.session.chat[this.session.lastChat]);
    this.input();
    break;
    case 'accept': //accept friends request
    if (this.steam.steamClient.connected) {
      var name = []
        , ID = [];
      for (var steamID in this.steam.steamFriends.friends) {
        if (this.steam.steamFriends.friends.hasOwnProperty(steamID)) {
          if (this.steam.steamFriends.friends[steamID] == this.steam.Steam.EFriendRelationship.RequestRecipient) {
            ID.push(steamID);
            name.push(this.steam.steamFriends.personaStates[steamID].player_name);
          }
        }
      }
      if (name.length > 0) {
        this.listSelect(name, function(err, item) {
          this.steam.steamFriends.addFriend(ID[name.indexOf(item)]);
          this.chatPrint("Accepted friend request from {blue-fg}" + item + "{/blue-fg}!", 'log');
        }.bind(this));
      } else {
        this.chatPrint("Error: You don't have any pending friend requests.", 'log');
        this.input();
      }
    } else {
      this.chatPrint(this.doc.cmd.notConnected, 'log');
      this.input();
    }
    break;
    case 'join':
      if (this.steam.steamClient.connected) {
        if (args) {
          if (args.length == 18) { // chatID
            this.steam.steamFriends.joinChat(args);
          } else {
            this.chatPrint(cmd + ": Error: Invalid chatID.", 'log');
          }
        } else if (this.session.lastInvite !== undefined) {
          this.steam.steamFriends.joinChat(this.session.lastInvite);
        } else {
          this.chatPrint(cmd + ": Error: You haven't been invited to a chatroom.", 'log');
        }
      } else {
        this.chatPrint(this.doc.cmd.notConnected, 'log');
      }
      this.input();
      break;
		case 'persona':
      if (this.steam.steamClient.connected) {
        if (args) { 
          this.steam.setPersonaName(args); 
        } else {
          this.chatPrint('Invalid command: ' + cmd + ': Please enter a new username.', 'log');
        }
      } else {
        this.chatPrint(this.doc.cmd.notConnected, 'log');
      }
      this.input();
			break;
    /*case 'nick': // If two arguments, try to match first arg as name, nick or ID, then use second argument as nick for corresponding ID. If one argument, set nick for ID in session[session.currentChat] if ID is a steam user ID. If no arguments, run listSelect.
      //Perhaps you should create prototypes/functions for checking if an arg is a name, nick or ID to ease this implementation?
      if (args) {

      } else if ( {*/
    case 'add':
      if (this.steam.steamClient.connected) {
        if (args) {
          if (args.length == 17 && /7656119.*/.test(args)) { // steamID
            this.steam.steamFriends.addFriend(args);
            this.chatPrint('Sent a friend request to {white-fg} ' + args + ' {/white-fg}!', 'log');
          }
        }
      } else {
        this.chatPrint(this.doc.cmd.notConnected, 'log');
      }
      this.input();
      break;
		case 'pm':
      this.findFriend(args, function(err, steamID) {
        if (err) {
          this.chatPrint(err, 'log');
          this.input();
        } else {
          if (this.session.chat.indexOf(steamID) < 0) {
            this.buildChat(steamID);
          }
          if (this.session.currentChat !== this.session.chat.indexOf(steamID)) {
            this.switchChat(steamID);
          }
        }
      }.bind(this));
			break;				
		case 'dbgstatusupdate':
			this.statusUpdate(args);
      this.input();
			break;
    case 'dbgaddchat':
      this.buildChat('test');
      this.input();
      break;
    case 'help':
      this.chatPrint(this.doc.cmd.help, 'log');
      this.input();
      break;
    case 'block':
      if (this.steam.steamClient.connected) {
        if (args.length == 17 && /7656119.*/.test(args)) { // steamID
          this.steam.steamFriends.setIgnoreFriend(args, true, function(EResult) {
            this.chatPrint('Steam : ' + EResult, 'log');
          }.bind(this));
        }
      } else {
        this.chatPrint(this.doc.cmd.notConnected, 'log');
      }
      this.input();
      break;
    case 'unblock':
      if (this.steam.steamClient.connected) {
        if (args.length == 17 && /7656119.*/.test(args)) { // steamID
          this.steam.steamFriends.setIgnoreFriend(args, false, function(EResult) {
            this.chatPrint('Steam : ' + EResult, 'log');
          }.bind(this));
        }
      } else {
        this.chatPrint(this.doc.cmd.notConnected, 'log');
      }
      this.input();
      break;
    case 'saveconfig':
      this.saveConfig('login');
      this.input();
      break;
    case 'set':
      var arg1 = args.split(' ', 1).join('').trim(),
      arg2 = args.substring(args.indexOf(arg1) + arg1.length + 1).trim();
      switch(arg1.toLowerCase()) {
        case 'username':
          this.steam.username = arg2;
          break;
        case 'password':
          this.steam.password = arg2;
          break;
        case 'guardcode':
          this.steam.guardcode = arg2;
          break;
        case 'twofactor':
          this.steam.twofactor = arg2;
          break;
        case 'userlistwidth':
          this.userlistwidth = arg2;
          this.resize();
          this.saveConfig();
          break;
        case 'scrollback':
          this.scrollback = arg2;
          this.resize();
          this.saveConfig();
          break; 
        default:
			this.chatPrint('Unknown command: ' + cmd + ' ' + arg1 + ' ' + arg2 + " Please type {white-fg}/help{/white-fg} for a list of commands.", 'log');
      }
      this.input();
      break;
    case 'autojoin':
      var arg1 = args.split(' ', 1).join('').trim(),
      arg2 = args.substring(args.indexOf(arg1) + arg1.length + 1).trim();
      switch(arg1.toLowerCase()) {
        case 'add':
          if (arg2) {
            if (arg2.length == 18) {
              if (this.autojoin.indexOf(arg2) < 0) {
                this.autojoin.push(arg2);
                this.saveConfig();
              } else {
                this.chatPrint(cmd + ": Error: chatID has already been added to autojoin: " + arg2, 'log');
              }
            } else {
              this.chatPrint(cmd + ": Error: Invalid chatID: " + arg2, 'log');
            }
          } else if (this.session.chat[this.session.currentChat].length == 18) {
            this.autojoin.push(this.session.chat[this.session.currentChat]);
            this.saveConfig();
          } else {
            this.chatPrint(cmd + ": Error: Please switch to a group chat window or specify a chatID.", 'log');
          }
          break;
        case 'del':
          if (arg2) {
            if (arg2.length == 18) {
              if (this.autojoin.indexOf(arg2) >= 0) {
                var index = this.autojoin.indexOf(arg2);
                this.autojoin.splice(index, 1);
                this.saveConfig();
              } else {
                this.chatPrint(cmd + ": Error: chatID does not exist in autojoin: " + arg2, 'log');
              }
            } else if (this.autojoin[arg2]) { // argument is an index
              this.autojoin.splice(arg2, 1);
              this.saveConfig();
            } else {
              this.chatPrint(cmd + ": Error: Please specify an index or chatID to delete from autojoin.", 'log');
            }
          } else if (this.session.chat[this.session.currentChat].length == 18) {
            var index = this.autojoin.indexOf(this.session.chat[this.session.currentChat]);
            this.autojoin.splice(index, 1);
            this.saveConfig();
          } else {
            this.chatPrint(cmd + ": Error: Please switch to a group chat window or specify a chatID.", 'log');
          }
          break;
        case 'list':
          this.chatPrint(cmd + ": " + this.autojoin, 'log');
          break;
        case 'run':
          if (this.steam.steamClient.connected) {
            for (var index in this.autojoin) {
              if (this.autojoin.hasOwnProperty(index)) {
                this.steam.steamFriends.joinChat(this.autojoin[index]);
                process.nextTick(function() { this.switchChat(this.session.chat[this.session.lastChat]); }.bind(this));
              }
            }
          } else {
            this.chatPrint(this.doc.cmd.notConnected, 'log');
          }
          break;
        default:
			this.chatPrint('Unknown command: ' + cmd + ' ' + arg1 + ' ' + arg2 + " Please type {white-fg}/help{/white-fg} for a list of commands.", 'log');
      }
      this.input();
      break;
		default: 
			this.chatPrint('Unknown command: ' + cmd + " Please type {white-fg}/help{/white-fg} for a list of commands.", 'log');
      this.input();
	}
};

interface.prototype.saveConfig = function(type) {
  if (fs.existsSync('config.json')) {
    var json = JSON.parse(fs.readFileSync('config.json'));
  } else {
    var json = {};
  }
  if (type == 'login') {
    json.username = this.steam.username;
    json.password = this.steam.password;
    json.guardcode = this.steam.guardcode;
    json.twofactor = this.steam.twofactor;
    json.sentryauth = this.steam.sentryauth;
    json.userlistwidth = this.userlistwidth;
    json.scrollback = this.scrollback;
    json.autojoin = this.autojoin;
    fs.writeFile('config.json', JSON.stringify(json));
    fs.chmod('config.json', 0600);
  } else {
    json.sentryauth = this.steam.sentryauth;
    json.userlistwidth = this.userlistwidth;
    json.scrollback = this.scrollback;
    json.autojoin = this.autojoin;
    fs.writeFile('config.json', JSON.stringify(json));
    fs.chmod('config.json', 0600);
  }
};

interface.prototype.statusUpdate = function(call) {
	var type = call.substring(0,1),
	arg = call.substring(1);
	switch(type) {
		case 't': //time
			this.session.status[0] = ' {cyan-fg}[{/cyan-fg}' + arg + '{cyan-fg}]{/cyan-fg}';
			break;
		case 'n': //nick
			this.session.status[1] = ' {cyan-fg}[{/cyan-fg}' + this.steam.steamFriends.personaStates[this.steam.steamClient.steamID].player_name + '{cyan-fg}]{/cyan-fg}';
			break;
    case 'a': //away
			this.session.status[1] = ' {cyan-fg}[{/cyan-fg}{yellow-fg}' + this.steam.steamFriends.personaStates[this.steam.steamClient.steamID].player_name + '{/yellow-fg}{cyan-fg}]{/cyan-fg}';
      break;
    case 'd': //disconnected
      if (arg == 1) {
        this.session.status[4] = ' {red-fg}[DISCONNECTED]{/red-fg}';
      } else if (arg == 0) {
        this.session.status[4] = '';
      }
      break;
		case 'c': //current group chat / PM
      var c = arg;
      var c_index = this.session.currentChat + 1;
      if (this.steam.steamClient.connected) {
        if (c.length == 17) {
          if (this.steam.steamFriends.personaStates.hasOwnProperty(c)) {
          c = this.steam.steamFriends.personaStates[c].player_name;
          }
        } else if (c.length == 18) {
          if (this.steam.steamFriends.clanStates.hasOwnProperty(c)) {
            c = this.steam.steamFriends.clanStates[c].name_info.clan_name;
          }
        }
      }
      this.session.status[2] = ' {cyan-fg}[{/cyan-fg}' + c_index + ':' + c + '{cyan-fg}]{/cyan-fg}';
			break;
		case 'p': //amount of people in group / partner in PM
      var p = arg;
      if (p.length == 18) {
        var admins = 0
          , mods = 0
          , members = 0
          , ranks = '';
        for (var user in this.steam.steamFriends.chatRooms[p]) {
          if (this.steam.steamFriends.chatRooms[p].hasOwnProperty(user)) {
            switch(this.steam.steamFriends.chatRooms[p][user].rank) {
              case 2:
                admins++;
                break;
              case 4:
                members++;
                break;
              case 8:
                mods++;
                break;
            }
          }
        }
        var users = admins + mods + members;
        if (admins > 0) {
          ranks += admins + ' admin';
        }
        if (mods > 0) {
          if (ranks.length > 0) ranks += ', ';
          ranks += mods + ' mod';
        }
        if (ranks.length > 0) {
          this.session.status[3] = ' {cyan-fg}[{/cyan-fg}' + users + ' users {cyan-fg}({/cyan-fg}' + ranks + '{cyan-fg})]{/cyan-fg}';
        } else {
          this.session.status[3] = ' {cyan-fg}[{/cyan-fg}' + users + ' users{cyan-fg}]{/cyan-fg}';
        }
      } else {
        this.session.status[3] = '';
      }
			break;
		case 'u': //add notification for unread group chat
      var index = parseInt(arg) + 1;
      if (this.session.unread.indexOf(index) < 0) {
        this.session.unread.push(index);
      }
			break;		
		case 'v': //add notification for unread private chat
      var index = parseInt(arg) + 1;
      if (this.session.unread.indexOf('{red-fg}' + index + '{/red-fg}') < 0) {
        this.session.unread.push('{red-fg}' + index + '{/red-fg}');
      }
			break;
		case 'w': //remove notification for unread chat
      var index = parseInt(arg) + 1;
      var i = this.session.unread.indexOf(index);
      var j = this.session.unread.indexOf('{red-fg}' + index + '{/red-fg}');
      if (i >= 0) {
        this.session.unread.splice(i, 1);
      } else if (j >= 0) {
        this.session.unread.splice(j, 1);
      }
			break;
		default:
			if (this.session.debug) this.chatPrint('DBG: Invalid statusUpdate call: ' + type + arg, 'log');
	}
  var unread = '';
  if (this.session.unread.length > 0) {
    unread = ' {cyan-fg}[{/cyan-fg}' + this.session.unread.sort(this.sortChatID) + '{cyan-fg}]{/cyan-fg}';
  } 
  this.statusBar.setContent(this.session.status[0] + this.session.status[1] + this.session.status[2] + this.session.status[3] + unread + this.session.status[4]);
	this.screen.render();
};

interface.prototype.sortChatID = function(a, b) {
  a += '';
  b += '';
	var a_num = a.replace(/\D/g, '');
	var b_num = b.replace(/\D/g, '');
	return a_num - b_num;
};

interface.prototype.findFriend = function(args, callback) {
  if (this.steam.steamClient.connected) {
    if (args) {
      if (args.length == 17 && /7656119.*/.test(args) && this.session.friends.hasOwnProperty(args)) { 
        callback(null, args);
        this.input();
      /*} else if (this.nicks.indexOf(args) > -1) { // nick
        partner = this.nicks[this.nicks.indexOf(args)];
        this.chatPrint('FIX: I will now message: ' + partner, 'log');
        // FIX: Implement nicks
        this.input();*/
      } else { // name
        var res = false;
        for (var steamID in this.session.friends) {
          if (this.session.friends.hasOwnProperty(steamID)) {
            var partner = this.session.friends[steamID];
            if (partner.name == args) {
              res = true;
              callback(null, steamID);
              this.input();
              break;
            }
          }
        }
        if (!res) { // try searching through grouplist
          for (var chatID in this.session.groups) {
            if (this.session.groups.hasOwnProperty(chatID)) {
              for (var steamID in this.session.groups[chatID]) {
                if (this.session.groups[chatID].hasOwnProperty(steamID)) {
                  var partner = this.session.groups[chatID][steamID];
                  if (partner.name == args) {
                    res = true;
                    callback(null, steamID);
                    this.input();
                    break;
                  }
                }
              }
            }
          }
        }
        if (!res) {
          callback("Invalid argument: Argument is not a friends or chat members steam ID or username.");
        }
      }
    } else { // no arg - initiate listselect
      this.listSelect(null, function(err, item) {
        if (this.session.chat[this.session.currentChat].length == 18) { // select from grouplist
          for (var steamID in this.session.groups[this.session.chat[this.session.currentChat]]) {
            if (this.session.groups[this.session.chat[this.session.currentChat]].hasOwnProperty(steamID)) {
              var partner = this.session.groups[this.session.chat[this.session.currentChat]][steamID];
              if (partner.name == item) {
                callback(null, steamID);
                break;
              }
            }
          }
        } else { // select from friendlist
          for (var steamID in this.session.friends) {
            if (this.session.friends.hasOwnProperty(steamID)) {
              var partner = this.session.friends[steamID];
              if (partner.name == item) {
                callback(null, steamID);
                break;
              }
            }
          }
        }
      }.bind(this));
    }
  } else { // no steam connection
    callback(this.doc.cmd.notConnected);
  }
};

interface.prototype.listSelect = function(names, callback) {
  if (names === null) {
    names = this.userWin.getContent().split('\n');
    names.pop();
  }
	this.friendSelect = this.blessed.list({
		top: 0,
		right: 0,
		width: this.userlistwidth,
		height: this.screen.height - 2,
		tags: true,
		keys: true,
		vi: true,
    items: names,
    style: { selected: { fg: 'cyan' } }
	});
	this.screen.append(this.friendSelect);
	this.screen.render();
  process.nextTick( function() { 
    this.friendSelect.pick(function(err, item) {
      if (item !== undefined) {
        callback(err, item);
      } 
      this.friendSelect.destroy();
      this.input();
    }.bind(this));
  }.bind(this));
};

interface.prototype.updateList = function() {
  this.userWin.setContent('');

  if (this.session.chat[this.session.currentChat].length == 18) { //add && !showFriends

    var chatID = this.session.chat[this.session.currentChat];

    for (var i = 4; i > 0; i--) {
      for (var friendID in this.session.groups[chatID]) {
        if (this.session.groups[chatID].hasOwnProperty(friendID)) {
          var friend = this.session.groups[chatID][friendID];
          if (friend.state == i) {
            switch(i) {
             case 1: //online
               this.userWin.insertTop('{blue-fg}' + friend.name + '{/blue-fg}');
               break;
             case 2: //busy
               this.userWin.insertTop('{red-fg}' + friend.name + '{/red-fg}');
               break;
             case 3: //away
               this.userWin.insertTop('{yellow-fg}' + friend.name + '{/yellow-fg}');
               break;
             case 4: //snooze
               this.userWin.insertTop('{white-fg}' + friend.name + '{/white-fg}');
               break;
             default: 
               this.userWin.insertTop('{cyan-fg}' + friend.name + '{/cyan-fg}');
               if (this.session.debug) this.chatPrint("DBG: updateGroups function: Undefined state: " + friend.state, 'log');
            }
          }
        }
      }
    }

  } else { // update friends list

    for (var i = 5; i > 0; i--) {
      if (i == 5) i = 0;
      for (var friendID in this.session.friends) {
        if (this.session.friends.hasOwnProperty(friendID)) {
          var friend = this.session.friends[friendID];
          if (friend.state == i) {
            switch(i) {
             case 0: //offline
               this.userWin.insertTop('{gray-fg}' + friend.name + '{/gray-fg}');
               break;
             case 1: //online
               this.userWin.insertTop('{blue-fg}' + friend.name + '{/blue-fg}');
               break;
             case 2: //busy
               this.userWin.insertTop('{red-fg}' + friend.name + '{/red-fg}');
               break;
             case 3: //away
               this.userWin.insertTop('{yellow-fg}' + friend.name + '{/yellow-fg}');
               break;
             case 4: //snooze
               this.userWin.insertTop('{white-fg}' + friend.name + '{/white-fg}');
               break;
             default: 
               this.userWin.insertTop('{cyan-fg}' + friend.name + '{/cyan-fg}');
               if (this.session.debug) this.chatPrint("DBG: updateFriends function: Undefined state: " + friend.state, 'log');
            }
          }
        }
      }
      if (i == 0) i = 5;
    }
  }

  this.screen.render();
};

interface.prototype.updateGroups = function(chatID) {

  if (this.session.groups.hasOwnProperty(chatID)) {
    delete this.session.groups[chatID];
  }

  for (var steamID in this.steam.steamFriends.chatRooms[chatID]) {
    if (this.steam.steamFriends.personaStates.hasOwnProperty(steamID) && steamID !== this.steam.steamClient.steamID) {
      var friend = this.steam.steamFriends.personaStates[steamID];
      if (this.session.groups[chatID] === undefined) {
        this.session.groups[chatID] = {};
      }
      this.session.groups[chatID][steamID] = {
        state: friend.persona_state,
        name: friend.player_name,
        game: friend.game_name
      }
    }
  }

  if (this.session.chat[this.session.currentChat] == chatID) {
    this.statusUpdate('p' + this.session.chat[this.session.currentChat]);
    this.updateList();
  }

};
 
interface.prototype.updateFriends = function() {

  for (var steamID in this.steam.steamFriends.friends) {
    if (this.steam.steamFriends.personaStates.hasOwnProperty(steamID)) {
      if (this.steam.steamFriends.personaStates[steamID].hasOwnProperty('persona_state') && this.steam.steamFriends.personaStates[steamID].hasOwnProperty('player_name') && this.steam.steamFriends.personaStates[steamID].hasOwnProperty('game_name')) {
        var friend = this.steam.steamFriends.personaStates[steamID];
        this.session.friends[steamID] = {
          state: friend.persona_state,
          name: friend.player_name,
          game: friend.game_name
        }
      }
    }
  }

  if (this.session.chat[this.session.currentChat].length !== 18) { //add OR showFriends
    this.updateList();
  }

};

interface.prototype.clearFriends = function() {
  this.userWin.setContent('');
  this.session.friends = {};
  this.session.groups = {};
};

interface.prototype.idle = function() {
  if (this.session.timeout !== undefined) {
    clearTimeout(this.session.timeout);
  }
  if (this.steam.steamClient.connected) {
    if (this.steam.steamFriends.personaStates.hasOwnProperty(this.steam.steamClient.steamID)) {
      if (this.steam.steamFriends.personaStates[this.steam.steamClient.steamID].persona_state !== 1) {
        this.steam.steamFriends.setPersonaState(this.steam.Steam.EPersonaState.Online);
      }
    }
  }
  this.session.away = false;
  this.session.timeout = setTimeout(function () {
    if (this.steam.steamClient.connected) {
      this.steam.steamFriends.setPersonaState(this.steam.Steam.EPersonaState.Away);
    }
    this.session.away = true;
  }.bind(this), 600000);
};
