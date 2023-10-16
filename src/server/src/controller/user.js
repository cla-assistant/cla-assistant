// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const passport = require('passport')
const express = require('express')
const utils = require('../middleware/utils')
const logger = require('../services/logger')
const { isUserAppAuthenticated } = require('../util')

const router = express.Router()
let scope

function checkReturnTo(req, res, next) {
    scope = null
    req.session.requiredScope = null
    if (!req.session) {
        req.session = {}
    }

    // for 'public' / 'user' routes we want to authenticate using OAuth
    // since we need to get the user's email address and can speicify the scope
    let strategy = 'github-app-auth'
    if (req.query.public === 'true') {
        scope = config.server.github.user_scope.concat()
        req.session.requiredScope = 'public'
        strategy = 'github-oauth'
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

    logger.debug('Check returnTo and call passport authenticate with appropriate scope. return to:', req.session.returnTo)

    passport.authenticate(strategy, {
        scope: scope
    })(req, res, next)
}

router.get('/auth/github', checkReturnTo)

const githubCallbackPost = (req, res) => {
    logger.debug('Process authentication callback after passport authenticate')
    logger.debug('User scopes:', req.user)
    if (req.user &&
        req.session.requiredScope !== 'public' &&
        utils.couldBeAdmin(req.user.login) &&
        // for authenticated routes we have to authenticate to the GitHub App.
        // tokens from a GitHub App start with ghu_
        !isUserAppAuthenticated(req.user)) {
        return res.redirect('/auth/github?admin=true')
    }
    res.redirect(req.session.returnTo || req.headers.referer || '/')
    req.session.next = null
    logger.debug('Finish processing authentication callback after passport authenticate')
}

router.get('/auth/github/callback',
    function (req, res, next) {
        logger.debug('Start processing OAuth authentication callback')
        next()
    },
    passport.authenticate('github-oauth', {
        failureRedirect: '/failure?failure=oauth'
    }),
    githubCallbackPost
)

router.get('/auth/github/app-callback',
    function (req, res, next) {
        logger.debug('Start processing App authentication callback')
        next()
    },
    passport.authenticate('github-app-auth', {
        failureRedirect: '/failure?failure=app-auth'
    }),
    githubCallbackPost
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