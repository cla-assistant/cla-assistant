// module
var github = require('../services/github');
var repoService = require('../services/repo');
var url = require('../services/url');

function createRepoHook(req, done) {
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
}

function updateRepoHook(owner, repo, id, active, token, done) {
    github.call({
        obj: 'repos',
        fun: 'editHook',
        arg: {
            user: owner,
            repo: repo,
            name: 'web',
            config: { url: url.webhook(repo), content_type: 'json' },
            id: id,
            active: active
        },
        token: token
    }, done);
}

function getHook(obj, arg, token, done) {
    github.call({
        obj: obj,
        fun: 'getHooks',
        arg: arg,
        token: token
    }, function callback(err, hooks) {
        var hook = null;

        if (!err && hooks && hooks.length > 0) {
            hooks.forEach(function (webhook) {
                if (webhook.config.url && webhook.config.url.indexOf(url.baseWebhook) > -1) {
                    hook = webhook;
                }
            });
        } else if (hooks && hooks.message) {
            err = err + hooks.message;

        }
        done(err, hook);
    });
}

function deactevateRepoHook(owner, repo, token, done) {
    getHook('repos', {
        user: owner,
        repo: repo
    }, token, function (err, hook) {
        if (hook && hook.id) {
            updateRepoHook(owner, repo, hook.id, false, token, done);
        }
    });
}

function createOrgHook(req, done) {
    var org = req.args.org;
    var args = {
        url: url.githubOrgWebhook(org),
        token: req.user.token,
        http_method: 'POST',
        body: {
            name: 'web',
            config: { url: url.webhook(org), content_type: 'json' },
            events: ['pull_request'],
            active: true
        }
    };
    github.direct_call(args, function (err, data) {
        done(err, data);
        repoService.getByOwner(org, function (err, repos) {
            if (repos && repos.length > 0) {
                repos.forEach(function (repo) {
                    deactevateRepoHook(org, repo.repo, repo.token, function () {});
                });
            }
        });
    });
}

function extractGithubArgs(args) {
    var obj = args.org ? 'orgs' : 'repos';
    var arg = args.org ? {
        org: args.org
    } : {
        user: args.user,
        repo: args.repo
        };
    return { obj: obj, arg: arg };
}

module.exports = {

    get: function (req, done) {
        var githubArgs = extractGithubArgs(req.args);

        getHook(githubArgs.obj, githubArgs.arg, req.user.token, done);

        // now we will have to check two things:
        // 1) webhook user still has push access to this repo
        // 2) token is still valid
        // -> if one of these conditions is not met we will
        //    delete the webhook

        // if(hook) {
        // }
    },

    create: function (req, done) {
        return req.args && req.args.orgId ? createOrgHook(req, done) : createRepoHook(req, done);
    },

    remove: function (req, done) {
        this.get(req, function (err, hook) {
            if (err || !hook) {
                done(err || 'No webhook found with base url ' + url.baseWebhook);
                return;
            }
            var githubArgs = extractGithubArgs(req.args);
            githubArgs.arg.id = hook.id;

            github.call({
                obj: githubArgs.obj,
                fun: 'deleteHook',
                arg: githubArgs.arg,
                token: req.user.token
            }, done);
        });

    }
};
