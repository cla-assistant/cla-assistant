const request = require('request');

const cache = require('memory-cache');
const config = require('../../config');
const Octokit = require('@octokit/rest')
    .plugin(require('@octokit/plugin-throttling'))
    .plugin(require('@octokit/plugin-retry'));
const stringify = require('json-stable-stringify');
const logger = require('../services/logger');

async function callGithub(octokit, obj, fun, arg, cacheKey) {
    const cachedRes = arg.noCache ? null : cache.get(cacheKey);
    delete arg.noCache;
    if (cachedRes && config.server.cache_time > 0) {
        return cachedRes
    }
    let res
    if (fun.match(/list.*/g)) {
        const options = octokit[obj][fun].endpoint.merge(arg)
        res = await octokit.paginate(options)
    } else {
        res = await octokit[obj][fun](arg)
    }

    if (res && config.server.cache_time > 0) {
        cache.put(cacheKey, {
            data: res,
            headers: res && res.headers ? res.headers : undefined
        }, 60000 * config.server.cache_time);
    }
    return res;
}

function newOctokit(auth) {
    return new Octokit({
        auth,
        protocol: config.server.github.protocol,
        version: config.server.github.version,
        host: config.server.github.api,
        pathPrefix: config.server.github.enterprise ? '/api/v3' : null,
        throttle: {
            onRateLimit: (retryAfter, options) => {
                octokit.log.warn(`Request quota exhausted for request ${options.method} ${options.url}`)

                if (options.request.retryCount === 0) { // only retries once
                    logger.info(`Retrying after ${retryAfter} seconds!`)
                    return true
                }
            },
            onAbuseLimit: (retryAfter, options) => {
                // does not retry, only logs a warning
                octokit.log.warn(`Abuse detected for request ${options.method} ${options.url}`)
            }
        }
    });
}


let githubService = {
    resetList: {},

    call: async function (call, done) {
        let arg = call.arg || {};
        const basicAuth = call.basicAuth;
        const fun = call.fun;
        const obj = call.obj;
        const token = call.token;

        let argWithoutNoCache = Object.assign({}, arg);
        delete argWithoutNoCache.noCache;

        const stringArgs = stringify({
            obj: call.obj,
            fun: call.fun,
            arg: argWithoutNoCache,
            token: call.token
        });

        let auth;
        if (token) {
            auth = `token ${token}`;
        }

        if (basicAuth) {
            auth = {
                username: basicAuth.user,
                password: basicAuth.pass
            };
        }
        const octokit = newOctokit(auth)

        if (!obj || !octokit[obj]) {
            throw 'obj required/obj not found'
        }

        if (!fun || !octokit[obj][fun]) {
            throw 'fun required/fun not found'
        }
        try {
            return callGithub(octokit, obj, fun, arg, stringArgs)
        } catch (error) {
            logger.info(`${error} - Error on callGithub.${obj}.${fun} with args ${arg}.`);
            throw new Error(error)
        }
    },

    callGraphql: function (query, token, cb) {
        request.post({
            headers: {
                'Authorization': `bearer ${token}`,
                'User-Agent': 'CLA assistant'
            },
            url: config.server.github.graphqlEndpoint,
            body: query
        }, cb);
    }
}

module.exports = githubService;
