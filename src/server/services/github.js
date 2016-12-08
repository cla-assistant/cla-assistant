//api
// var github_api = require('../api/github');
var https = require('https');
var url = require('url');
var q = require('q');

var GitHubApi = require('github');
var githubCallCount = 0;
var githubEtag = {};

function getETag(argsString) {
    return githubEtag[argsString] ? githubEtag[argsString] : null;
}

function setETag(argsString, etag) {
    if (etag) {
        githubEtag[argsString] = etag;
    }
}


function callGithub(github, obj, fun, arg, stringArgs, done) {
    var etagKey = stringArgs;
    github[obj][fun](arg, function(err, res) {
        console.log('node github res remaining', res.meta['x-ratelimit-remaining']);
        setETag(etagKey, res.meta.etag);
        if (typeof done === 'function') {
            done(err, res);
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

function newGithubApi(etag) {
    return new GitHubApi({
        protocol: config.server.github.protocol,
        version: config.server.github.version,
        headers: etag ? { 'If-None-Match': etag } : undefined,
        host: config.server.github.api,
        pathPrefix: config.server.github.enterprise ? '/api/v3' : null
    });
}

function parse_link_header(header) {
    if (header.length === 0) {
        throw new Error('input must not be of zero length');
    }
    var parts = header.split(',');
    var links = {};
    parts.forEach(function(p) {
        var section = p.split(';');
        if (section.length !== 2) {
            throw new Error('section could not be split on ";"');
        }
        var url = section[0].replace(/<(.*)>/, '$1').trim();
        var name = section[1].replace(/rel="(.*)"/, '$1').trim();
        links[name] = url;
    });
    return links;
}

var githubService = {

    call: function(call, done) {
        var arg = call.arg || {};
        var basicAuth = call.basicAuth;
        var data = null;
        var deferred = q.defer();
        var fun = call.fun;
        var obj = call.obj;
        var token = call.token;

        ++githubCallCount;
        // console.log(githubCallCount, 'node github: ', obj, fun, arg);
        var stringArgs = JSON.stringify({
            obj: call.obj,
            fun: call.fun,
            arg: call.arg
        });
        // if (getETag(stringArgs)) {
        //     github.headers = github.headers ? github.headers : {};
        //     github.headers['If-None-Match'] = getETag(stringArgs);
        // }
        var github = newGithubApi(getETag(stringArgs));

        function collectData(err, res) {
            data = concatData(data, res);

            var meta = {};
            try {
                meta.link = res.meta.link;
                meta.hasMore = !!github.hasNextPage(res.meta.link);
                meta.scopes = res.meta['x-oauth-scopes'];
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
                deferred.resolve({ data: data, meta: meta });
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
            return;
        }

        if (!fun || !github[obj][fun]) {
            reject('fun required/fun not found');
            return;
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

        callGithub(github, obj, fun, arg, stringArgs, collectData);

        return deferred.promise;
    },

    hasNextPage: function(link) {
        var github = newGithubApi();
        return github.hasNextPage(link);
    },

    getNextPage: function(link, cb) {
        var github = newGithubApi();
        return github.getNextPage(link, cb);
    },

    direct_call: function(args, done, _data) {
        ++githubCallCount;
        // console.log(githubCallCount, 'direct_call github: ', args);

        var argsString = JSON.stringify(args);
        var deferred = q.defer();
        var http_req = {};
        var fullData = _data;
        var data = '';
        var req_url = url.parse(args.url);
        var options = {
            host: req_url.host,
            path: req_url.path,
            method: args.http_method || 'GET'
        };
        var getNext = function(meta) {
            var links;
            try {
                links = meta.link ? parse_link_header(meta.link) : null;
            } catch (e) {
                links = null;
            }
            if (links && links.next) {
                args.url = links.next;
                githubService.direct_call(args, done, fullData).then(function(data) {
                    deferred.resolve(data);
                });
            } else {
                deferred.resolve({ data: fullData, meta: meta });

                if (typeof done === 'function') {
                    done(null, { data: fullData, meta: meta });
                }
            }
        };
        http_req = https.request(options, function(res) {
            res.on('data', function(chunk) {
                data += chunk;
            });
            res.on('end', function() {
                var meta = {};
                data = data ? JSON.parse(data) : null;
                fullData = concatData(fullData, data);

                meta.scopes = res.headers['x-oauth-scopes'];
                meta.link = res.headers.link;

                getNext(meta);
                console.log('direct call ', res.req.path, res.statusCode, 'remaining ', res.headers['x-ratelimit-remaining']);
                if (res.statusCode === 200) {
                    setETag(argsString, res.headers.etag);
                }
            });
        });

        http_req.setHeader('Authorization', 'token ' + args.token);
        http_req.setHeader('User-Agent', 'cla-assistant');
        http_req.setHeader('Accept', 'application/vnd.github.moondragon+json');
        if (getETag(argsString)) {
            console.log(getETag(argsString));
            http_req.setHeader('If-None-Match', getETag(argsString));
        }

        if (options.method === 'POST' && args.body) {
            http_req.write(JSON.stringify(args.body));
        }

        http_req.end();

        http_req.on('error', function(e) {
            deferred.reject(e);

            if (typeof done === 'function') {
                done(e);
            }
        });
        return deferred.promise;
    }
};

module.exports = githubService;
