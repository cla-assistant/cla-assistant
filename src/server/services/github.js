const request = require('request-promise-native')

const cache = require('memory-cache')
const config = require('../../config')
let Octokit = require('@octokit/rest')
    .plugin(require('@octokit/plugin-throttling'))
    .plugin(require('@octokit/plugin-retry'))
const stringify = require('json-stable-stringify')
const logger = require('../services/logger')

async function callGithub(octokit, obj, fun, arg, cacheKey) {
    const cachedRes = arg.noCache ? null : cache.get(cacheKey)
    delete arg.noCache
    if (cachedRes && config.server.cache_time > 0) {
        return cachedRes
    }
    let res
    if (fun.match(/list.*/g)) {
        const options = octokit[obj][fun].endpoint.merge(arg)
        res = { data: await octokit.paginate(options) }
    } else {
        res = await octokit[obj][fun](arg)
    }

    if (res && config.server.cache_time > 0) {
        cache.put(cacheKey, res, 60000 * config.server.cache_time)
    }

    return res
}

function newOctokit(auth) {
    Octokit = addReposGetByIdEndpoint()
    return new Octokit({
        auth,
        protocol: config.server.github.protocol,
        version: config.server.github.version,
        host: config.server.github.api,
        pathPrefix: config.server.github.enterprise ? '/api/v3' : null,
        throttle: {
            onRateLimit: (retryAfter, options) => {
                // eslint-disable-next-line no-console
                console.warn(`Request quota exhausted for request ${options.method} ${options.url}`)

                if (options.request.retryCount === 0) { // only retries once
                    // eslint-disable-next-line no-console
                    console.log(`Retrying after ${retryAfter} seconds!`)
                    return true
                }
            },
            onAbuseLimit: (retryAfter, options) => {
                // does not retry, only logs a warning
                // eslint-disable-next-line no-console
                console.warn(`Abuse detected for request ${options.method} ${options.url}`)
            }
        }
    })
}

function addReposGetByIdEndpoint() {
    return Octokit.plugin((octokit) => {
        octokit.registerEndpoints({
            repos: {
                getById: {
                    method: 'GET',
                    url: '/repositories/:id',
                    params: {
                        id: {
                            type: 'string',
                            required: true
                        }
                    }
                }
            }
        })
    })
}

const githubService = {
    resetList: {},

    call: async (call) => {
        const arg = call.arg || {}
        const basicAuth = call.basicAuth
        const fun = call.fun
        const obj = call.obj
        const token = call.token

        const argWithoutNoCache = Object.assign({}, arg)
        delete argWithoutNoCache.noCache

        const stringArgs = stringify({
            obj: call.obj,
            fun: call.fun,
            arg: argWithoutNoCache,
            token: call.token
        })

        let auth
        if (token) {
            auth = `token ${token}`
        }

        if (basicAuth) {
            auth = {
                username: basicAuth.user,
                password: basicAuth.pass
            }
        }
        const octokit = newOctokit(auth)

        if (!obj || !octokit[obj]) {
            throw new Error('obj required/obj not found')
        }

        if (!fun || !octokit[obj][fun]) {
            throw new Error('fun required/fun not found')
        }
        try {
            return callGithub(octokit, obj, fun, arg, stringArgs)
        } catch (error) {
            logger.info(`${error} - Error on callGithub.${obj}.${fun} with args ${arg}.`)
            throw new Error(error)
        }
    },

    callGraphql: async (query, token) => {
        return request.post({
            headers: {
                'Authorization': `bearer ${token}`,
                'User-Agent': 'CLA assistant'
            },
            url: config.server.github.graphqlEndpoint,
            body: query
        })
    }
}

module.exports = githubService
