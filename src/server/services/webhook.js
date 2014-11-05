// module
var url = require('../services/url');
var github = require('../services/github');

module.exports = {

    get: function(user, repo, token, done) {
        github.call({
            obj: 'repos',
            fun: 'getHooks',
            arg: {
                user: user,
                repo: repo
            },
            token: token
        }, function(err, hooks) {
            var hook = null;

            if(!err) {
                hooks.forEach(function(webhook) {
                    if(webhook.config.url && webhook.config.url.indexOf(url.baseWebhook) > -1) {
                        hook = webhook;
                    }
                });
            }
            done(err, hook);
        });
    }
};
