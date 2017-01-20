var path = require('path')
  , crypto = require('crypto')
  , fs = require('fs');

var logger = require('../logger')
  , config = require('../config')
  , doc = require('../doc.json');

var steamUser = require('./steam.js').steamUser;

var login = {};

module.exports = steamLogin;

function steamLogin() {
    var username = config.get('username');
    var password = config.get('password');

    if (username.length < 1 || password.length < 7) {
        logger.log('error', doc.err.loginInfo);
    } else {
        config.set('sentryfile', path.join(__dirname, '..', '..', 'sentryfile.' + username + '.hash'));

        login.account_name = username;
        login.password = password;

        var twofactor = config.get('twofactor');
        if (twofactor.length == 5) {
            logger.log('debug', "Adding two-factor to login.");
            login.two_factor_code = twofactor;
            steamUser.logOn(login);
        } else {
            fs.stat(config.get('sentryfile'), handleFileStat);
        }
    }
}

function handleFileStat(err, stats) {
    if (err) {
        if (err.code == "ENOENT") {
            config.set('sentryauth', false);
            checkCodeLogin();
        } else {
            logger.log('error', "handleFileStat error", err);
        }
    } else if (stats.isFile()) {
        fs.readFile(config.get('sentryfile'), handleFileRead);
    } else {
        logger.log('error', "handleFileStat bad stats", stats);
    }
}

function handleFileRead(err, data) {
    if (err) logger.log('error', "handleFileRead error", err);
    else {
        var sentry = crypto.createHash('sha1').update(data).digest();
        var sentryauth = config.get('sentryauth');
        if (sentryauth) {
            logger.log('debug', "Adding sentry to login.");
            login.sha_sentryfile = sentry;
            steamUser.logOn(login);
        } else {
            checkCodeLogin();
        }
    }
}

function checkCodeLogin() {
    var guardcode = config.get('guardcode');
    if (guardcode.length == 5) {
        logger.log('debug', "Adding guardcode to login.");
        login.auth_code = guardcode;
        steamUser.logOn(login);
    } else {
        steamUser.logOn(login);
    }
}

/* 
Explanation of how Steam secure logins work:

If Steam Guard is disabled, you can login with just account_name and password.

If Steam Guard is enabled, the first login with only an account_name and password will fail and you will be sent a Guard Code by email. The second login will then have to include the auth_code together with account_name and password. After logging in, an updateMachineAuth event will emit with a sentry and callback as arguments. The sentry bytes should be saved as a file and a sha1 hash of it should be passed to the callback.

On all following logins, a sha1 hash of the saved sentry bytes should be provided as sha_sentryfile together with account_name and password. If sha_sentryfile is incorrect or not specified, you will be denied login and sent a new Guard Code. The process will then repeat until you login successfully specifying sha_sentryfile. Once this has been done, a Guard Code will no longer be required, and all subsequent logins should be done with the sha_sentryfile in addition to account_name and password.


If Steam Guard two-factor authentication is enabled, auth_code should be replaced with two_factor_code. It can be specified on the first login attempt. Two-factor authentication works identically to a Guard Code in regards to sha_sentryfile and the updateMachineAuth event.
*/
