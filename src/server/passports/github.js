const url = require('../services/url')
const repoService = require('../services/repo')
const orgApi = require('../api/org')
const logger = require('../services/logger')
const passport = require('passport')
const Strategy = require('passport-github2').Strategy
const merge = require('merge')
const User = require('mongoose').model('User')
const fetch = require('node-fetch')
const base64 = require('base-64')

function updateToken(item, newToken) {
    item.token = newToken
    item.save()
    logger.debug('Update access token for repo / org', item.repo || item.org)
}

async function checkToken(item, accessToken) {
    const baseURL = `https://api.github.com`
    const checkAuthApi = `${ baseURL }/applications/${ config.server.github.client }/token`
    const newToken = accessToken
    const oldToken = item.token
    const accesstokenObject = {
        access_token: oldToken
    }

    try {
        const header = {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + base64.encode(config.server.github.client + ":" + config.server.github.secret),
                'User-Agent': 'CLA assistant',
                'Accept': 'application/vnd.github.doctor-strange-preview+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(accesstokenObject)
        }
        const res = await fetch(checkAuthApi, header)
        const checkTokenResponse = await res.json()
        if (checkTokenResponse) {
            if (!(checkTokenResponse && checkTokenResponse.scopes && checkTokenResponse.scopes.indexOf('write:repo_hook') >= 0)) {
                updateToken(item, newToken)
            } else if (item.repo) {
                const ghRepo = await repoService.getGHRepo(item)
                if (!(ghRepo && ghRepo.permissions && ghRepo.permissions.admin)) {
                    updateToken(item, newToken)
                    logger.info('Update access token for repo ', item.repo, ' admin rights have been changed')
                }
            }
        }
    } catch (error) {
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
                token: accessToken,
                appInstalled: false
            })
        } catch (error) {
            logger.warn(new Error(`Could not create new user ${error}`).stack)
        }
    }
    // if (params.scope.indexOf('write:repo_hook') >= 0) {
    //     try {
    //         const repoRes = await repoService.getUserRepos({
    //             token: accessToken
    //         })
    //         if (repoRes && repoRes.length > 0) {
    //             repoRes.forEach((repo) => checkToken(repo, accessToken))
    //         }
    //     } catch (error) {
    //         logger.warn(new Error(error).stack)
    //     }
    // }
    // if (params.scope.indexOf('admin:org_hook') >= 0) {
    //     try {
    //         const orgRes = await orgApi.getForUser({
    //             user: {
    //                 token: accessToken,
    //                 login: profile.username
    //             }
    //         })
    //         if (orgRes && orgRes.length > 0) {
    //             orgRes.forEach((org) => checkToken(org, accessToken))
    //         }
    //     } catch (error) {
    //         logger.warn(new Error(error).stack)
    //     }
    // }
    done(null, merge(profile._json, {
        token: accessToken
    }))
}))

passport.serializeUser((user, done) => done(null, user))

passport.deserializeUser((user, done) => done(null, user))