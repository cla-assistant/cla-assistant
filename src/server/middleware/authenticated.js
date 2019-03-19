let passport = require('passport');
let q = require('q');
let utils = require('./utils');

function authenticateForExternalApi(req, res, next) {
    passport.authenticate('token', { session: false }, async function (err, user) {
        if (err) {
            return next(err);
        }

        if (!user) {
            res.status(401).json({ message: 'Incorrect token credentials' });

            return;
        }
        let hasPermission = false;
        try {
            if (req.args.repoId) {
                hasPermission = await utils.checkRepoPushPermissionById(req.args.repoId, user.token);
            } else if (req.args.org) {
                hasPermission = await utils.checkOrgAdminPermission(req.args.org, user.login, user.token);
            }
        } catch (e) {

            return res.status(403).json({ message: e || 'You have no push permission for this org or repo' });
        }
        // utils.checkRepoPushPermissionById(req.args.repoId, user.token, function (err, hasPermission) {
        if (hasPermission) {
            req.user = user;
            next();
        } else {
            res.status(403).json({ message: err || 'You have no push permission for this org or repo' });
        }
        // });
    })(req, res);
}

function authenticateForAdminOnlyApi(req, res, next) {
    if (config.server.github.adminToken) {
        return passport.authenticate('specialToken', { session: false }, (err, user) => {
            if (err) {
                return res.status(401).json({ message: 'Incorrect token credentials' });
            }
            req.user = user;
            return next();
        })(req, res);
    }
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
        let promises = [];
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

module.exports = function (req, res, next) {
    if (config.server.api_access.free.indexOf(req.originalUrl) > -1 || req.isAuthenticated()) {
        return next();
    } else if (config.server.api_access.external.indexOf(req.originalUrl) > -1) {
        return authenticateForExternalApi(req, res, next);
    } else if (config.server.api_access.admin_only.indexOf(req.originalUrl) > -1) {
        return authenticateForAdminOnlyApi(req, res, next);
    }
    res.status(401).send('Authentication required');
};
