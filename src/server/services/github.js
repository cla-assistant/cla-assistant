
//api
// var github_api = require('../api/github');
var https = require('https');
var q = require('q');

var GitHubApi = require('github');

module.exports = {

    call: function(call, done) {

        var obj = call.obj;
        var fun = call.fun;
        var arg = call.arg || {};
        var token = call.token;

        var github = new GitHubApi({
            protocol: config.server.github.protocol,
            version: config.server.github.version,
            host: config.server.github.api,
            pathPrefix: config.server.github.enterprise ? '/api/v3' : null
        });

        if(!obj || !github[obj]) {
            return done('obj required/obj not found');
        }

        if(!fun || !github[obj][fun]) {
            return done('fun required/fun not found');
        }

        if(token) {
            github.authenticate({
                type: 'oauth',
                token: token
            });
        }

        github[obj][fun](arg, function(err, res) {

            var meta = {};

            try {
                meta.link = res.meta.link;
                meta.hasMore = !!github.hasNextPage(res.meta.link);
                meta.scopes = res.meta['x-oauth-scopes'];
                delete res.meta;
            } catch (ex) {
                meta = null;
            }

            if(typeof done === 'function') {
                done(err, res, meta);
            }

        });

    },

    direct_call: function(args, done) {
        var deferred = q.defer();
        var http_req = {};
        var data = '';
        http_req = https.request(args.url, function(res){
            res.on('data', function(chunk) { data += chunk; });
            res.on('end', function(){
                data = data ? JSON.parse(data) : null;
                var meta = {};
                meta.scopes = res.headers['x-oauth-scopes'];

                deferred.resolve({data: data, meta: meta});

                if (typeof done === 'function') {
                    done(null, {data: data, meta: meta});
                }
            });
        });

        http_req.setHeader('Authorization', 'token ' + args.token);
        http_req.setHeader('User-Agent', 'cla-assistant');
        http_req.setHeader('Accept', 'application/vnd.github.moondragon+json');

        http_req.end();

        http_req.on('error', function (e) {
            deferred.reject(e);

            if (typeof done === 'function') {
                done(e);
            }
        });
        return deferred.promise;
    }
};
