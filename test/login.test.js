var assert = require('assert')
  , fs = require('fs')
  , sinon = require('sinon')
  , crypto = require('crypto');

var logger = require('../lib/logger')
  , config = require('../lib/config');

var { pathTestConfig, rmFiles } = require('./helpers');

var steamLogin = require('../lib/steam/clientConnectedHandler');
var updateAuth = require('../lib/steam/userUpdateAuthHandler');

describe('Login', function() {

    const testUser = "foo";
    const testPass = "mypassword";
    const testTwoFactor = "12345";
    const testGuardCode = "ABCDE";
    const testSentryBytes = "bar";
    const testSentryFile1 = pathTestConfig('sentryfile.login_test1.hash');
    const testSentryFile2 = pathTestConfig('sentryfile.login_test2.hash');

    before(function() {
        this.steamUser = { logOn: sinon.stub() };
        sinon.stub(logger, 'log');
    });

    after(function() {
        logger.log.restore();
        rmFiles(testSentryFile1, testSentryFile2);
    });

    afterEach(function() {
        ['username', 'password', 'guardcode', 
        'twofactor', 'sentryfile'].forEach(val => {
            config.set(val, "");
        });
        config.set('sentryauth', false);
        this.steamUser.logOn.reset();
        logger.log.reset();
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

    it('should login with two-factor code', function(done) {
        config.set('username', testUser);
        config.set('password', testPass);
        config.set('twofactor', testTwoFactor);

        steamLogin(this.steamUser, () => {
            assert(this.steamUser.logOn.calledWithExactly(
                sinon.match({
                    account_name: testUser,
                    password: testPass,
                    two_factor_code: testTwoFactor
                })
            ));
            done();
        });
    });

    it('should login with guardcode', function(done) {
        config.set('username', testUser);
        config.set('password', testPass);
        config.set('guardcode', testGuardCode);

        steamLogin(this.steamUser, () => {
            assert(this.steamUser.logOn.calledWithExactly(
                sinon.match({
                    account_name: testUser,
                    password: testPass,
                    auth_code: testGuardCode
                })
            ));
            done();
        });
    });

    it('should correctly load a sentry file and login with hash', function(done) {
        config.set('username', testUser);
        config.set('password', testPass);
        config.set('sentryauth', true);
        config.set('sentryfile', testSentryFile1);

        fs.writeFileSync(testSentryFile1, testSentryBytes);

        const sentryhash = crypto
            .createHash('sha1').update(testSentryBytes).digest();

        steamLogin(this.steamUser, () => {
            assert(this.steamUser.logOn.calledWithExactly(
                sinon.match({
                    account_name: testUser,
                    password: testPass,
                    sha_sentryfile: sentryhash
                })
            ));
            done();
        });
    });

    it('should correctly handle a sentry update', function(done) {
        config.set('sentryfile', testSentryFile2);

        const sentryhash = crypto
            .createHash('sha1').update(testSentryBytes).digest();

        updateAuth({ bytes: testSentryBytes }, (sentry) => {
            assert.deepEqual(sentry.sha_file, sentryhash);

            const sentryfilebytes = fs.readFileSync(testSentryFile2);
            const sentryfilehash = crypto
                .createHash('sha1').update(sentryfilebytes).digest();

            assert.deepEqual(sentryfilehash, sentryhash);
            done();
        });
    });
});
