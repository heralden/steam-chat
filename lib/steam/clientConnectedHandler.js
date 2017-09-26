var path = require('path')
  , crypto = require('crypto')
  , fs = require('fs');

var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json');

function steamLogin(steamUser, done) {
    this.steamUser = steamUser;
    this.done = done || function() {};
    this.login = {};

    var username = config.get('username');
    var password = config.get('password');

    if (username.length < 1 || password.length < 7) {
        logger.log('error', doc.err.loginInfo);
    } else {
        if (config.get('sentryfile').length === 0) {
            config.set('sentryfile', path.join(
                __dirname, '..', '..', 'sentryfile.' + username + '.hash'
            ));
        }

        this.login.account_name = username;
        this.login.password = password;

        var twofactor = config.get('twofactor');
        if (twofactor.length == 5) {
            logger.log('debug', "Adding two-factor to login.");
            this.login.two_factor_code = twofactor;
            this.steamUser.logOn(this.login);
            this.done();
        } else {
            fs.stat(config.get('sentryfile'), handleFileStat.bind(this));
        }
    }
}

function handleFileStat(err, stats) {
    if (err) {
        if (err.code == "ENOENT") {
            config.set('sentryauth', false);
            checkCodeLogin.apply(this);
        } else {
            logger.log('error', "handleFileStat error", err);
        }
    } else if (stats.isFile()) {
        fs.readFile(config.get('sentryfile'), handleFileRead.bind(this));
    } else {
        logger.log('error', "handleFileStat bad stats", stats);
    }
}

function handleFileRead(err, data) {
    if (err) logger.log('error', "handleFileRead error", err);
    else {
        var sentryauth = config.get('sentryauth');
        if (sentryauth) {
            logger.log('debug', "Adding sentry to login.");
            this.login.sha_sentryfile = crypto
              .createHash('sha1').update(data).digest();
            this.steamUser.logOn(this.login);
            this.done();
        } else {
            checkCodeLogin.apply(this);
        }
    }
}

function checkCodeLogin() {
    var guardcode = config.get('guardcode');
    if (guardcode.length == 5) {
        logger.log('debug', "Adding guardcode to login.");
        this.login.auth_code = guardcode;
        this.steamUser.logOn(this.login);
        this.done();
    } else {
        this.steamUser.logOn(this.login);
        this.done();
    }
}

module.exports = steamLogin;

/* 
Explanation of how Steam secure logins work:

If Steam Guard is disabled, you can login with just account_name and password.

If Steam Guard is enabled, the first login with only an account_name and password will fail and you will be sent a Guard Code by email. The second login will then have to include the auth_code together with account_name and password. After logging in, an updateMachineAuth event will emit with a sentry and callback as arguments. The sentry bytes should be saved as a file and a sha1 hash of it should be passed to the callback.

On all following logins, a sha1 hash of the saved sentry bytes should be provided as sha_sentryfile together with account_name and password. If sha_sentryfile is incorrect or not specified, you will be denied login and sent a new Guard Code. The process will then repeat until you login successfully specifying sha_sentryfile. Once this has been done, a Guard Code will no longer be required, and all subsequent logins should be done with the sha_sentryfile in addition to account_name and password.


If Steam Guard two-factor authentication is enabled, auth_code should be replaced with two_factor_code. It can be specified on the first login attempt. Two-factor authentication works identically to a Guard Code in regards to sha_sentryfile and the updateMachineAuth event.
*/
