// module
var url = require('../services/url');
var github = require('../services/github');
var webhook = require('../services/webhook');
// models
var Repo = require('mongoose').model('Repo');

module.exports = {

    get: function(req, done) {

        webhook.get(req.args.user, req.args.repo, req.user.token,
            function(err, hook) {

                // now we will have to check two things:
                // 1) webhook user still has push access to this repo
                // 2) token is still valid
                // -> if one of these conditions is not met we will
                //    delete the webhook

                // if(hook) {

                // }

                done(err, hook);
            }
        );
    },

    create: function(req, done) {
        // Repo.findOne({repo: req.args.user_uuid}, function(err, user) {

        //     if(!user) {
        //         return done(err);
        //     }

            github.call({
                obj: 'repos',
                fun: 'createHook',
                arg: {
                    user: req.args.owner,
                    repo: req.args.repo,
                    name: 'web',
                    config: { url: url.webhook(req.args.repo), content_type: 'json' },
                    events: ['pull_request'],
                    active: true
                },
                token: req.user.token
            }, done);
        // });
    },

    remove: function(req, done) {
        this.get(req, function(err, hook){
            if (err || !hook) {
                done(err);
            }
            github.call({
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    user: req.args.user,
                    repo: req.args.repo,
                    id: hook.id
                },
                token: req.user.token
            }, done);
        });

    }
};
