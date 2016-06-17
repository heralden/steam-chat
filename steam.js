var fs = require('fs');
var crypto = require('crypto');

module.exports = steamChatClient;

function steamChatClient(interface) {
  this.Steam = require('steam');
  this.interface = interface;
  this.sentryfile;
  this.username;
  this.password;
  this.twofactor;
  this.steam_error;
  this.sentryauth = 0;
  this.reconnect_tries = 0;

  if (fs.existsSync('servers.json')) {
    var servers = fs.readFileSync('servers.json');
    if (servers.length > 0) {
      this.Steam.servers = JSON.parse(servers);
    }
  }
  
  if (fs.existsSync('config.json')) {
    var config = JSON.parse(fs.readFileSync('config.json'));
    this.username = config.username;
    this.password = config.password;
    this.twofactor = config.twofactor;
    this.guardcode = config.guardcode;
    this.sentryauth = config.sentryauth;
  }

  if (this.guardcode == undefined) {
    this.guardcode = '';
  }

  if (this.twofactor == undefined) {
    this.twofactor = '';
  }

  this.steamClient = new this.Steam.SteamClient();
  this.steamUser = new this.Steam.SteamUser(this.steamClient);
  this.steamFriends = new this.Steam.SteamFriends(this.steamClient);

  this.steamClient.on('connected', function() {
    this.interface.chatPrint("Steam: Successfully connected to servers.", 'log');
    this.reconnect_tries = 0;
    this.steam_error = undefined;
    if (this.twofactor.length == 5) {
      if (this.interface.session.debug) this.interface.chatPrint("DBG: logging in with twofactor code", 'log');
      this.steamUser.logOn({
        account_name: this.username,
        password: this.password,
        two_factor_code: this.twofactor
      });
    } else if (fs.existsSync('sentryfile.' + this.username + '.hash')) {
      if (this.sentryauth == 2) {
        var sentryBytes = fs.readFileSync('sentryfile.' + this.username + '.hash');
        this.sentryfile = crypto.createHash('sha1').update(sentryBytes).digest();
        if (this.interface.session.debug) this.interface.chatPrint("DBG: logging in with sentry.", 'log');
        this.steamUser.logOn({
          account_name: this.username,
          password: this.password,
          sha_sentryfile: this.sentryfile
        });
      } else if (this.sentryauth == 1) {
        var sentryBytes = fs.readFileSync('sentryfile.' + this.username + '.hash');
        this.sentryfile = crypto.createHash('sha1').update(sentryBytes).digest();
        if (this.interface.session.debug) this.interface.chatPrint("DBG: logging in with sentry and guard code.", 'log');
        this.steamUser.logOn({
          account_name: this.username,
          password: this.password,
          sha_sentryfile: this.sentryfile,
          auth_code: this.guardcode
        });
      } else if (this.guardcode.length == 5) {
        if (this.interface.session.debug) this.interface.chatPrint("DBG: sentry file exists, logging in with guard code", 'log');
        this.steamUser.logOn({
          account_name: this.username,
          password: this.password,
          auth_code: this.guardcode
        });
      } else {
        if (this.interface.session.debug) this.interface.chatPrint("DBG: sentry file exists, logging in normally.", 'log');
        this.steamUser.logOn({
          account_name: this.username,
          password: this.password
        });
      }
    } else {
      this.sentryauth = 0;
      this.interface.saveConfig();
      if (this.guardcode.length == 5) {
        if (this.interface.session.debug) this.interface.chatPrint("DBG: logging in with guard code", 'log');
        this.steamUser.logOn({
          account_name: this.username,
          password: this.password,
          auth_code: this.guardcode
        });
      } else {
        if (this.interface.session.debug) this.interface.chatPrint("DBG: logging in normally.", 'log');
        this.steamUser.logOn({
          account_name: this.username,
          password: this.password
        });
      }
    }
  }.bind(this));

  this.steamClient.on('error', function(error) {
    if (error) this.interface.clearFriends();
    this.interface.statusUpdate('d1');
    this.interface.chatPrint('Steam: {red-fg}' + error + '{/red-fg}', 'log');
    if (this.interface.session.debug) this.interface.chatPrint("DBG: error event: " + error, 'log');
    if (this.steam_error === undefined) { // not a login failure
      if (this.reconnect_tries < 5) {
        this.interface.chatPrint("Steam: Disconnected from Steam servers. Will attempt to reconnect after 30 seconds.", 'log');
        setTimeout(function() {
          if (!this.steamClient.connected) {
            this.interface.chatPrint("Steam: Attempting to reconnect...", 'log');
            this.reconnect_tries++;
            this.connect();
          }
        }.bind(this), 30000);
      } else {
        this.interface.chatPrint("Steam: Attempts to reconnect have failed. Will retry after 30 minutes.", 'log');
        setTimeout(function() {
          if (!this.steamClient.connected) {
            this.interface.chatPrint("Steam: Attempting to reconnect...", 'log');
            this.connect();
          }
        }.bind(this), 1800000);
      }
    }
  }.bind(this));

  this.steamUser.on('updateMachineAuth', function(sentry, callback) {
    if (this.interface.session.debug) this.interface.chatPrint("DBG: updateMachineAuth event.", 'log');

    fs.writeFile('sentryfile.' + this.username + '.hash', sentry.bytes, () => {
      fs.chmod('sentryfile.' + this.username + '.hash', 0600);
    });

    var sentryHash = crypto.createHash('sha1').update(sentry.bytes).digest();
    callback({ sha_file: sentryHash });

    this.sentryauth = 2;
    this.interface.saveConfig();

  }.bind(this));

  this.steamClient.on('logOnResponse', function(logonResp) {
    if (logonResp.eresult == this.Steam.EResult.OK) {
      if (this.sentryauth == 1) {
        this.sentryauth = 2;
        this.interface.saveConfig();
      }
      this.interface.statusUpdate('d0');
      this.interface.chatPrint("Steam: Logged in!", 'log');
      if (this.interface.session.away == true) {
        this.steamFriends.setPersonaState(this.Steam.EPersonaState.Away);
      } else {
        this.steamFriends.setPersonaState(this.Steam.EPersonaState.Online);
      }

      for (var index in this.interface.session.chat) {
        if (this.interface.session.chat[index].length == 18) {
          this.steamFriends.joinChat(this.interface.session.chat[index]); // rejoin group chats
          process.nextTick(function() { this.interface.switchChat(this.interface.session.chat[this.interface.session.lastChat]); }.bind(this));
        }
      }
      if (this.interface.autojoin.length > 0) {
        for (var index in this.interface.autojoin) {
          if (this.interface.session.chat.indexOf(this.interface.autojoin[index]) < 0) {
            this.steamFriends.joinChat(this.interface.autojoin[index]);
            process.nextTick(function() { this.interface.switchChat(this.interface.session.chat[this.interface.session.lastChat]); }.bind(this));
          }
        }
      }

    } else if (logonResp.eresult == this.Steam.EResult.AccountLogonDenied) {
      this.interface.chatPrint("Error: Steam Guard is active. Please enter a Steam Guard code with the {cyan-fg}/set guardcode{/cyan-fg} command. If you're using the Steam Mobile Authenticator, please enter your code with the {cyan-fg}/set twofactor{/cyan-fg} command instead. Run {cyan-fg}/connect{/cyan-fg} again, once your code has been set.", 'log');
      this.steam_error = 'AccountLogonDenied';
    } else {
      for (var errormsg in this.Steam.EResult) {
        if (this.Steam.EResult[errormsg] === logonResp.eresult) {
          this.interface.chatPrint('Steam: {red-fg}' + errormsg + '{/red-fg}', 'log');
          if (this.interface.session.debug) this.interface.chatPrint("DBG: logOnResponse error: " + errormsg, 'log');
          this.steam_error = errormsg;
        }
      }
    }
  }.bind(this));

  this.steamClient.on('servers', function(servers) {
    fs.writeFile('servers.json', JSON.stringify(servers));
  });
}

