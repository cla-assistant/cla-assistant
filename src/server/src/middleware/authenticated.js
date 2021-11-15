let passport = require('passport')
let utils = require('./utils')

function authenticateForAdminOnlyApi(req, res, next) {
    passport.authenticate('token', { session: false }, function (err, user) {
        if (err) {
            return next(err)
        }
        try {
            user = user ? user : req.user
        } catch (error) {
            throw new Error(error)
        }
        if (!user) {
            return res.status(401).json({ message: 'Incorrect token credentials' })
        }
        if (!utils.couldBeAdmin(user.login) || (req.args.org && user.scope.indexOf('admin:org_hook') < 0)) {
            return res.status(403).json({ message: 'Must have admin:org_hook permission scope' })
        }
        let promises = []
        if ((req.args.owner && req.args.repo) || req.args.repoId) {
            promises.push(utils.checkRepoPushPermissionByName(req.args.repo, req.args.owner, req.args.repoId, user.token))
        }
        if (req.args.org) {
            promises.push(utils.checkOrgAdminPermission(req.args.org, user.login, user.token))
        }

        return Promise.all(promises).then(function () {
            req.user = user
            next()
        }).catch(function (error) {
            return res.status(403).json({ message: error.message || error })
        })

    })(req, res)
}

module.exports = function (req, res, next) {
    if (config.server.api_access.free.indexOf(req.originalUrl) > -1) {
        return next()
    } else if (config.server.api_access.admin_only.indexOf(req.originalUrl) > -1) {
        return authenticateForAdminOnlyApi(req, res, next)
    } else if (req.isAuthenticated()) {
        return next()
    }
    res.status(401).send('Authentication required')
}
