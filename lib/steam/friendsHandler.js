var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json');

var session = require('../app')
  , { safeGet, replaceString } = require('../helpers');

module.exports = {

    friendMsgHandler(steamID, msg, EChatEntryType) {
    // Message from friend
        const user = safeGet(session.users[steamID], 'player_name');
        const persona = safeGet(session.users[steamID], 'persona_state');

        logger.log('debug', "friendMsg event", { user, steamID, EChatEntryType });

        if (msg.length === 0)
            this.emit('isTyping', steamID);
        else
            this.emit('message', steamID, user, persona, msg);
    },

    chatMsgHandler(chatID, msg, EChatEntryType, steamID) {
    // Message in group chat
        const user = safeGet(session.users[steamID], 'player_name');
        const persona = safeGet(session.users[steamID], 'persona_state');

        logger.log('debug', "chatMsg event", { chatID, user, steamID, EChatEntryType });

        clearTimeout(session.ghostTimer);
        session.ghostTimer = setTimeout(
            checkIfGhostChat.bind(this, chatID), 
            config.get('ghostcheck')
        );

        this.emit('groupMessage', chatID, user, persona, msg);
    },

    personaStateHandler(friend) {
    // Someone has made changes to their persona
        logger.log('silly', "personaState event", friend);

        const steamID = friend.friendid;
        const personaState = getPersonaState
            .call(this, friend.persona_state, friend.game_name);
        const playerName = friend.player_name;
        const gameName = friend.game_name;

        session.users[steamID] = {
            persona_state: personaState,
            player_name: playerName,
            game_name: gameName
        };

        if (steamID == session.steamID) {
            session.steamNick = playerName;
            this.emit('personaUpdate', personaState);
        } else if (steamID == session.currentChat) {
            // Currently in pm with friend
            this.emit('friendUpdate');
        }

        this.emit('listUpdate');
    },

    clanStateHandler(clanState) {
    // A group has changed their clan state
        logger.log('debug', "clanState event", clanState);

        const ID = clanState.steamid_clan;
        const name = safeGet(clanState, 'name_info', 'clan_name');
        const count = safeGet(clanState, 'user_counts', 'chatting');

        const clan = Object.assign({}, session.clans[ID]);
        session.clans[ID] = Object.assign({}, clan, {
            clan_name: name || safeGet(clan, 'clan_name'),
            user_count: count || safeGet(clan, 'user_count')
        });

    },

    chatEnterHandler(chatID, EChatRoomEnterResponse) {
    // You just entered a group chat. On success, chatRooms is now populated with chatID.
        logger.log('debug', "chatEnter event", { chatID, EChatRoomEnterResponse });

        var res = this.Steam.EChatRoomEnterResponse;
        switch (EChatRoomEnterResponse) {
            case res.Success: 
                this.emit('enteredChat', chatID);
                var e = this.friends.chatRooms[chatID];
                var count = 0;
                for (let steamID in e) {
                    if (session.clans[chatID] === undefined)
                        session.clans[chatID] = {};
                    if (session.clans[chatID].members === undefined)
                        session.clans[chatID].members = {};
                    session.clans[chatID].members[steamID] = 
                        getRank.call(this, e[steamID].rank);
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
        const user = safeGet(session.users[steamID], 'player_name');

        logger.log('debug', "chatInvite event", { chatID, chatName, steamID, user });

        session.lastInvite = chatID;
        logger.log('info', doc.msg.chatInvite, chatName, user);
    },

    friendHandler(steamID, EFriendRelationship) {
    // Activity in friends list.
        const user = safeGet(session.users[steamID], 'player_name');

        logger.log('debug', "friend event", { user, steamID, EFriendRelationship });

        var fr = this.Steam.EFriendRelationship;
        switch (EFriendRelationship) {
            case fr.None: // steamID has removed you as a friend
                removeFriendsElement(steamID);
                var e = this.Steam.EPersonaState;
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
        this.emit('listUpdate');
    },
        
    chatStateChangeHandler(MemberStateChange, steamID, chatID, actorID) {
    // Something happened in group chat/clan.
        logger.log('debug', "chatStateChange event", { MemberStateChange, steamID, chatID, actorID });

        var text = getStateChangeText.call(this, 
            MemberStateChange, 
            steamID == session.steamID,
            safeGet(session.users[steamID], 'player_name'), 
            safeGet(session.users[steamID], 'player_name')
        );

        if (text !== null)
            this.emit('activity', chatID, text);

        if (MemberStateChange === this.Steam.EChatMemberStateChange.Entered) {
            let clan = session.clans[chatID];
            if (clan.members === undefined)
                clan.members = {};
            setImmediate(() => {
                clan.members[steamID] = 
                    getRank.call(
                        this, 
                        safeGet(this.friends.chatRooms, 'chatID', 'steamID', 'rank')
                    );
            });
            clan.user_live++;
        } else { // user left/disconnected or got kicked/banned.
            if (steamID == session.steamID) { // user is you
                for (let memberID in session.clans[chatID].members) {
                    let i = session.friends.indexOf(memberID);
                    if (i < 0 && memberID != session.steamID) 
                        delete session.users[memberID];
                }
                delete session.clans[chatID];
                clearTimeout(session.ghostTimer);
            } else { // user is not you 
                if (session.users.hasOwnProperty(steamID)) {
                    let i = session.friends.indexOf(steamID);
                    if (i < 0) delete session.users[steamID];
                }
                let clan = session.clans[chatID];
                delete clan.members[steamID];
                clan.user_live--;
            }
        }

        this.emit('listUpdate');
    },

    relationshipsHandler() {
    // Emits once on login. Check if there are pending friend requests and set which users are your friends. this.friends.friends is now populated.
        logger.log('debug', "relationships event emitted");

        var friends = this.friends.friends;
        var fr = this.Steam.EFriendRelationship;
        for (let steamID in friends) {
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
        this.emit('listUpdate');
    }

};

function checkIfGhostChat(chatID) {
    logger.log('debug', "Checking if chatID %s is a ghost chat.", chatID);
    if (session.clans.hasOwnProperty(chatID)) {
        var clan = session.clans[chatID];
        if (clan.user_count !== clan.user_live) {
            logger.log('verbose', "Ghost chat detected on chatID %s. Rejoining chat.", chatID);
            this.friends.joinChat(chatID);
        }
    }
}

function removeFriendsElement(steamID) {
    var i = session.friends.indexOf(steamID);
    if (i > -1) session.friends.splice(i, 1);
}

function getPersonaState(persona, game) {
    if (game !== undefined && game.length > 0) {
        return "ingame";
    } else {
        var e = this.Steam.EPersonaState;
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

function getStateChangeText(MemberStateChange, youBool, user, actor) {
    var e = this.Steam.EChatMemberStateChange;
    switch (MemberStateChange) {
        case e.Entered:
            if (youBool) return null;
            else return replaceString(doc.act.userEntered, user);
        case e.Left:
            if (youBool) return null;
            else return replaceString(doc.act.userLeft, user);
        case e.Disconnected:
            if (youBool) return null
            else return replaceString(doc.act.userDisconnected, user);
        case e.Kicked:
            if (youBool) return replaceString(doc.act.youKicked, actor);
            else return replaceString(doc.act.userKicked, user, actor);
        case e.Banned:
            if (youBool) return replaceString(doc.act.youBanned, actor);
            else return replaceString(doc.act.userBanned, user, actor);
        default:                
            return null;
    }
}

function getRank(ClanPermission) {
    var e = this.Steam.EClanPermission;
    switch (ClanPermission) {
        case e.Owner:           
        case e.Officer:         
        case e.OwnerAndOfficer: return "admin";
        case e.Moderator:       return "moderator";
        case e.Member:          return "member";
        case e.Nobody:          return "nobody"; 
        case e.OGGGameOwner:    return "gameowner";
        case e.NonMember:       return "nonmember";
        default:                return "undefined";
    }
}
