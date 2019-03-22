module.exports = {
    "env": {
        "browser": true,
        "es6": true,
        "node": true,
        "mocha": true
    },
    "extends": "eslint:recommended",
    "parserOptions": {
        "sourceType": "module",
        "ecmaVersion": 8
    },
    "globals": {
        "$": false,
        "angular": false,
        "chunk": true,
        "config": true,
        "filters": true,
        "ga": false,
        "io": false,
        "models": true,
        "module": true,
        "moment": false,
        "server": true,
        "Papa": true,
        "Clipboard": true
    },
    "rules": {
        "dot-notation": "error",
        "func-call-spacing": "error",
        "func-name-matching": "error",
        "handle-callback-err": "warn",
        "newline-before-return": "warn",
        "no-confusing-arrow": "error",
        "no-div-regex": "error",
        "no-duplicate-imports": "error",
        "no-else-return": "error",
        "no-empty-function": "error",
        "no-multiple-empty-lines": "error",
        "no-native-reassign": "error",
        "no-path-concat": "warn",
        "no-trailing-spaces": "warn",
        "no-undef": "warn",
        "no-unused-expressions": "warn",
        "no-unused-vars": "warn",
        "no-use-before-define": [
            "error",
            {
                "functions": false,
                "variables": false
            }
        ],
        "no-useless-concat": "error",
        "no-useless-constructor": "error",
        "no-useless-rename": "error",
        "no-useless-return": "error",
        "quotes": [
            1,
            "single"
        ],
        "valid-typeof": "warn",
        "semi-spacing": "warn",
        "space-infix-ops": "warn",
        "yoda": [
            "error",
            "never"
        ]
    }
};