// var orgApi = require('../api/org');
var github = require('../services/github');
var logger = require('../services/logger');
var passport = require('passport');
var Strategy = require('passport-accesstoken').Strategy;
var merge = require('merge');

function getGHUser(accessToken, cb) {
    var args = {
        obj: 'users',
        fun: 'get',
        token: accessToken
    };

    github.call(args, function (err, data) {
        cb(err, data);
    });
}

function checkToken(accessToken, cb) {
    var args = {
        obj: 'authorization',
        fun: 'check',
        arg: {
            access_token: accessToken,
            client_id: config.server.github.client
        },
        basicAuth: {
            user: config.server.github.client,
            pass: config.server.github.secret
        }
    };

    github.call(args, function (err, data) {
        if (err || (data && data.scopes && data.scopes.indexOf('write:repo_hook') < 0) || !data) {
            err = err || 'You have not enough rights to call this API';
        }
        cb(err, data);
    });
}

passport.use(new Strategy(
    function (token, done) {
        getGHUser(token, function (err, data) {
            if (err || !data) {
                done(err || 'Could not find GitHub user for given token');
                return;
            }
            models.User.findOne({
                uuid: data.id,
                name: data.login
            }, function (err, dbUser) {
                if (err || !dbUser) {
                    done(err || 'Could not find ' + data.login);
                    return;
                }
                checkToken(dbUser.token, function (err, authorization) {
                    if (err || !dbUser) {
                        done(err || 'Could not find ' + data.login);
                        return;
                    }
                    done(err, merge(data._json, {
                        token: dbUser.token,
                        scope: authorization.scopes.toString()
                    }));
                });
            });
        });

        // if (params.scope.indexOf('write:repo_hook') >= 0) {
        //     repoService.getUserRepos({ token: accessToken }, function (err, res) {
        //         if (res && res.length > 0) {
        //             res.forEach(function (repo) {
        //             });
        //         } else if (err) {
        //             logger.warn(err);
        //         }
        //     });
        // }
        // if (params.scope.indexOf('admin:org_hook') >= 0) {
        //     orgApi.getForUser({ user: { token: accessToken } }, function (err, res) {
        //         if (res && res.length > 0) {
        //             res.forEach(function (org) {
        //                 checkToken(org, accessToken);
        //             });
        //         } else if (err) {
        //             logger.warn(err);
        //         }
        //     });
        // }
    }
));