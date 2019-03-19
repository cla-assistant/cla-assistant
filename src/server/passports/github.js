let url = require('../services/url');
let repoService = require('../services/repo');
let orgApi = require('../api/org');
let github = require('../services/github');
let logger = require('../services/logger');
let passport = require('passport');
let Strategy = require('passport-github').Strategy;
let merge = require('merge');

function updateToken(item, newToken) {
    item.token = newToken;
    item.save();
    logger.debug('Update access token for repo / org', item.repo || item.org);
}

function checkToken(item, accessToken) {
    let newToken = accessToken;
    let oldToken = item.token;
    let args = {
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
        if (err || !(data && data.scopes && data.scopes.indexOf('write:repo_hook') >= 0)) {
            updateToken(item, newToken);
        } else if (item.repo) {
            repoService.getGHRepo(item, function (err, ghRepo) {
                if (err || !(ghRepo && ghRepo.permissions && ghRepo.permissions.admin)) {
                    updateToken(item, newToken);
                    logger.info('Update access token for repo ', item.repo, ' admin rights have been changed');
                }
            });
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
    function (accessToken, refreshToken, params, profile, done) {
        models.User.findOne({ name: profile.username }, (err, user) => {
            if (err) {
                logger.warn(err.stack);
            }
            if (!user) {
                user = { uuid: profile.id, name: profile.username, token: accessToken };
                models.User.create(user, (err) => {
                    if (err) {
                        logger.warn(new Error('Could not create new user ' + err));
                    }
                });

                return;
            }

            if (user && !user.uuid) {
                user.uuid = profile.id;
            }
            user.token = accessToken;
            user.save();
        });
        // models.User.update({
        //     uuid: profile.id
        // }, {
        //     name: profile.username,
        //     email: '', // needs fix
        //     token: accessToken
        // }, {
        //     upsert: true
        // }, function () {});

        if (params.scope.indexOf('write:repo_hook') >= 0 && !config.server.github.adminToken) {
            repoService.getUserRepos({
                token: accessToken
            }, function (err, res) {
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
            orgApi.getForUser({
                user: {
                    token: accessToken,
                    login: profile.username
                }
            }, function (err, res) {
                if (res && res.length > 0) {
                    if (config.server.github.adminToken) {
                        return;
                    }
                    res.forEach(function (org) {
                        checkToken(org, accessToken);
                    });
                } else if (err) {
                    logger.warn(new Error(err).stack);
                }
            });
        }
        done(null, merge(profile._json, {
            token: accessToken,
            scope: params.scope
        }));
    }
));

passport.serializeUser(function (user, done) {
    done(null, user);
});

passport.deserializeUser(function (user, done) {
    done(null, user);
});