var util = require('util');

var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json');

var session = require('../app')
  , ui = require('../ui/ui')
  , Steam = require('./steam').Steam
  , steamFriends = require('./steam').steamFriends;

module.exports = {

    friendMsgHandler(steamID, msg, EChatEntryType) {
    // Message from friend
        var user = getUserName(steamID);
        logger.log('debug', "friendMsg event", { user, steamID, EChatEntryType });
        if (msg.length == 0)
            ui.isTyping(steamID, user, getUserState(steamID));
        else
            ui.message(steamID, user, getUserState(steamID), msg);
    },

    chatMsgHandler(chatID, msg, EChatEntryType, steamID) {
    // Message in group chat
        var user = getUserName(steamID);
        logger.log('debug', "chatMsg event", { chatID, user, steamID, EChatEntryType });

        clearTimeout(session.ghostTimer);
        session.ghostTimer = setTimeout(checkIfGhostChat(chatID), config.get('ghostcheck'));

        ui.groupMessage(chatID, user, getUserState(steamID), msg);
    },

    personaStateHandler(friend) {
    // Someone has made changes to their persona
        logger.log('silly', "personaState event", friend);

        if (friend.friendid == session.steamID) {
            session.steamNick = friend.player_name;
            ui.updateNick();
        }

        session.users[friend.friendid] = {
            persona_state: getPersonaState(friend.persona_state, friend.game_name),
            player_name: friend.player_name,
            game_name: friend.game_name
        };
    },

    clanStateHandler(clanState) {
    // A group has changed their clan state
        logger.log('debug', "clanState event", clanState);

        var e = session.clans[clanState.steamid_clan];
        if (e === undefined) e = {};
        e.clan_name = clanState.name_info.clan_name;
        e.user_count = clanState.user_counts.chatting;
    },

    chatEnterHandler(chatID, EChatRoomEnterResponse) {
    // You just entered a group chat. On success, chatRooms is now populated with chatID.
        logger.log('debug', "chatEnter event", { chatID, EChatRoomEnterResponse });

        var res = Steam.EChatRoomEnterResponse;
        switch (EChatRoomEnterResponse) {
            case res.Success: 
                ui.enteredChat(chatID);
                var e = steamFriends.chatRooms[chatID];
                var count = 0;
                for (var steamID in e) {
                    session.clans[chatID].members[steamID] = getRank(e[steamID].rank);
                    count++;
                }
                session.clans[chatID].user_live = count;
                break;
            case res.Banned: case res.CommunityBan:
                logger.log('info', doc.msg.bannedFromChat);
                break;
        }
    },

    chatInviteHandler(chatID, chatName, steamID) {
    // Received invite to group chat.
        var user = getUserName(steamID);
        logger.log('debug', "chatInvite event", { chatID, chatName, steamID, user });

        session.lastInvite = chatID;
        logger.log('info', doc.msg.chatInvite, chatName, user);
    },

    friendHandler(steamID, EFriendRelationship) {
    // Activity in friends list.
        var user = getUserName(steamID);
        logger.log('debug', "friend event", { user, steamID, FriendRelationship });

        var fr = Steam.EFriendRelationship;
        switch (EFriendRelationship) {
            case fr.None: // steamID has removed you as a friend
                removeFriendsElement(steamID);
                var e = Steam.EPersonaState;
                if (session.users[steamID].persona_state == e.Offline) 
                    delete session.users[steamID];
                break;
            case fr.RequestRecipient: // steamID has sent you a friend request
                logger.log('info', doc.msg.friendRequest, user);
                break;
            case fr.Friend: // steamID is now your friend
                session.friends.push(steamID);
                break;
        }
    },
        
    chatStateChangeHandler(MemberStateChange, steamID, chatID, actorID) {
    // Something happened in group chat/clan.
        logger.log('debug', "chatStateChange event", { MemberStateChange, steamID, chatID, actorID });

        var stateChange = getStateChange(MemberStateChange);

        ui.activity(chatID, stateChange, getUserName(steamID), getUserName(actorID));

        if (stateChange == "entered") {
            var clan = session.clans[chatID];
            clan.members[steamID] = getRank(steamFriends.chatRooms[chatID][steamID].rank);
            clan.user_live++;
        } else { // user left/disconnected or got kicked/banned.
            if (steamID == session.steamID) { // user is you
                for (var memberID in session.clans[chatID].members) {
                    var i = session.friends.indexOf(memberID);
                    if (i < 0 && memberID != session.steamID) 
                        delete session.users[memberID];
                }
                delete session.clans[chatID];
                clearTimeout(session.ghostTimer);
            } else { // user is not you 
                if (session.users.hasOwnProperty(steamID)) {
                    var i = session.friends.indexOf(steamID);
                    if (i < 0) delete session.users[steamID];
                }
                var clan = session.clans[chatID];
                delete clan.members[steamID];
                clan.user_live--;
            }
        }
    },

    relationshipsHandler() {
    // Emits once on login. Check if there are pending friend requests and set which users are your friends. steamFriends.friends is now populated.
        logger.log('debug', "relationships event emitted");

        var friends = steamFriends.friends;
        var fr = Steam.EFriendRelationship;
        for (var steamID in friends) {
            switch (friends[steamID]) {
                case fr.None: // not a friend
                    logger.log('debug', "IMPORTANT: What?? Someone whom isn't a friend is in the friend object!?", friends[steamID]);
                    removeFriendsElement(steamID);
                    break;
                case fr.RequestRecipient: // pending friend request
                    logger.log('info', doc.msg.pendingFriendRequests);
                    break;
                case fr.Friend: // your friend
                    session.friends.push(steamID);
                    break;
            }
        }
    }

};

