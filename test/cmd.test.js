var assert = require('assert')
  , sinon = require('sinon');

var logger = require('../lib/logger')
  , session = require('../lib/app')
  , doc = require('../lib/doc.json');

var ui = require('../lib/ui/ui');

describe('Commands', function() {

    describe('/add', function() {

        const validSteamId = "76561191234567890";
        const invalidSteamId = "76561181234567890";
        const invalidSteamIdLength = "7656119123456789";

        before(function() {
            sinon.stub(ui.steam.friends, 'addFriend');
            sinon.stub(logger, 'log');
        });

        after(function() {
            ui.steam.friends.addFriend.restore();
            logger.log.restore();
        });

        afterEach(function() {
            session.connected = false;
        });

        it('should send a friend request on valid ID', function() {
            session.connected = true;
            ui.cmd(['add', validSteamId]);
            assert(ui.steam.friends.addFriend.calledWith(validSteamId));
        });

        it('should fail on invalid ID', function() {
            session.connected = true;
            ui.cmd(['add', invalidSteamId]);
            assert(logger.log.calledWith('warn', 
                doc.cmd.invalidSteamId, 'add', invalidSteamId));
        });

        it('should fail on invalid ID length', function() {
            session.connected = true;
            ui.cmd(['add', invalidSteamIdLength]);
            assert(logger.log.calledWith('warn', 
                doc.cmd.invalidSteamId, 'add', invalidSteamIdLength));
        });

    });

    describe('/join', function() {

        const validChatId = "123456789012345678";
        const invalidChatId = "12345678901234567";

        before(function() {
            sinon.stub(ui.steam.friends, 'joinChat');
            sinon.stub(logger, 'log');
        });

        after(function() {
            ui.steam.friends.joinChat.restore();
            logger.log.restore();
        });

        afterEach(function() {
            session.connected = false;
            session.lastInvite = "";
        });

        it('should join with argument if valid', function() {
            session.connected = true;
            ui.cmd(['join', validChatId]);
            assert(ui.steam.friends.joinChat.calledWith(validChatId));
        });

        it('should join with lastInvite if no argument', function() {
            session.connected = true;
            session.lastInvite = validChatId;
            ui.cmd(['join']);
            assert(ui.steam.friends.joinChat.calledWith(validChatId));
        });

        it('should fail when not connected', function() {
            session.connected = false;
            ui.cmd(['join']);
            assert(logger.log.calledWith('warn'));
        });

        it('should fail if argument is invalid', function() {
            session.connected = true;
            ui.cmd(['join', invalidChatId]);
            assert(logger.log.calledWith('warn'));
        });

        it('should fail if no argument and lastInvite is invalid', function() {
            session.connected = true;
            session.lastInvite = invalidChatId;
            ui.cmd(['join']);
            assert(logger.log.calledWith('warn'));
        });

    });

    describe('/persona', function() {

        const validPersona = "gnewell";

        before(function() {
            sinon.stub(ui.steam.friends, 'setPersonaName');
            sinon.stub(logger, 'log');
        });

        after(function() {
            ui.steam.friends.setPersonaName.restore();
            logger.log.restore();
        });

        afterEach(function() {
            session.connected = false;
        });

        it('should set persona name if valid', function() {
            session.connected = true;
            ui.cmd(['persona', validPersona]);
            assert(ui.steam.friends.setPersonaName.calledWith(validPersona));
        });

        it('should fail if no argument', function() {
            session.connected = true;
            ui.cmd(['persona']);
            assert(logger.log.calledWith('warn'));
        });

    });

    describe('/pm', function() {

        const steamId1 = "76561191234567890";
        const steamId2 = "76561191234567891";

        before(function() {
            sinon.stub(ui.chatwin, 'newChat');
            sinon.stub(ui.chatwin, 'switchChat');
            sinon.stub(logger, 'log');
        });

        after(function() {
            ui.chatwin.newChat.restore();
            ui.chatwin.switchChat.restore();
            logger.log.restore();
        });

        afterEach(function() {
            session.connected = false;
            session.users = {};
        });

        it('should work with steamID', function() {
            session.connected = true;
            session.users = { [steamId1]: {} };
            ui.cmd(['pm', steamId1]);
            assert(ui.chatwin.newChat.calledWith(steamId1));
            assert(ui.chatwin.switchChat.calledWith(steamId1));
        });

        it('should work with name and prioritize complete match', function() {
            session.connected = true;
            session.users = { 
                [steamId1]: { player_name: "foobark" },
                [steamId2]: { player_name: "foobar" } 
            };
            ui.cmd(['pm', "foobar"]);
            assert(ui.chatwin.newChat.calledWith(steamId2));
            assert(ui.chatwin.switchChat.calledWith(steamId2));
        });

        it('should accept partial match', function() {
            session.connected = true;
            session.users = { 
                [steamId1]: { player_name: "foobar" } 
            };
            ui.cmd(['pm', "foo"]);
            assert(ui.chatwin.newChat.calledWith(steamId1));
            assert(ui.chatwin.switchChat.calledWith(steamId1));
        });

        it('should warn on unsuccessful match', function() {
            session.connected = true;
            session.users = { [steamId1]: { player_name: "foo" } };
            ui.cmd(['pm', "bar"]);
            assert(logger.log.calledWith('warn', doc.cmd.userNotFound));
        });

    });

    describe('/remove', function() {

        const steamId = "76561191234567890";

        before(function() {
            sinon.stub(ui.steam.friends, 'removeFriend');
            sinon.stub(logger, 'log');
        });

        after(function() {
            ui.steam.friends.removeFriend.restore();
            logger.log.restore();
        });

        afterEach(function() {
            session.connected = false;
            session.users = {};
            session.friends = [];
        });

        it('should warn when user is not friend', function() {
            session.connected = true;
            session.users = { [steamId]: { player_name: "foo" } };
            ui.cmd(['remove', "foo"]);
            assert(logger.log.calledWith('warn', doc.cmd.userNotFriend));
        });

        it('should succeed when user is also friend', function() {
            session.connected = true;
            session.users = { [steamId]: { player_name: "foo" } };
            session.friends = [ steamId ];
            ui.cmd(['remove', "foo"]);
            assert(ui.steam.friends.removeFriend.calledWith(steamId));
        });

    });

});
