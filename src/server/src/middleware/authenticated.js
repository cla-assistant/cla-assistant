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

        const args = req.args || {}
        const isOrgScoped = !!args.org || !!args.orgId
        if (!utils.couldBeAdmin(user.login) || (isOrgScoped && (!isUserAppAuthenticated(user) || !user.scope || user.scope.indexOf('admin:org_hook') < 0))) {
            return res.status(403).json({ message: 'Must have admin:org_hook permission scope' })
        }

        // Build the list of permission checks. Authorization must be tied to a concrete
        // resource, independent of how that resource is named in the request.
        const promises = []
        const authorizedResource = {}

        if ((args.owner && args.repo) || args.repoId) {
            promises.push(
                utils.checkRepoPushPermissionByName(args.repo, args.owner, args.repoId, user.token)
                    .then((repoData) => {
                        authorizedResource.repoId = args.repoId || (repoData && repoData.id)
                    })
            )
        }
        if (args.org) {
            promises.push(
                utils.checkOrgAdminPermission(args.org, user.login, user.token)
                    .then((membership) => {
                        authorizedResource.org = args.org
                        if (membership && membership.organization && membership.organization.id) {
                            authorizedResource.orgId = membership.organization.id
                        }
                    })
            )
        } else if (args.orgId) {
            // Resolve orgId -> org (via the linked Org record) and verify org-admin rights.
            promises.push(
                utils.checkOrgAdminPermissionById(args.orgId, user.login, user.token)
                    .then((linkedOrg) => {
                        authorizedResource.orgId = linkedOrg.orgId || args.orgId
                        authorizedResource.org = linkedOrg.org
                    })
            )
        }

        // Fail closed: if the request carries no resource identifier that can be authorized,
        // reject it rather than allowing it through with an empty permission-check list.
        if (promises.length === 0) {
            return res.status(403).json({ message: 'No authorizable resource provided' })
        }

        return Promise.all(promises).then(function () {
            req.user = user
            req.authorizedResource = authorizedResource
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
