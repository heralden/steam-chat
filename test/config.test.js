var assert = require('assert')
  , path = require('path')
  , fs = require('fs')
  , sinon = require('sinon');

var logger = require('../lib/logger');

var config = require('../lib/config');

function pathTestConfig(filename) {
    return path.join(__dirname, '..', 'test', filename);
}

function rmFiles(...args) {
    args.forEach(file => {
        fs.unlink(file, err => {
            if (err) throw err;
        });
    });
}

describe('Config', function() {

    const testPath = pathTestConfig('config_test1.json');
    const newTestPath = pathTestConfig('config_test2.json');

    before(function() {
        sinon.stub(logger, 'log');
    });

    after(function() {
        logger.log.restore();
        rmFiles(testPath, newTestPath);
    });

    it('should correctly set path', function() {
        config.setPath(testPath);
        assert.strictEqual(config.configFile, testPath);
    });

    it('should save values to file', function() {
        config.set('username', 'test1');
        setImmediate(() => {
            let data = JSON.parse(fs.readFileSync(testPath));
            assert.strictEqual(data.username, 'test1');
        });
    });

    it('should set and get correct values', function() {
        config.set('username', 'test2');
        let value = config.get('username');
        assert.strictEqual(value, 'test2');
    });

    it('should load existing config files', function() {
        let data = Object.assign({}, config.config);
        data.username = 'test3';
        fs.writeFileSync(newTestPath, JSON.stringify(data));
        config.setPath(newTestPath);
        setImmediate(() => {
            let value = config.get('username');
            assert.strictEqual(value, 'test3');
        });
    });

});
