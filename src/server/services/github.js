let q = require('q');
let request = require('request');

let cache = require('memory-cache');
let config = require('../../config');
let GitHubApi = require('github');
let stringify = require('json-stable-stringify');
let logger = require('./logger');


// let githubApi;

function callGithub(github, obj, fun, arg, token, done) {
    let noCache = arg.noCache;
    delete arg.noCache;
    let cacheKey = stringify({
        obj: obj,
        fun: fun,
        arg: arg,
        token: token
    });
    let cachedRes = noCache ? null : cache.get(cacheKey);
    if (cachedRes && config.server.cache_time > 0 && typeof done === 'function') {
        if (cachedRes.meta) {
            cachedRes.data.meta = cachedRes.meta;
        }
        done(null, cachedRes.data);

        return;
    }
    github[obj][fun](arg, function (err, res) {
        if (res && !res.message && config.server.cache_time > 0) {
            cache.put(cacheKey, {
                data: res,
                meta: res && res.meta ? res.meta : undefined
            }, 60000 * config.server.cache_time);
        }

        logger.info({ name: 'CLAAssistantGithubCall', obj: obj, fun: fun, arg: JSON.stringify(arg), token: token ? token.slice(0, 4) + '***' : '', remaining: res && res.meta ? res.meta['x-ratelimit-remaining'] : '' });

        if (typeof done === 'function') {
            done(err, res);
            // cacheMissCount++;
        }
    });
}

function concatData(collection, chunk) {
    if (chunk) {
        collection = collection ? collection : chunk instanceof Array ? [] : {};
        collection = chunk instanceof Array ? collection.concat(chunk) : chunk;
    }

    return collection;
}

function newGithubApi() {
    // githubApi = githubApi ? githubApi : new GitHubApi({
    let githubApi = new GitHubApi({
        protocol: config.server.github.protocol,
        version: config.server.github.version,
        host: config.server.github.api,
        pathPrefix: config.server.github.enterprise ? '/api/v3' : null
    });

    return githubApi;
}


let githubService = {
    resetList: {},

    call: function (call, done) {
        let arg = call.arg || {};
        let basicAuth = call.basicAuth;
        let data = null;
        let deferred = q.defer();
        let fun = call.fun;
        let obj = call.obj;
        let token = call.token;

        let github = newGithubApi();

        function collectData(err, res) {
            data = res && res.data ? concatData(data, res.data) : data;

            let meta = {};
            try {
                meta.link = res.meta.link;
                // meta.hasMore = !!meta.link && !!github.hasNextPage(res.meta.link);
                meta.hasMore = !!meta.link && !!github.hasNextPage(res.meta);
                meta.scopes = res.meta['x-oauth-scopes'];
                if (res.meta['x-ratelimit-remaining'] < 100) {
                    setRateLimit(call.token, res.meta['x-ratelimit-reset']);
                    logger.info('rate limit exceeds for ', call);
                }
                delete res.meta;
            } catch (ex) {
                meta = null;
            }

            if (meta && meta.hasMore) {
                try {
                    github.getNextPage(meta, collectData);
                } catch (error) {
                    logger.error(new Error('Could not get next page ' + error).stack);
                    if (typeof done === 'function') {
                        done(err, data, meta);
                    }
                    deferred.resolve({
                        data: data,
                        meta: meta
                    });
                }
            } else {
                if (typeof done === 'function') {
                    done(err, data, meta);
                }
                deferred.resolve({
                    data: data,
                    meta: meta
                });
            }
        }

        function reject(error) {
            deferred.reject(error);
            if (typeof done === 'function') {
                done(error);
            }
        }

        if (!obj || !github[obj]) {
            reject('obj required/obj not found');

            return deferred.promise;
        }

        if (!fun || !github[obj][fun]) {
            reject('fun required/fun not found');

            return deferred.promise;
        }

        if (token) {
            github.authenticate({
                type: 'oauth',
                token: token
            });
        }

        if (basicAuth) {
            github.authenticate({
                type: 'basic',
                username: basicAuth.user,
                password: basicAuth.pass
            });
        }

        setTimeout(function () {
            callGithub(github, obj, fun, arg, token, collectData);
        }, getRateLimitTime(token));

        return deferred.promise;
    },

    hasNextPage: function (meta) {
        let github = newGithubApi();

        return github.hasNextPage(meta);
    },

    getNextPage: function (meta, cb) {
        let github = newGithubApi();

        return github.getNextPage(meta, cb);
    },

    // getCacheData: function () {
    //     return {
    //         hit: cacheHitCount,
    //         miss: cacheMissCount,
    //         currentSize: cache.size()
    //     };
    // }

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
};

function getRateLimitTime(token) {
    let remainingTime = githubService.resetList[token] ? githubService.resetList[token] - Date.now() : 0;

    return Math.max(remainingTime, 0);
}

function removeRateLimit(token) {
    try {
        delete githubService.resetList[token];
    } catch (e) {
        logger.debug(e.stack);
    }
}

function setRateLimit(token, limit) {
    githubService.resetList[token] = limit * 1000;
    let remainingTime = (limit * 1000) - Date.now();
    setTimeout(function () {
        removeRateLimit(token);
    }, remainingTime);
}

module.exports = githubService;
