var url = require('../services/url');
var repoService = require('../services/repo');
var logger = require('../services/logger');
var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var merge = require('merge');

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

        repoService.getUserRepos({token: accessToken}, function(err, res){
            if (res && res.length > 0) {
                res.forEach(function(repo){
                    if (repo.token !== accessToken) {
                        repo.token = accessToken;
                        repo.save();
                        logger.debug('Update access token for repo', repo.repo);
                    }
                });
            } else if (err) {
                logger.warn(err);
            }
        });
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
