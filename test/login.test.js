var assert = require('assert')
  , sinon = require('sinon');

var { pathTestConfig, rmFiles } = require('./helpers');

var logger = require('../lib/logger')
  , config = require('../lib/config');

var steamLogin = require('../lib/steam/clientConnectedHandler');

describe('Login', function() {

    const testPath = pathTestConfig('login_test1.json');
    const testUser = "foo";
    const testPass = "mypassword";

    before(function() {
        this.steamUser = { 
            logOn: sinon.stub()
        };
        sinon.stub(logger, 'log');
        this.prevPath = config.getPath();
        config.setPath(testPath);
    });

    after(function() {
        logger.log.restore();
        rmFiles(testPath);
        config.setPath(this.prevPath);
    });

    it('should do a regular login', function() {
        config.set('username', testUser);
        config.set('password', testPass);

        steamLogin(this.steamUser);

        setImmediate(() => {
            assert(this.steamUser.logOn.calledWithExactly(
                sinon.match({
                    account_name: testUser,
                    password: testPass
                })
            ))
        });
    });
});
