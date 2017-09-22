var assert = require('assert')
  , sinon = require('sinon');

var logger = require('../lib/logger')
  , config = require('../lib/config');

var steamLogin = require('../lib/steam/clientConnectedHandler');

describe('Login', function() {

    const testUser = "foo";
    const testPass = "mypassword";

    before(function() {
        this.steamUser = { logOn: sinon.stub() };
        sinon.stub(logger, 'log');
    });

    after(function() {
        logger.log.restore();
    });

    it('should do a regular login', function(done) {
        config.set('username', testUser);
        config.set('password', testPass);

        steamLogin(this.steamUser, () => {
            assert(this.steamUser.logOn.calledWithExactly(
                sinon.match({
                    account_name: testUser,
                    password: testPass
                })
            ));
            done();
        });
    });
});
