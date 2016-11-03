var passport = require('passport');
var githubService = require('../services/github');

function authenticateForExternalApi(req, res, next) {
    passport.authenticate('token', { session: false }, function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            res.status(401).json({ message: 'Incorrect token credentials' });
            return;
        }
        checkPermission(req.args.repoId, user.token, function (err, hasPermission) {
            if (hasPermission) {
                req.user = user;
                next();
            } else {
                res.status(403).json({ message: err || 'You have no push permission for this repo' });
            }
        });
    })(req, res);
}

function checkPermission(repoId, token, cb) {
    githubService.call({
        obj: 'repos',
        fun: 'getById',
        arg: {
            id: repoId
        },
        token: token
    }, function (err, data) {
        if (err || !data) {
            cb(err, data);
            return;
        }
        var hasPermission = data.permissions['push'];
        cb(err, hasPermission);
    });
}

module.exports = function(req, res, next) {
    if (config.server.api_access.free.indexOf(req.originalUrl) > -1 || req.isAuthenticated()) {
        return next();
    } else if (config.server.api_access.external.indexOf(req.originalUrl) > -1) {
        return authenticateForExternalApi(req, res, next);
    } else {
        res.status(401).send('Authentication required');
    }
};
