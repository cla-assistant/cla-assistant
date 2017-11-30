var passport = require('passport');
var q = require('q');
var utils = require('./utils');

function authenticateForExternalApi(req, res, next) {
    passport.authenticate('token', { session: false }, function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            res.status(401).json({ message: 'Incorrect token credentials' });
            return;
        }
        utils.checkRepoPushPermissionById(req.args.repoId, user.token, function (err, hasPermission) {
            if (hasPermission) {
                req.user = user;
                next();
            } else {
                res.status(403).json({ message: err || 'You have no push permission for this repo' });
            }
        });
    })(req, res);
}

function authenticateForAdminOnlyApi(req, res, next) {
    passport.authenticate('token', { session: false }, function (err, user) {
        if (err) {
            return next(err);
        }
        if (!user) {
            return res.status(401).json({ message: 'Incorrect token credentials' });
        }
        if (!utils.couldBeAdmin(user.login) || (req.args.org && user.scope.indexOf('admin:org_hook') < 0)) {
            return res.status(403).json({ message: 'Must have admin:org_hook permission scope' });
        }
        var promises = [];
        if (req.args.owner && req.args.repo) {
            promises.push(utils.checkRepoPushPermissionByName(req.args.repo, req.args.owner, user.token));
        }
        if (req.args.org) {
            promises.push(utils.checkOrgAdminPermission(req.args.org, user.login, user.token));
        }
        return q.all(promises).then(function () {
            req.user = user;
            next();
        }).catch(function (error) {
            return res.status(403).json({ message: error.message || error });
        });

    })(req, res);
}

module.exports = function(req, res, next) {
    if (config.server.api_access.free.indexOf(req.originalUrl) > -1 || req.isAuthenticated()) {
        return next();
    } else if (config.server.api_access.external.indexOf(req.originalUrl) > -1) {
        return authenticateForExternalApi(req, res, next);
    } else if (config.server.api_access.admin_only.indexOf(req.originalUrl) > -1) {
        return authenticateForAdminOnlyApi(req, res, next);
    } else {
        res.status(401).send('Authentication required');
    }
};
