// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

let passport = require('passport')
let utils = require('./utils')
const config = require('../../../server/src/config')
const { isUserAppAuthenticated } = require('../util')

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
        if (!utils.couldBeAdmin(user.login) || (req.args.org && !isUserAppAuthenticated(user))) {
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
    let requestedUrl = req.originalUrl.trim()
    while (requestedUrl.endsWith('/')) {
        requestedUrl = requestedUrl.substring(0, requestedUrl.length - 1)
    }
    if (config.server.api_access.free.includes(requestedUrl)) {
        return next()
    }
    if (config.server.api_access.admin_only.includes(requestedUrl)) {
        return authenticateForAdminOnlyApi(req, res, next)
    }
    if (config.server.api_access.authenticated.includes(requestedUrl) && req.isAuthenticated()) {
        return next()
    }
    res.status(401).send('Authentication required')
}
