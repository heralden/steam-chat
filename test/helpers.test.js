var assert = require('assert');

var helpers = require('../lib/helpers');

describe('Helper', function() {

    describe('safeGet()', function() {

        const clanState = { 
            name_info: { 
                clan_name: "foo" 
            },
            user_counts: {
                chatting: 5
            }
        };

        const emptyState = {
            user_counts: {
                chatting: 5
            }
        };

        it('should return value on valid keys', function() {
            const res = helpers.safeGet(clanState, 'name_info', 'clan_name');
            assert.strictEqual(res, "foo");
        });

        it('should return undefined on invalid key', function() {
            const res = helpers.safeGet(emptyState, 'name_info', 'clan_name');
            assert.strictEqual(res, undefined);
        });

    });

});
