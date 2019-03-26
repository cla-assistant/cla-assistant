// module
let github = require('../services/github');
let repoService = require('../services/repo');
let url = require('../services/url');
let async = require('async');

function getHook(owner, repo, noCache, token, done) {
    if (!owner || !token) {
        return done('Owner/org and token is required.');
    }
    let args = {
        fun: 'getHooks',
        arg: {
            noCache: noCache
        },
        token: token
    };
    if (repo) {
        args.obj = 'repos';
        args.arg.owner = owner;
        args.arg.repo = repo;
    } else {
        args.obj = 'orgs';
        args.arg.org = owner;
    }
    github.call(args, function callback(err, hooks) {
        let hook = null;

        if (!err && hooks && hooks.length > 0) {
            hooks.forEach(function (webhook) {
                if (webhook.active && webhook.config.url
                    && (
                        webhook.config.url.indexOf(url.baseWebhook) > -1
                        || webhook.config.url === url.webhook(owner, repo)
                    )
                ) {
                    hook = webhook;
                }
            });
        } else if (hooks && hooks.message) {
            err = err + hooks.message;

        }
        done(err, hook);
    });
}

function getRepoHook(owner, repo, noCache, token, done) {
    getHook(owner, repo, noCache, token, function (error, hook) {
        if (error || hook) {
            return done(error, hook);
        }
        getHook(owner, undefined, noCache, token, function (error, hook) {
            if (error && error.code !== 404) {
                // When the owner is not an org, github returns 404.
                return done(error);
            }

            return done(null, hook);
        });
    });
}

function getOrgHook(org, noCache, token, done) {
    getHook(org, undefined, noCache, token, done);
}

function createHook(owner, repo, token, done) {
    if (!owner || !token) {
        return done('Owner/org and token is required.');
    }
    let args = {
        fun: 'createHook',
        arg: {
            noCache: true,
            config: { content_type: 'json' },
            name: 'web',
            events: ['pull_request'],
            active: true
        },
        token: token
    };
    if (repo) {
        args.obj = 'repos';
        args.arg.repo = repo;
        args.arg.owner = owner;
        args.arg.config.url = url.webhook(owner, repo);
    } else {
        args.obj = 'orgs';
        args.arg.org = owner;
        args.arg.config.url = url.webhook(owner);
    }
    github.call(args, done);
}

function createRepoHook(owner, repo, token, done) {
    getRepoHook(owner, repo, true, token, function (error, hook) {
        if (error || hook) {
            return done(error, hook);
        }
        createHook(owner, repo, token, done);
    });
}

function createOrgHook(org, token, done) {
    getOrgHook(org, true, token, function (error, hook) {
        if (error || hook) {
            return done(error || 'Webhook already exist with ' + url.webhook(org));
        }
        createHook(org, undefined, token, function (err, hook) {
            if (err) {
                return done(err, null);
            }
            handleHookForLinkedRepoInOrg(org, token, removeRepoHook, function (e) {
                done(e, hook);
            });
        });
    });
}

function removeHook(owner, repo, hookId, token, done) {
    if (!owner || !token) {
        return done('Owner/org and token is required.');
    }
    let args = {
        fun: 'deleteHook',
        arg: {
            id: hookId,
            noCache: true
        },
        token: token
    };
    if (repo) {
        args.obj = 'repos';
        args.arg.owner = owner;
        args.arg.repo = repo;
    } else {
        args.obj = 'orgs';
        args.arg.org = owner;
    }
    github.call(args, done);
}

function removeRepoHook(owner, repo, token, done) {
    getRepoHook(owner, repo, true, token, function (err, hook) {
        if (err || !hook) {
            return done(err || 'No webhook found with base url ' + url.webhook(owner, repo));
        }
        if (hook.type === 'Organization') {
            return done(null, null);
        }
        removeHook(owner, repo, hook.id, token, done);
    });
}

function removeOrgHook(org, token, done) {
    getOrgHook(org, true, token, function (error, hook) {
        if (error || !hook) {
            return done(error || 'No webhook found with base url ' + url.webhook(org));
        }
        removeHook(org, undefined, hook.id, token, function (err) {
            if (err) {
                return done(err, null);
            }
            handleHookForLinkedRepoInOrg(org, token, createRepoHook, function (e) {
                done(e, hook);
            });
        });
    });
}

function handleHookForLinkedRepoInOrg(org, token, delegateFun, done) {
    repoService.getByOwner(org, function (error, repos) {
        if (error || !repos || repos.length === 0) {
            return done(error);
        }
        async.series(repos.map(function (repo) {
            return function (callback) {
                if (!repo.gist) {
                    // Repos with Null CLA will NOT have webhook
                    return callback(null, null);
                }
                delegateFun(repo.owner, repo.repo, token, callback);
            };
        }), function (err) {
            done(err);
        });
    });
}

module.exports = {

    get: function (req, done) {
        return req.args && req.args.org ? getOrgHook(req.args.org, req.args.noCache, req.user.token, done) : getRepoHook(req.args.owner, req.args.repo, req.args.noCache, req.user.token, done);

        // now we will have to check two things:
        // 1) webhook user still has push access to this repo
        // 2) token is still valid
        // -> if one of these conditions is not met we will
        //    delete the webhook

        // if(hook) {
        // }
    },

    create: function (req, done) {
        return req.args && req.args.orgId ? createOrgHook(req.args.org, req.user.token, done) : createRepoHook(req.args.owner, req.args.repo, req.user.token, done);
    },

    remove: function (req, done) {
        return req.args && req.args.org ? removeOrgHook(req.args.org, req.user.token, done) : removeRepoHook(req.args.owner, req.args.repo, req.user.token, done);
    }
};
