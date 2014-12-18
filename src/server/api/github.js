// module
var github = require('../services/github');
var merge = require('merge');
var path = require('path');
var https = require('https');
var q = require('q');
// models
var User = require('mongoose').model('User');

module.exports = {
    call: function(req, done) {
        github.call(merge(req.args, {
            token: req.user.token
        }), function(err, res, meta) {
            done(err, {
                data: res,
                meta: meta
            });
        });
    },

    direct_call: function(req, done) {
        var deferred = q.defer();
        var http_req = {};
        var data = '';
        http_req = https.request(req.args.url, function(res){
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

        http_req.setHeader('Authorization', 'token ' + req.user.token);
        http_req.setHeader('User-Agent', 'cla-assistant');

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
