// module
const github = require('../services/github')
const repoService = require('../services/repo')
const url = require('../services/url')

class WebhookApi {
    async _getHook(owner, repo, noCache, token) {
        if (!owner || !token) {
            throw 'Owner/org and token is required.'
        }
        let args = {
            fun: 'listHooks',
            arg: {
                noCache: noCache
            },
            token: token
        }
        if (repo) {
            args.obj = 'repos'
            args.arg.owner = owner
            args.arg.repo = repo
        } else {
            args.obj = 'orgs'
            args.arg.org = owner
        }
        const hooks = await github.call(args)
        let hook = null

        if (hooks && hooks.data && hooks.data.length > 0) {
            hooks.data.forEach(function (webhook) {
                if (webhook.active && webhook.config.url && webhook.config.url.indexOf(url.baseWebhook) > -1) {
                    hook = webhook
                }
            })
        }
        return hook
    }

    async _getRepoHook(owner, repo, noCache, token) {
        let hook = await this._getHook(owner, repo, noCache, token)
        if (!hook) {
            hook = await this._getHook(owner, undefined, noCache, token)
            // if (error && error.code !== 404) {
            //     // When the owner is not an org, github returns 404.
            //     throw new Error(error).stack
            // }
        }
        return hook
    }

    _getOrgHook(org, noCache, token) {
        return this._getHook(org, undefined, noCache, token)
    }

    async _createHook(owner, repo, token) {
        if (!owner || !token) {
            throw 'Owner/org and token are required.'
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
        }
        if (repo) {
            args.obj = 'repos'
            args.arg.repo = repo
            args.arg.owner = owner
            args.arg.config.url = url.webhook(repo)
        } else {
            args.obj = 'orgs'
            args.arg.org = owner
            args.arg.config.url = url.webhook(owner)
        }
        const res = await github.call(args)
        return res.data
    }

    async _createRepoHook(owner, repo, token) {
        const hook = await this._getRepoHook(owner, repo, true, token)
        if (hook) {
            return hook
        }
        return this._createHook(owner, repo, token)
    }

    async _createOrgHook(org, token) {
        let hook = await this._getOrgHook(org, true, token)
        if (hook) {
            throw new Error('Webhook already exist with base url ' + url.baseWebhook)
        }
        hook = await this._createHook(org, undefined, token)
        return this._handleHookForLinkedRepoInOrg(org, token, this._removeRepoHook.bind(this))
    }

    async _removeHook(owner, repo, hookId, token) {
        if (!owner || !token) {
            throw 'Owner/org and token is required.'
        }
        let args = {
            fun: 'deleteHook',
            arg: {
                id: hookId,
                noCache: true
            },
            token: token
        }
        if (repo) {
            args.obj = 'repos'
            args.arg.owner = owner
            args.arg.repo = repo
        } else {
            args.obj = 'orgs'
            args.arg.org = owner
        }
        return github.call(args)
    }

    async _removeRepoHook(owner, repo, token) {
        const hook = await this._getRepoHook(owner, repo, true, token)
        if (!hook) {
            throw 'No webhook found with base url ' + url.baseWebhook
        }
        if (hook.type === 'Organization') {
            return null
        }
        return this._removeHook(owner, repo, hook.id, token)
    }

    async _removeOrgHook(org, token) {
        const hook = await this._getOrgHook(org, true, token)
        if (!hook) {
            throw 'No webhook found with base url ' + url.baseWebhook
        }
        await this._removeHook(org, undefined, hook.id, token)
        await this._handleHookForLinkedRepoInOrg(org, token, this._createRepoHook.bind(this))
        return hook
    }

    async _handleHookForLinkedRepoInOrg(org, token, delegateFun) {
        const repos = await repoService.getByOwner(org)
        if (!repos || repos.length === 0) {
            throw 'No repos found for the org'
        }
        const promises = repos.map(repo => {
            if (!repo.gist) {
                // Repos with Null CLA will NOT have webhook
                return null
            }
            return delegateFun(repo.owner, repo.repo, token)
        })
        return Promise.all(promises)
    }

    async get(req) {
        return req.args && req.args.org ? this._getOrgHook(req.args.org, req.args.noCache, req.user.token) : this._getRepoHook(req.args.owner, req.args.repo, req.args.noCache, req.user.token)

        // now we will have to check two things:
        // 1) webhook user still has push access to this repo
        // 2) token is still valid
        // -> if one of these conditions is not met we will
        //    delete the webhook

        // if(hook) {
        // }
    }

    async create(req) {
        return req.args && req.args.orgId ? this._createOrgHook(req.args.org, req.user.token) : this._createRepoHook(req.args.owner, req.args.repo, req.user.token)
    }

    async remove(req) {
        return req.args && req.args.org ? this._removeOrgHook(req.args.org, req.user.token) : this._removeRepoHook(req.args.owner, req.args.repo, req.user.token)
    }
}

module.exports = new WebhookApi()
