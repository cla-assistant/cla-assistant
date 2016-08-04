
//api
// var github_api = require('../api/github');
var https = require('https');
var url = require('url');
var q = require('q');

var GitHubApi = require('github');


function callGithub(github, obj, fun, arg, done) {
    github[obj][fun](arg, function (err, res) {
        if (typeof done === 'function') {
            done(err, res);
        }

    });
}

module.exports = {

    call: function(call, done) {
        var obj = call.obj;
        var fun = call.fun;
        var arg = call.arg || {};
        var token = call.token;
        var basicAuth = call.basicAuth;
        var deferred = q.defer();
        var error;
        var data = null;

        var github = new GitHubApi({
            protocol: config.server.github.protocol,
            version: config.server.github.version,
            host: config.server.github.api,
            pathPrefix: config.server.github.enterprise ? '/api/v3' : null
        });

        function collectData(err, res) {
            // if (res && !err) {
            if (res) {
                data = data ? data : res instanceof Array ? [] : {};
                data = res instanceof Array ? data.concat(res) : res;
            }

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

        if (!obj || !github[obj]) {
            error = 'obj required/obj not found';
            deferred.reject(error);
            if (typeof done === 'function') {
                done(error);
            };
            return;
        }

        if (!fun || !github[obj][fun]) {
            error = 'fun required/fun not found';
            deferred.reject(error);
            if (typeof done === 'function') {
                done(error);
            };
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

        callGithub(github, obj, fun, arg, collectData);

        return deferred.promise;
    },

    hasNextPage: function(link) {
        var github = new GitHubApi({
            protocol: config.server.github.protocol,
            version: config.server.github.version,
            host: config.server.github.api,
            pathPrefix: config.server.github.enterprise ? '/api/v3' : null
        });
        return github.hasNextPage(link);
    },

    getNextPage: function(link, cb) {
        var github = new GitHubApi({
            protocol: config.server.github.protocol,
            version: config.server.github.version,
            host: config.server.github.api,
            pathPrefix: config.server.github.enterprise ? '/api/v3' : null
        });
        return github.getNextPage(link, cb);
    },

    direct_call: function(args, done) {
        var deferred = q.defer();
        var http_req = {};
        var data = '';
        var req_url = url.parse(args.url);
        var options = {
            host: req_url.host,
            path: req_url.path,
            method: args.http_method || 'GET'
        };

        http_req = https.request(options, function(res) {
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function() {
                data = data ? JSON.parse(data) : null;
                var meta = {};
                meta.scopes = res.headers['x-oauth-scopes'];
                meta.link = res.headers.link;

                deferred.resolve({ data: data, meta: meta });

                if (typeof done === 'function') {
                    done(null, { data: data, meta: meta });
                }
            });
        });

        http_req.setHeader('Authorization', 'token ' + args.token);
        http_req.setHeader('User-Agent', 'cla-assistant');
        http_req.setHeader('Accept', 'application/vnd.github.moondragon+json');

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
