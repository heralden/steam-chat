var assert = require('assert')
  , sinon = require('sinon');

var logger = require('../lib/logger')
  , session = require('../lib/app');

var scc = require('../lib/ui/ui');
var cmd = require('../lib/ui/cmd');

describe('command', function() {

    describe('/join', function() {

        const validChatId = "123456789012345678";
        const invalidChatId = "12345678901234567";

        before(function() {
            sinon.stub(scc.steam.friends, 'joinChat');
            sinon.spy(logger, 'log');
        });

        after(function() {
            scc.steam.friends.joinChat.restore();
            logger.log.restore();
        });

        it('should join with argument if valid', function() {
            session.connected = true;
            cmd(['join', validChatId]);
            assert(scc.steam.friends.joinChat.calledWith(validChatId));
        });

        it('should join with lastInvite if no argument', function() {
            session.connected = true;
            session.lastInvite = validChatId;
            cmd(['join']);
            assert(scc.steam.friends.joinChat.calledWith(validChatId));
        });

        it('should fail when not connected', function() {
            session.connected = false;
            cmd(['join']);
            assert(logger.log.calledWith('warn'));
        });

        it('should fail if argument is invalid', function() {
            session.connected = true;
            cmd(['join', invalidChatId]);
            assert(logger.log.calledWith('warn'));
        });

        it('should fail if no argument and lastInvite is invalid', function() {
            session.connected = true;
            session.lastInvite = invalidChatId;
            cmd(['join']);
            assert(logger.log.calledWith('warn'));
        });

    });

});
