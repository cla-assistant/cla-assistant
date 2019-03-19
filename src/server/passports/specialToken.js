const github = require('../services/github');
const passport = require('passport');
const Strategy = require('passport-accesstoken').Strategy;
const timingSafeEqual = require('crypto').timingSafeEqual;

passport.use('specialToken', new Strategy((token, done) => {
    if (!timingSafeEqual(Buffer.from(token), Buffer.from(config.server.github.adminToken))) {
        return done('Token is incorrect');
    }
    github.call({
        obj: 'users',
        fun: 'get',
        token,
    }, (err, user) => {
        if (err) {
            return done(err);
        }
        user.token = token;
        done(undefined, user);
    });
}));