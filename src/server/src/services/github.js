const cache = require('memory-cache')
const config = require('../config')
const stringify = require('json-stable-stringify')
const logger = require('../services/logger')

const { Octokit } = require('@octokit/rest')
const { createAppAuth } = require('@octokit/auth-app')
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

async function callGithub(octokit, obj, fun, arg, cacheKey, isUseETag) {
    let res

    if (isUseETag && !config.server.nocache) {
        let cachedData = cache.get(cacheKey)
        if (cachedData) {
            arg.headers = {
                'If-None-Match': stringify(cachedData.headers.etag.split('"')[1])
            }
            delete arg.isUseETag
            try {
                res = await octokit[obj][fun](arg)
                return res
            }
            catch (error) {
                if (error.status === 304) {
                    logger.info(`Conditional request using etag for ${obj}.${fun}`)
                } else {
                    logger.error(new Error(error).stack)
                }
                return cachedData
            }
        }
    }
    if (fun.match(/list.*/g)) {
        const options = octokit[obj][fun].endpoint.merge(arg)
        res = {
            data: await octokit.paginate(options)
        }
    } else {
        res = await octokit[obj][fun](arg)
    }

    if (isUseETag && res && res.headers && res.headers.etag) {
        cache.put(cacheKey, res, 1000 * 60 * 60) // caching for one hour - rate limit will be reset
    }

    return res
}

function determineAuthentication(token, basicAuth) {
    if (token) {
        return `token ${token}`
    }
    if (basicAuth) {
        return {
            username: basicAuth.user,
            password: basicAuth.pass
        }
    }
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
        let octokitOptions = {}

        const cacheKey = generateCacheKey(arg, obj, fun, call.token)

        if (call.token || call.basicAuth) {
            const auth = determineAuthentication(call.token, call.basicAuth)
            octokitOptions = { auth }
        }

        const octokit = new OctokitWithPluginsAndDefaults(octokitOptions)

        if (!obj || !octokit[obj]) {
            throw new Error(`${obj} required/object not found or specified`)
        }

        if (!fun || !octokit[obj][fun]) {
            throw new Error(`${obj}.${fun} required/function not found or specified`)
        }

        try {
            return callGithub(octokit, obj, fun, arg, cacheKey, arg.isUseETag)
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
    delete argWithoutCacheParams.isUseETag
    return stringify({
        obj,
        fun,
        arg: argWithoutCacheParams,
        token
    })
}
