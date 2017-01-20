var fs = require('fs')
  , crypto = require('crypto');

var logger = require('../logger')
  , config = require('../config');

module.exports = updateAuth;

function updateAuth(sentry, callback) {
  logger.log('debug', 'updateMachineAuth event.');

  var sentryfile = config.get('sentryfile');

  fs.writeFile(sentryfile, sentry.bytes, (err) => {
    if (err) logger.log('error', err);

    logger.log('debug', "Writing sentryfile at: %s", sentryfile);
    fs.chmodSync(sentryfile, '0600');
  });

  var sentryhash = crypto.createHash('sha1').update(sentry.bytes).digest();
  callback({ sha_file: sentryhash });

  config.set('sentryauth', true);
}
