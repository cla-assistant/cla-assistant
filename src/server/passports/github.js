const url = require('../services/url')
const repoService = require('../services/repo')
const orgApi = require('../api/org')
const github = require('../services/github')
const logger = require('../services/logger')
const passport = require('passport')
const Strategy = require('passport-github').Strategy
const merge = require('merge')
const User = require('mongoose').model('User')

function updateToken(item, newToken) {
    item.token = newToken
    item.save()
    logger.debug('Update access token for repo / org', item.repo || item.org)
}

async function checkToken(item, accessToken) {
    const newToken = accessToken
    const oldToken = item.token
    const args = {
        obj: 'oauthAuthorizations',
        fun: 'checkAuthorization',
        arg: {
            access_token: oldToken,
            client_id: config.server.github.client
        },
        basicAuth: {
            user: config.server.github.client,
            pass: config.server.github.secret
        }
    }

    try {
        const res = await github.call(args)
        if (!(res.data && res.data.scopes && res.data.scopes.indexOf('write:repo_hook') >= 0)) {
            updateToken(item, newToken)
        } else if (item.repo) {
            const ghRepo = await repoService.getGHRepo(item)
            if (!(ghRepo && ghRepo.permissions && ghRepo.permissions.admin)) {
                updateToken(item, newToken)
                logger.info('Update access token for repo ', item.repo, ' admin rights have been changed')
            }
        }
    } catch (e) {
        updateToken(item, newToken)
    }
}

passport.use(new Strategy({
    clientID: config.server.github.client,
    clientSecret: config.server.github.secret,
    callbackURL: url.githubCallback,
    authorizationURL: url.githubAuthorization,
    tokenURL: url.githubToken,
    userProfileURL: url.githubProfile()
}, async (accessToken, _refreshToken, params, profile, done) => {
    let user
    try {
        user = await User.findOne({
            name: profile.username
        })

        if (user && !user.uuid) {
            user.uuid = profile.id
        }
        user.token = accessToken
        user.save()
    } catch (error) {
        logger.warn(error.stack)
    }

    if (!user) {
        try {
            await User.create({
                uuid: profile.id,
                name: profile.username,
                token: accessToken
            })
        } catch (error) {
            logger.warn(new Error(`Could not create new user ${error}`).stack)
        }
    }
    // User.update({
    //     uuid: profile.id
    // }, {
    //     name: profile.username,
    //     email: '', // needs fix
    //     token: accessToken
    // }, {
    //     upsert: true
    // }, function () {})

    if (params.scope.indexOf('write:repo_hook') >= 0) {
        try {
            const repoRes = await repoService.getUserRepos({
                token: accessToken
            })
            if (repoRes && repoRes.length > 0) {
                repoRes.forEach((repo) => checkToken(repo, accessToken))
            }
        } catch (error) {
            logger.warn(new Error(error).stack)
        }
    }
    if (params.scope.indexOf('admin:org_hook') >= 0) {
        try {
            const orgRes = await orgApi.getForUser({
                user: {
                    token: accessToken,
                    login: profile.username
                }
            })
            if (orgRes && orgRes.length > 0) {
                orgRes.forEach((org) => checkToken(org, accessToken))
            }
        } catch (error) {
            logger.warn(new Error(error).stack)
        }
    }
    done(null, merge(profile._json, {
        token: accessToken,
        scope: params.scope
    }))
}))

passport.serializeUser((user, done) => done(null, user))

passport.deserializeUser((user, done) => done(null, user))