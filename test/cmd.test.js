var assert = require('assert')
  , sinon = require('sinon');

var logger = require('../lib/logger')
  , session = require('../lib/app');

var ui = require('../lib/ui/ui');

describe('command', function() {

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

        it('should send a friend request on valid ID', function() {
            session.connected = true;
            ui.cmd(['add', validSteamId]);
            assert(ui.steam.friends.addFriend.calledWith(validSteamId));
        });

        it('should fail on invalid ID', function() {
            session.connected = true;
            ui.cmd(['add', invalidSteamId]);
            assert(logger.log.calledWith('warn'));
        });

        it('should fail on invalid ID length', function() {
            session.connected = true;
            ui.cmd(['add', invalidSteamIdLength]);
            assert(logger.log.calledWith('warn'));
        });

    });

});
