var q = require('q');

var cache = require('memory-cache');
var config = require('../../config');
var GitHubApi = require('github');


function callGithub(github, obj, fun, arg, stringArgs, done) {
    var cacheKey = stringArgs;
    var cachedRes = arg.noCache ? null : cache.get(cacheKey);
    delete arg.noCache;
    if (cachedRes && config.server.cache_time > 0 && typeof done === 'function') {
        if (cachedRes.meta) {
            cachedRes.data.meta = cachedRes.meta;
        }
        done(null, cachedRes.data);
        // cacheHitCount++;
        return;
    }
    github[obj][fun](arg, function (err, res) {
        if (res && !res.message && config.server.cache_time > 0) {
            cache.put(cacheKey, {
                data: res,
                meta: res && res.meta ? res.meta : undefined
            }, 60000 * config.server.cache_time);
        }

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
    return new GitHubApi({
        protocol: config.server.github.protocol,
        version: config.server.github.version,
        host: config.server.github.api,
        pathPrefix: config.server.github.enterprise ? '/api/v3' : null
    });
}


var githubService = {
    resetList: {},

    call: function (call, done) {
        var arg = call.arg || {};
        var basicAuth = call.basicAuth;
        var data = null;
        var deferred = q.defer();
        var fun = call.fun;
        var obj = call.obj;
        var token = call.token;

        var stringArgs = JSON.stringify({
            obj: call.obj,
            fun: call.fun,
            arg: call.arg,
            token: call.token
        });
        var github = newGithubApi();

        function collectData(err, res) {
            data = concatData(data, res);

            var meta = {};
            try {
                meta.link = res.meta.link;
                meta.hasMore = !!github.hasNextPage(res.meta.link);
                meta.scopes = res.meta['x-oauth-scopes'];
                if (res.meta['x-ratelimit-remaining'] < 100) {
                    setRateLimit(call.token, res.meta['x-ratelimit-reset']);
                    console.log('rate limit exceeds for ', call);
                }
                delete res.meta;
            } catch (ex) {
                meta = null;
            }

            if (meta && meta.link && github.hasNextPage(meta.link)) {
                github.getNextPage(meta.link, collectData);
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
            callGithub(github, obj, fun, arg, stringArgs, collectData);
        }, getRateLimitTime(token));

        return deferred.promise;
    },

    hasNextPage: function (link) {
        var github = newGithubApi();
        return github.hasNextPage(link);
    },

    getNextPage: function (link, cb) {
        var github = newGithubApi();
        return github.getNextPage(link, cb);
    },

    // getCacheData: function () {
    //     return {
    //         hit: cacheHitCount,
    //         miss: cacheMissCount,
    //         currentSize: cache.size()
    //     };
    // }
};

function getRateLimitTime(token) {
    var remainingTime = githubService.resetList[token] ? githubService.resetList[token] - Date.now() : 0;
    return Math.max(remainingTime, 0);
}

function removeRateLimit(token) {
    try {
        delete githubService.resetList[token];
    } catch (e) {}
}

function setRateLimit(token, limit) {
    githubService.resetList[token] = limit * 1000;
    var remainingTime = (limit * 1000) - Date.now();
    setTimeout(function () {
        removeRateLimit(token);
    }, remainingTime);
}

module.exports = githubService;
