var assert = require('assert')
  , sinon = require('sinon');

var logger = require('../lib/logger')
  , config = require('../lib/config')
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
            ui.steam.friends.addFriend.reset();
            logger.log.reset();
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

    describe('/autojoin', function() {

        const chatIdA = "123456789012345678";
        const chatIdB = "234567890123456789";
        const chatIdC = "345678901234567890";
        const invalidChatId = "12345678901234567";
        const autojoinArr = [ chatIdA, chatIdB ];

        before(function() {
            config.set('autojoin', autojoinArr);
            sinon.stub(logger, 'log');
            sinon.stub(config, 'set');
        });

        after(function() {
            logger.log.restore();
            config.set.restore();
            config.set('autojoin', []);
        });

        afterEach(function() {
            session.connected = false;
            session.currentChat = "log";
            config.set.reset();
            logger.log.reset();
        });

        it('should print usage information on missing action', function() {
            ui.cmd(['autojoin']);
            assert(logger.log.calledWith('info', doc.autojoin.noAction));
        });

        describe('add', function() {

            it('should add Chat ID if new', function() {
                ui.cmd(['autojoin', 'add', chatIdC]);
                assert(config.set.calledWith('autojoin',
                    autojoinArr.concat(chatIdC)));
            });

            it('should warn on adding already present Chat ID', function() {
                ui.cmd(['autojoin', 'add', chatIdA]);
                assert(logger.log.calledWith('warn',
                    doc.autojoin.alreadyAdded));
            });

            it('should warn on invalid Chat ID', function() {
                ui.cmd(['autojoin', 'add', invalidChatId]);
                assert(logger.log.calledWith('warn',
                    doc.autojoin.invalidChatId));
            });

            it('should add currentChat if valid Chat ID', function() {
                session.currentChat = chatIdC;
                ui.cmd(['autojoin', 'add']);
                assert(config.set.calledWith('autojoin',
                    autojoinArr.concat(chatIdC)));
            });

            it('should warn when no currentChat and argument', function() {
                ui.cmd(['autojoin', 'add']);
                assert(logger.log.calledWith('warn',
                    doc.autojoin.addError));
            });

        });

        describe('remove', function() {

            it('should remove Chat ID if exists', function() {
                ui.cmd(['autojoin', 'remove', chatIdB]);
                assert(config.set.calledWith('autojoin',
                    autojoinArr.filter(e => e != chatIdB)));
            });

            it('should warn on removing nonexistent Chat ID', function() {
                ui.cmd(['autojoin', 'remove', chatIdC]);
                assert(logger.log.calledWith('warn',
                    doc.autojoin.notInArray));
            });

            it('should remove Chat ID by valid index', function() {
                ui.cmd(['autojoin', 'remove', 1]);
                assert(config.set.calledWith('autojoin',
                    autojoinArr.filter(e => e != chatIdB)));
            });

            it('should warn on invalid index', function() {
                ui.cmd(['autojoin', 'remove', 2]);
                assert(logger.log.calledWith('warn',
                    doc.autojoin.removeError));
            });

            it('should remove currentChat if valid Chat ID', function() {
                session.currentChat = chatIdB;
                ui.cmd(['autojoin', 'remove']);
                assert(config.set.calledWith('autojoin',
                    autojoinArr.filter(e => e != chatIdB)));
            });

            it('should warn when invalid currentChat and argument', function() {
                ui.cmd(['autojoin', 'remove']);
                assert(logger.log.calledWith('warn',
                    doc.autojoin.removeError));
            });

        });

        describe('run', function() {

            before(function() {
                sinon.stub(ui.steam.friends, 'joinChat');
            });

            after(function() {
                ui.steam.friends.joinChat.restore();
            });

            it('should join chats in autojoin array', function() {
                session.connected = true;
                ui.cmd(['autojoin', 'run']);
                assert(ui.steam.friends.joinChat
                    .calledWith(chatIdA));
                assert(ui.steam.friends.joinChat
                    .calledWith(chatIdB));
            });

        });

    });

    describe('/block', function() {

        const steamId = "76561191234567890";

        before(function() {
            sinon.stub(ui.steam.friends, 'setIgnoreFriend')
                .yields([1]);
            sinon.stub(logger, 'log');
        });

        after(function() {
            ui.steam.friends.setIgnoreFriend.restore();
            logger.log.restore();
        });

        afterEach(function() {
            session.connected = false;
            ui.steam.friends.setIgnoreFriend.reset();
            logger.log.reset();
        });

        it('should call setIgnoreFriend and interpret callback EResult', function() {
            session.connected = true;
            ui.cmd(['block', steamId]);
            assert(ui.steam.friends.setIgnoreFriend
                .calledWith(steamId, true));
            assert(logger.log.calledWith('info',
                doc.msg.steamResponse, 'block', 'OK'));
        });

    });

    describe('/get', function() {

        before(function() {
            sinon.stub(logger, 'log');
            sinon.stub(config, 'get');
        });

        after(function() {
            logger.log.restore();
            config.get.restore();
        });

        afterEach(function() {
            logger.log.reset();
            config.get.reset();
        });

        it('should get on valid key', function() {
            ui.cmd(['get', "username"]);
            assert(config.get
                .calledWith("username"));
        });

        it('should get on undefined key', function() {
            ui.cmd(['get']);
            assert(config.get
                .calledWith(undefined));
        });

        it('should warn on invalid key', function() {
            ui.cmd(['get', "foo"]);
            assert(logger.log
                .calledWith('warn', doc.cmd.invalidKey));
        });

    });

    describe('/help', function() {

        before(function() {
            sinon.stub(logger, 'log');
        });

        after(function() {
            logger.log.restore();
        });

        afterEach(function() {
            logger.log.reset();
        });

        it('should print help message when no arguments', function() {
            ui.cmd(['help']);
            assert(logger.log.calledWith('info', doc.msg.help));
        });

        it('should print help page for argument', function() {
            ui.cmd(['help', 'autojoin']);
            assert(logger.log.calledWith('info',
                "help: ".concat(doc.help.autojoin)));
        });

        it('should handle arguments with spaces', function() {
            ui.cmd(['help', 'autojoin', 'add']);
            assert(logger.log.calledWith('info', 
                "help: ".concat(doc.help['autojoin add'])));
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
            ui.steam.friends.joinChat.reset();
            logger.log.reset();
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
            ui.steam.friends.setPersonaName.reset();
            logger.log.reset();
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
            ui.chatwin.newChat.reset();
            ui.chatwin.switchChat.reset();
            logger.log.reset();
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

    describe('/quit', function() {

        before(function() {
            sinon.stub(config, 'save')
                .yields({ error: "test" });
            sinon.stub(logger, 'log');
        });

        after(function() {
            config.save.restore();
            logger.log.restore();
        });

        afterEach(function() {
            config.save.reset();
            logger.log.reset();
        });

        it('should error when config fails to save', function() {
            ui.cmd(['quit']);
            assert(logger.log
                .calledWith('error', doc.err.quitSaveError));
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
            ui.steam.friends.removeFriend.reset();
            logger.log.reset();
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

    describe('/set', function() {

        before(function() {
            sinon.stub(logger, 'log');
            sinon.stub(config, 'set');
        });

        after(function() {
            logger.log.restore();
            config.set.restore();
        });

        afterEach(function() {
            logger.log.reset();
            config.set.reset();
        });

        it('should set on valid key', function() {
            ui.cmd(['set', "username", "bar"]);
            assert(config.set
                .calledWith("username", "bar"));
        });

        it('should warn on invalid key', function() {
            ui.cmd(['set', "foo", "bar"]);
            assert(logger.log
                .calledWith('warn', doc.cmd.invalidKey));
        });

        it('should cast value to correct type', function() {
            // Casting to string
            ui.cmd(['set', "username", "foobar"]);
            assert(config.set
                .calledWith("username", "foobar"));

            // Casting to number
            ui.cmd(['set', "scrollback", "1500"]);
            assert(config.set
                .calledWith("scrollback", 1500));

            // Casting to boolean
            ui.cmd(['set', "24hour", "true"]);
            assert(config.set
                .calledWith("24hour", true));
        });

        it ('should neglect to set array (object)', function() {
            ui.cmd(['set', "autojoin", "foobar"]);
            assert(logger.log
                .calledWith('warn', doc.cmd.cannotSetObject));
        });

    });


    describe('/unblock', function() {

        const steamId = "76561191234567890";

        before(function() {
            sinon.stub(ui.steam.friends, 'setIgnoreFriend');
            sinon.stub(logger, 'log');
        });

        after(function() {
            ui.steam.friends.setIgnoreFriend.restore();
            logger.log.restore();
        });

        afterEach(function() {
            session.connected = false;
            ui.steam.friends.setIgnoreFriend.reset();
            logger.log.reset();
        });

        it('should call setIgnoreFriend', function() {
            session.connected = true;
            ui.cmd(['unblock', steamId]);
            assert(ui.steam.friends.setIgnoreFriend
                .calledWith(steamId, false));
        });

    });

});
