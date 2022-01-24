const cache = require('memory-cache')
const config = require('../config')
const stringify = require('json-stable-stringify')
const logger = require('../services/logger')

const { Octokit } = require('@octokit/rest')
const { createAppAuth } = require('@octokit/auth-app')
const { createOAuthAppAuth } = require('@octokit/auth-oauth-app');

const OctokitWithPluginsAndDefaults = Octokit.plugin(
    require('@octokit/plugin-retry').retry,
    require('@octokit/plugin-throttling').throttling,
    require('./octokit-plugins/custom-endpoints').reposGetById,
    require('./octokit-plugins/network-interceptor').rateLimitLogger,
).defaults({
    protocol: config.server.github.protocol,
    version: config.server.github.version,
    host: config.server.github.api,
    pathPrefix: config.server.github.enterprise ? '/api/v3' : null,
    userAgent: 'CLA assistant',
    throttle: {
        onRateLimit: (retryAfter, options) => {
            logger.info(`Request quota exhausted for request ${options.method} ${options.url}`)
            if (options.request.retryCount === 0) { // only retries once
                logger.info(`Retrying after ${retryAfter} seconds!`)
                return true
            }
        },
        onAbuseLimit: (retryAfter, options) => {
            // does not retry, only logs a warning
            logger.info(`Abuse detected for request ${options.method} ${options.url}`)
        }
    }
})

async function callGithub(octokit, obj, fun, arg, cacheKey, cacheTime) {
    if (cacheKey && !config.server.nocache) {
        const cachedRes = cache.get(cacheKey)
        if (cachedRes) {
            logger.info(`Result returned from cache for ${obj}.${fun}`)
            return cachedRes
        }
    }
    let res
    if (fun.match(/list.*/g)) {
        const options = octokit[obj][fun].endpoint.merge(arg)
        res = {
            data: await octokit.paginate(options)
        }
    } else {
        res = await octokit[obj][fun](arg)
        // logger.info(`Result for ${obj}.${fun}`)
    }

    if (res && cacheTime) {
        cache.put(cacheKey, res, 1000 * cacheTime)
    }

    return res
}

function determineAuthentication(token, basicAuth) {
    if (token) {
        return { auth: `token ${token}` }
    }
    // basic Auth means that we want to act as the OAuthApp
    if (basicAuth) {
        return {
            authStrategy: createOAuthAppAuth,
            auth: {
                clientId: basicAuth.user,
                clientSecret: basicAuth.pass
            }
        }
    }
    // if nothing matches we return an empty object, so we have the same types
    return {}
}

async function getInstallationId(octokit, arg) {
    // Test: using the user installtion for both user and organization installation
    const result = await callGithub(octokit, 'apps', 'getUserInstallation', arg);
    return result.data.id;
}

async function getInstallationAccessToken(username) {
    const JWToctokit = new OctokitWithPluginsAndDefaults({
        authStrategy: createAppAuth,
        auth: config.server.github.app
    });
    const installation_id = await getInstallationId(JWToctokit, { username });
    const result = await callGithub(JWToctokit, 'apps', 'createInstallationAccessToken', { installation_id });
    return result.data.token;
}

const githubService = {
    resetList: {},

    call: async (call) => {
        const arg = call.arg || {}
        const fun = call.fun
        const obj = call.obj
        const cacheKey = generateCacheKey(arg, obj, fun, call.token)

        const { auth, authStrategy } = determineAuthentication(call.token, call.basicAuth)

        const octokit = new OctokitWithPluginsAndDefaults({ auth, authStrategy })

        if (!obj || !octokit[obj]) {
            throw new Error(`${obj} required/object not found or specified`)
        }

        if (!fun || !octokit[obj][fun]) {
            throw new Error(`${obj}.${fun} required/function not found or specified`)
        }

        try {
            return callGithub(octokit, obj, fun, arg, cacheKey, arg.cacheTime)
        } catch (error) {
            logger.info(`${error} - Error on callGithub.${obj}.${fun} with args ${arg}.`)
            throw new Error(error)
        }
    },

    callGraphql: async (query, token) => {
        const octokit = new OctokitWithPluginsAndDefaults({ auth: token })
        const response = await octokit.graphql(query.query, query.variables)
        // workaround as the other functions expect the response body in the data attribute
        // TODO: refactor probably
        return { data: response }
    },

    callWithGitHubApp: async (request) => {
        try {
            const username = request.owner
            delete request.owner
            const token = await getInstallationAccessToken(username)
            request.token = token
            logger.info(request)
        } catch (error) {
            logger.error(error);
        }
        return githubService.call(request);
    },

    callGraphqlWithGitHubApp: async (query, token) => {
        try {
            const username = query.owner
            delete query.owner
            const ghsToken = await getInstallationAccessToken(username)
            token = ghsToken
            logger.info(query)
        } catch (error) {
            logger.error(error);
        }
        return githubService.callGraphql(query, token);
    }
}

module.exports = githubService

function generateCacheKey(arg, obj, fun, token) {
    const argWithoutCacheParams = Object.assign({}, arg)
    delete argWithoutCacheParams.cacheTime
    return stringify({
        obj,
        fun,
        arg: argWithoutCacheParams,
        token
    })
}
