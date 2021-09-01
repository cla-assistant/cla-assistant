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
        "handle-callback-err": "error",
        "no-confusing-arrow": "error",
        "no-div-regex": "error",
        "no-duplicate-imports": "error",
        "no-else-return": "error",
        "no-empty-function": "error",
        "no-multiple-empty-lines": "error",
        "no-native-reassign": "error",
        "no-path-concat": "error",
        "no-trailing-spaces": "error",
        "no-undef": "error",
        "no-unused-expressions": "error",
        "no-unused-vars": "error",
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
        "valid-typeof": "error",
        "semi-spacing": "error",
        "space-infix-ops": "error",
        "yoda": [
            "error",
            "never"
        ]
    }
};
