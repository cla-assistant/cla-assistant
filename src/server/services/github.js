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

    }

};
