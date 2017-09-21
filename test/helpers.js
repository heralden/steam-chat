var path = require('path')
  , fs = require('fs');

exports.pathTestConfig = (filename) => {
    return path.join(__dirname, '..', 'test', filename);
}

exports.rmFiles = (...args) => {
    args.forEach(file => {
        fs.unlink(file, err => {
            if (err) throw err;
        });
    });
}
