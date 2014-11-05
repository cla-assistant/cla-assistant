var github = require('../services/github');
var url = require('../services/url');
var passport = require('passport');
var Strategy = require('passport-github').Strategy;
var merge = require('merge');
var sugar = require('array-sugar');

passport.use(new Strategy({
        clientID: config.server.github.client,
        clientSecret: config.server.github.secret,
        callbackURL: url.githubCallback,
        authorizationURL: url.githubAuthorization,
        tokenURL: url.githubToken,
        userProfileURL: url.githubProfile()
        // scope: config.server.github.scopes
    },
    function(accessToken, refreshToken, profile, done) {
        models.User.update({
            uuid: profile.id
        }, {
            name: profile.username,
            email: '', // needs fix
            token: accessToken
        }, {
            upsert: true
        }, function(err, num, res) {
            done(null, merge(profile._json, {
                token: accessToken
            }));
        });
    }
));

passport.serializeUser(function(user, done) {
    done(null, user);
});

passport.deserializeUser(function(user, done) {
    done(null, user);
});