steamChatClient.prototype.connect = function() {
  if (this.username !== undefined && this.password !== undefined) {
    if (this.username.length >= 1 && this.password.length >= 7) {
     
      this.steamClient.connect();

    } else {
      this.interface.chatPrint("Error: Invalid username or password. Please set your login information correctly and run {cyan-fg}/connect{/cyan-fg}.", 'log');
    }
  } else {
    this.interface.chatPrint("Warning: Username and password not defined. Please run the {cyan-fg}/set username YOUR_NAME{/cyan-fg} and {cyan-fg}/set password YOUR_PASSWORD{/cyan-fg} commands with your credentials as arguments, then run {cyan-fg}/connect{/cyan-fg}. Use {cyan-fg}/saveconfig{/cyan-fg} if you wish to save your login information. For documentation, use the {cyan-fg}/help{/cyan-fg} command.", 'log'); 
  }
};

steamChatClient.prototype.listen = function() { 

  this.steamFriends.on('friendMsg', function(steamID, msg, EChatEntryType) {
    var user = this.steamFriends.personaStates[steamID].player_name;
    if (this.interface.session.debug_v) this.interface.chatPrint("DBG: friendMsg event: " + user + ' ' + steamID + ' ' + EChatEntryType, 'log');
    if (this.interface.session.chat.indexOf(steamID) < 0) {
      this.interface.buildChat(steamID);
    }
    if (msg.length > 0) { //prevents blank messages since friendMsg emits when user is typing
      if (this.steamFriends.personaStates[steamID].game_name.length > 0) {
        this.interface.chatPrint('{green-fg}' + user + '{/green-fg}: ' + msg, steamID);
      } else {
        this.interface.chatPrint('{blue-fg}' + user + '{/blue-fg}: ' + msg, steamID);
      }
    }
  }.bind(this));

  this.steamFriends.on('friendMsgEchoToSender', function(steamID, msg, EChatEntryType) {
    var user = this.steamFriends.personaStates[steamID].player_name;
    if (this.interface.session.debug) this.interface.chatPrint("DBG:FIX: friendMsgEchoToSender event: " + user + ' ' + steamID + ' ' + EChatEntryType, 'log');
  }.bind(this));

  this.steamFriends.on('chatMsg', function(chatID, msg, EChatEntryType, steamID) {
    var user = this.steamFriends.personaStates[steamID].player_name;
    if (this.interface.session.debug_v) this.interface.chatPrint("DBG: chatMsg event: " + chatID + ' ' + user + ' ' + steamID + ' ' + EChatEntryType, 'log');
    if (this.interface.session.chat.indexOf(chatID) < 0) {
      this.interface.buildChat(chatID);
    }
    if (this.steamFriends.personaStates[steamID].game_name.length > 0) {
      this.interface.chatPrint('{green-fg}' + user + '{/green-fg}: ' + msg, chatID);
    } else {
      this.interface.chatPrint('{blue-fg}' + user + '{/blue-fg}: ' + msg, chatID);
    }
  }.bind(this))

  this.steamFriends.on('personaState', function(friend) {
    if (this.interface.session.debug_v) this.interface.chatPrint("DBG: personaState event: " + this.interface.util.inspect(friend, { depth: null }), 'log');
    if (friend.friendid == this.steamClient.steamID) {
      if (friend.persona_state == 3) {
        process.nextTick(function() { this.interface.statusUpdate('a'); }.bind(this));
      } else { 
        process.nextTick(function() { this.interface.statusUpdate('n'); }.bind(this));
      }
    } else {
      process.nextTick(function() { this.interface.updateFriends(); }.bind(this));
    }
    for (var chatID in this.steamFriends.chatRooms) {
      if (this.steamFriends.chatRooms.hasOwnProperty(chatID)) {
        if (this.steamFriends.chatRooms[chatID].hasOwnProperty(friend.friendid)) {
          this.interface.updateGroups(chatID);
        }
      }
    }
  }.bind(this));

  this.steamFriends.on('friend', function(steamID, FriendRelationship) {
    if (this.steamFriends.personaStates.hasOwnProperty(steamID)) {
      if (this.steamFriends.personaStates[steamID].hasOwnProperty('player_name')) {
        var user = this.steamFriends.personaStates[steamID].player_name;
      } else {
        var user = 'undefined';
      }
    }
    if (this.interface.session.debug) this.interface.chatPrint("DBG: friend event: " + user + ' ' + steamID + ' ' + FriendRelationship, 'log');
    if (FriendRelationship == this.Steam.EFriendRelationship.RequestRecipient) {
      this.interface.chatPrint("You have received a friend request from {blue-fg}" + user + "{/blue-fg}. Type {cyan-fg}/accept{/cyan-fg} to cycle through your friend requests and choose which to accept.", 'log');
    } else if (FriendRelationship == this.Steam.EFriendRelationship.None) {
      if (this.interface.session.friends.hasOwnProperty(steamID)) {
        delete this.interface.session.friends[steamID];
      }
    }
  }.bind(this));

  this.steamFriends.on('chatStateChange', function(MemberStateChange, steamID, chatID, actorID) {
    if (this.interface.session.debug) this.interface.chatPrint("DBG: chatStateChange event: " + MemberStateChange + ' ' + steamID + ' ' + chatID + ' ' + actorID, 'log');

    var user = 'undefined';
    var actor = 'undefined';
    if (this.steamFriends.personaStates.hasOwnProperty(steamID)) {
      user = this.steamFriends.personaStates[steamID].player_name;
    }
    if (actorID !== undefined) {
      if (this.steamFriends.personaStates.hasOwnProperty(actorID)) {
        actor = this.steamFriends.personaStates[actorID].player_name;
      }
    }
    if (this.interface.session.chat.indexOf(chatID) >= 0) {
      process.nextTick(function() { this.interface.updateGroups(chatID); }.bind(this));
      switch(MemberStateChange) {
        case this.Steam.EChatMemberStateChange.Entered:
          this.interface.chatPrint(user + ' entered chat.', chatID);
          break;
        case this.Steam.EChatMemberStateChange.Left:
          this.interface.chatPrint(user + ' left chat.', chatID);
          break;
        case this.Steam.EChatMemberStateChange.Disconnected:
          this.interface.chatPrint(user + ' disconnected.', chatID);
          break;
        case this.Steam.EChatMemberStateChange.Kicked:
          if (steamID == this.steamClient.steamID) {
            this.interface.chatPrint('You have been kicked by ' + actor + '.', chatID);
          } else if (actorID == this.steamClient.steamID) {
            this.interface.chatPrint('You have kicked ' + user + '.', chatID);
          } else {
            this.interface.chatPrint(user + ' has been kicked by ' + actor + '.', chatID);
          }
          break;
        case this.Steam.EChatMemberStateChange.Banned:
          if (steamID == this.steamClient.steamID) {
            this.interface.chatPrint('You have been banned by ' + actor + '.', chatID);
          } else if (actorID == this.steamClient.steamID) {
            this.interface.chatPrint('You have banned ' + user + '.', chatID);
          } else {
            this.interface.chatPrint(user + ' has been banned by ' + actor + '.', chatID);
          }
          break;
      }
    } else {
      if (this.interface.session.debug) this.interface.chatPrint("DBG: chatStateChange error: chatID does not exist.", 'log');
    }
  }.bind(this));

  this.steamFriends.on('relationships', function() {
    if (this.interface.session.debug) this.interface.chatPrint("DBG: relationships event emitted", 'log');
    for (var steamID in this.steamFriends.friends) {
      if (this.steamFriends.friends.hasOwnProperty(steamID)) {
        if (this.steamFriends.friends[steamID] == this.Steam.EFriendRelationship.RequestRecipient) {
          this.steamFriends.requestFriendData(steamID);
          this.getName(steamID, function(user) {
            this.interface.chatPrint("You have a pending friend request from {blue-fg}" + user + "{/blue-fg}. Type {cyan-fg}/accept{/cyan-fg} to cycle through your friend requests and choose which to accept.", 'log');
          }.bind(this));
        }
      }
    }
  }.bind(this));

  this.steamFriends.on('chatEnter', function(chatID, EChatRoomEnterResponse) {
    if (this.interface.session.debug) this.interface.chatPrint("DBG: chatEnter event: " + chatID + ' ' + EChatRoomEnterResponse, 'log');
    if (this.interface.session.chat.indexOf(chatID) < 0) {
      this.interface.buildChat(chatID);
    }
    if (this.interface.session.currentChat !== this.interface.session.chat.indexOf(chatID)) {
      this.interface.switchChat(chatID);
    }
    process.nextTick(function() { this.interface.updateGroups(chatID); }.bind(this));
  }.bind(this));

  this.steamFriends.on('chatInvite', function(chatID, chatName, steamID) {
    this.interface.session.lastInvite = chatID;
    var user = this.steamFriends.personaStates[steamID].player_name;
    this.interface.chatPrint("You have received an invite to {blue-fg}" + chatName + "{/blue-fg} ID {blue-fg}" + chatID + "{/blue-fg}, by {blue-fg}" + user + "{/blue-fg}. Type {cyan-fg}/join{/cyan-fg} if you want to enter the chatroom", 'log');
  }.bind(this));

};

steamChatClient.prototype.getFriends = function(callback) {
  var nameArray = [], idArray = [], stateArray = [], i = 0;
  for (var steamID in this.steamFriends.friends) {
    if (this.steamFriends.friends.hasOwnProperty(steamID)) {
      if (this.steamFriends.friends[steamID] == this.Steam.EFriendRelationship.Friend &&
          this.steamFriends.personaStates[steamID]) {
        nameArray[i] = this.steamFriends.personaStates[steamID].player_name;
        idArray[i] = steamID;
        stateArray[i] = this.steamFriends.personaStates[steamID].persona_state;
        i += 1;
      }
    }
  }
  callback(nameArray, idArray, stateArray);
};

steamChatClient.prototype.getName = function(steamID, callback) {
  this.steamFriends.once('personaState', function(friend) {
    if (friend.friendid == steamID) {
      if (friend.persona_state !== undefined) {
        callback(friend.player_name, friend.persona_state);
      } else {
      callback(friend.player_name);
      }
    } else {
      this.getName(steamID, callback);
    }
  }.bind(this));
};
