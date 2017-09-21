var path = require('path')
  , fs = require('fs');

var logger = require('../logger');

module.exports = (steamClient, steamUser, steamFriends) => {

    steamClient.on('error', require('./clientErrorHandler.js'));
    steamClient.on('connected', require('./clientConnectedHandler.js').bind(null, steamUser));
    steamClient.on('logOnResponse', require('./clientLogonHandler.js'));

    var serversPath = path.join(__dirname, '..', '..', 'servers.json');
    steamClient.on('servers', (servers) => {
        if (servers.length > 0) {
            fs.writeFile(serversPath, JSON.stringify(servers), (err) => {
              if (err) 
                  logger.log('error', 'Unable to write to servers.json: %s', err);
            });
        }
    });

    steamUser.on('updateMachineAuth', require('./userUpdateAuthHandler.js'));

    var friendsHandler = require('./friendsHandler.js');
    steamFriends.on('chatInvite', friendsHandler.chatInviteHandler);
    steamFriends.on('personaState', friendsHandler.personaStateHandler);
    steamFriends.on('clanState', friendsHandler.clanStateHandler);
    steamFriends.on('relationships', friendsHandler.relationshipsHandler);
    steamFriends.on('friend', friendsHandler.friendHandler);
    steamFriends.on('friendMsg', friendsHandler.friendMsgHandler);
    steamFriends.on('chatMsg', friendsHandler.chatMsgHandler);
    steamFriends.on('friendMsgEchoToSender', friendsHandler.friendMsgHandler);
    steamFriends.on('chatEnter', friendsHandler.chatEnterHandler);
    steamFriends.on('chatStateChange', friendsHandler.chatStateChangeHandler);
    // event handlers not implemented yet: group, chatRoomInfo

};
