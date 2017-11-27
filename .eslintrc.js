module.exports = {
    "env": {
        "es6": true,
        "node": true
    },
    "extends": "eslint:recommended",
    "rules": {
        "no-unused-vars": [
            "error",
            {
                "argsIgnorePattern": "^_",
                "ignoreRestSiblings": true
            }
        ]
    }
};
