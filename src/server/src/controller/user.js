// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const passport = require('passport')
const express = require('express')
const utils = require('../middleware/utils')
const logger = require('../services/logger')

const router = express.Router()
let scope

function checkReturnTo(req, res, next) {
    scope = null
    req.session.requiredScope = null
    if (!req.session) {
        req.session = {}
    }

    if (req.query.public === 'true') {
        scope = config.server.github.user_scope.concat()
        req.session.requiredScope = 'public'
    }
    if (req.query.admin === 'true') {
        scope = config.server.github.admin_scope.concat()
        req.session.requiredScope = 'admin'
    }
    if (req.query.org_admin === 'true') {
        scope.push('admin:org_hook')
        req.session.requiredScope = 'org_admin'
    }

    req.session.returnTo = req.query.public === 'true' ? req.session.next || req.headers.referer : '/'

    logger.debug('Check returnTo and call passport authenticate with appropriate scope')

    passport.authenticate('github', {
        scope: scope
    })(req, res, next)
}

router.get('/auth/github', checkReturnTo)

router.get('/auth/github/callback',
    function (req, res, next) {
        logger.debug('Start processing authentication callback')
        next()
    },
    passport.authenticate('github', {
        failureRedirect: '/'
    }),
    function (req, res) {
        logger.debug('Process authentication callback after passport authenticate')
        if (req.user && req.session.requiredScope != 'public' && utils.couldBeAdmin(req.user.login) && (!req.user.scope || req.user.scope.indexOf('write:repo_hook') < 0)) {
            return res.redirect('/auth/github?admin=true')
        }
        res.redirect(req.session.returnTo || req.headers.referer || '/')
        req.session.next = null
        logger.debug('Finish processing authentication callback after passport authenticate')
    }
)

router.get('/logout',
    function (req, res, next) {
        req.logout()
        if (!req.query.noredirect) {
            res.redirect('/')
        } else {
            next()
        }
    }
)

module.exports = router