function checkIfGhostChat(chatID) {
    logger.log('debug', "Checking if chatID %s is a ghost chat.", chatID);
    if (session.clans.hasOwnProperty(chatID)) {
        var clan = session.clans[chatID];
        if (clan.user_count !== clan.user_live) {
            logger.log('verbose', "Ghost chat detected on chatID %s. Rejoining chat.", chatID);
            steamFriends.joinChat(chatID);
        }
    }
}

function removeFriendsElement(steamID) {
    var i = session.friends.indexOf(steamID);
    if (i > -1) session.friends.splice(i, 1);
}

function getUserState(steamID) {
    var friend = steamFriends.personaStates[steamID];
    return getPersonaState(friend.persona_state, friend.game_name);
}

function getPersonaState(persona, game) {
    if (game.length > 0) {
        return "ingame";
    } else {
        var e = Steam.EPersonaState;
        switch (persona) {
            case e.Offline:        return "offline";
            case e.Online:         return "online";
            case e.Busy:           return "busy";
            case e.Away:           return "away";
            case e.Snooze:         return "snooze";
            case e.LookingToTrade: return "lookingToTrade";
            case e.LookingToPlay:  return "lookingToPlay";
            default:               return "undefined";
        }
    }
}

function getStateChange(MemberStateChange) {
    var e = Steam.EChatMemberStateChange;
    switch (MemberStateChange) {
        case e.Entered:         return "entered";
        case e.Left:            return "left";
        case e.Disconnected:    return "disconnected";
        case e.Kicked:          return "kicked";
        case e.Banned:          return "banned";
        default:                return "undefined";
    }
}

function getRank(ClanPermission) {
    var e = Steam.EClanPermission;
    switch (ClanPermission) {
        case e.Nobody:          return "nobody"; 
        case e.Owner:           return "owner";
        case e.Officer:         return "officer";
        case e.Member:          return "member";
        case e.Moderator:       return "moderator";
        case e.OGGGameOwner:    return "gameowner";
        case e.NonMember:       return "nonmember";
        default:                return "undefined";
    }
}

function getUserName(steamID) {
    var user = "undefined";

    if (session.users.hasOwnProperty(steamID)) {
        if (session.users[steamID].hasOwnProperty('player_name')) {
            user = session.users[steamID].player_name;
            logger.log('debug', "IMPORTANT: session.users works fine! You can deprecate lib/steam/friendsHandler.js:getUserName() and possibly getUserState().");
        }
    }

    return user;
}
