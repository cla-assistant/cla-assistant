var url = require('../services/url');
var repoService = require('../services/repo');
var orgApi = require('../api/org');
var github = require('../services/github');
var logger = require('../services/logger');
var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var merge = require('merge');

function checkToken(item, accessToken) {
    var newToken = accessToken;
    var oldToken = item.token;
    var args = {
        obj: 'authorization',
        fun: 'check',
        arg: {
            access_token: oldToken,
            client_id: config.server.github.client
        },
        basicAuth: {
            user: config.server.github.client,
            pass: config.server.github.secret
        }
    };

    github.call(args, function (err, data) {
        if (err || (data && data.scopes && data.scopes.indexOf('write:repo_hook') < 0)) {
            item.token = newToken;
            item.save();
            logger.debug('Update access token for repo / org', item.repo || item.org);
        }
    });
}

passport.use(new Strategy({
        clientID: config.server.github.client,
        clientSecret: config.server.github.secret,
        callbackURL: url.githubCallback,
        authorizationURL: url.githubAuthorization,
        tokenURL: url.githubToken,
        userProfileURL: url.githubProfile()
        // scope: config.server.github.scopes
    },
    function(accessToken, refreshToken, params, profile, done) {
        models.User.update({
            uuid: profile.id
        }, {
            name: profile.username,
            email: '', // needs fix
            token: accessToken
        }, {
            upsert: true
        }, function() {
        });

        if (params.scope.indexOf('write:repo_hook') >= 0) {
            repoService.getUserRepos({ token: accessToken }, function (err, res) {
                if (res && res.length > 0) {
                    res.forEach(function (repo) {
                        checkToken(repo, accessToken);
                    });
                } else if (err) {
                    logger.warn(err);
                }
            });
        }
        if (params.scope.indexOf('admin:org_hook') >= 0) {
            orgApi.getForUser({ user: { token: accessToken } }, function (err, res) {
                if (res && res.length > 0) {
                    res.forEach(function (org) {
                        checkToken(org, accessToken);
                    });
                } else if (err) {
                    logger.warn(err);
                }
            });
        }
        done(null, merge(profile._json, {
            token: accessToken,
            scope: params.scope
        }));
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});
