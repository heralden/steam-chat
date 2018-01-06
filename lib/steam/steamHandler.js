var path = require('path')
  , fs = require('fs');

var logger = require('../logger');

module.exports = function() {

    this.client.on('error', require('./clientErrorHandler.js')
        .bind(this));
    this.client.on('connected', require('./clientConnectedHandler.js')
        .bind({ user: this.user }));
    this.client.on('logOnResponse', require('./clientLogonHandler.js')
        .bind(this));

    var serversPath = path.join(__dirname, '..', '..', 'servers.json');
    this.client.on('servers', (servers) => {
        if (servers.length > 0) {
            fs.writeFile(serversPath, JSON.stringify(servers), (err) => {
              if (err) 
                  logger.log('error', 'Unable to write to servers.json: %s', err);
            });
        }
    });

    this.user.on('updateMachineAuth', require('./userUpdateAuthHandler.js'));

    var friendsHandler = require('./friendsHandler.js');
    this.friends.on('chatInvite', friendsHandler.chatInviteHandler.bind(this));
    this.friends.on('personaState', friendsHandler.personaStateHandler.bind(this));
    this.friends.on('clanState', friendsHandler.clanStateHandler.bind(this));
    this.friends.on('relationships', friendsHandler.relationshipsHandler.bind(this));
    this.friends.on('friend', friendsHandler.friendHandler.bind(this));
    this.friends.on('friendMsg', friendsHandler.friendMsgHandler.bind(this));
    this.friends.on('chatMsg', friendsHandler.chatMsgHandler.bind(this));
    this.friends.on('friendMsgEchoToSender', friendsHandler.friendMsgEchoHandler.bind(this));
    this.friends.on('chatEnter', friendsHandler.chatEnterHandler.bind(this));
    this.friends.on('chatStateChange', friendsHandler.chatStateChangeHandler.bind(this));
    // event handlers not implemented yet: group, chatRoomInfo

};
