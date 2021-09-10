const fetch = require('node-fetch')
const cache = require('memory-cache')
const config = require('../../config')
const stringify = require('json-stable-stringify')
const logger = require('../services/logger')

const { Octokit } = require('@octokit/rest')
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
        return `token ${token}`
    }
    if (basicAuth) {
        return {
            username: basicAuth.user,
            password: basicAuth.pass
        }
    }
}

const githubService = {
    resetList: {},

    call: async (call) => {
        const arg = call.arg || {}
        const fun = call.fun
        const obj = call.obj
        const cacheKey = generateCacheKey(arg, obj, fun, call.token)

        const auth = determineAuthentication(call.token, call.basicAuth)

        const octokit = new OctokitWithPluginsAndDefaults({ auth })

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
        const response = await fetch(config.server.github.graphqlEndpoint, {
            method: 'POST',
            headers: {
                'Authorization': `bearer ${token}`,
                'User-Agent': 'CLA assistant',
                'Content-Type': 'application/json',
            },
            body: query
        })
        const dataPromise = response.json()
        return dataPromise
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
