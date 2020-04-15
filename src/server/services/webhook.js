// module
const github = require('./github')
const repoService = require('./repo')
const url = require('./url')
const logger = require('./logger')

class WebhookService {
    async _getHook(owner, repo, token) {
        if (!owner || !token) {
            throw 'Owner/org and token is required.'
        }
        let args = {
            fun: 'listHooks',
            arg: {},
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

    async getRepoHook(owner, repo, token) {
        let hook = await this._getHook(owner, repo, token)
        if (!hook) {
            try {
                hook = await this._getHook(owner, undefined, token)
            } catch (error) {
                if (error && error.status !== 404) {
                    // When the owner is not an org, github returns 404.
                    throw new Error(error)
                }
            }
        }
        return hook
    }

    getOrgHook(org, token) {
        return this._getHook(org, undefined, token)
    }

    async _createHook(owner, repo, token) {
        if (!owner || !token) {
            throw 'Owner/org and token are required.'
        }
        let args = {
            fun: 'createHook',
            arg: {
                config: {
                    content_type: 'json'
                },
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
        try {
            const res = await github.call(args)
            return res.data
        } catch (error) {
            logger.info(new Error(error).stack)
        }

    }

    async createRepoHook(owner, repo, token) {
        const hook = await this.getRepoHook(owner, repo, token)
        if (hook) {
            return hook
        }
        return this._createHook(owner, repo, token)
    }

    async createOrgHook(org, token) {
        let hook = await this.getOrgHook(org, token)
        if (hook) {
            throw new Error('Webhook already exist with base url ' + url.baseWebhook)
        }
        hook = await this._createHook(org, undefined, token)
        return this._handleHookForLinkedRepoInOrg(org, token, this.removeRepoHook.bind(this))
    }

    async _removeHook(owner, repo, hookId, token) {
        if (!owner || !token) {
            throw 'Owner/org and token is required.'
        }
        let args = {
            fun: 'deleteHook',
            arg: {
                hook_id: hookId
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
        try {
            return github.call(args)
        } catch (error) {
            logger.info(new Error(error).stack)
        }

    }

    async removeRepoHook(owner, repo, token) {
        const hook = await this.getRepoHook(owner, repo, token)
        if (!hook) {
            throw 'No webhook found with base url ' + url.baseWebhook
        }
        if (hook.type === 'Organization') {
            return null
        }
        return this._removeHook(owner, repo, hook.id, token)
    }

    async removeOrgHook(org, token) {
        const hook = await this.getOrgHook(org, token)
        if (!hook) {
            throw 'No webhook found with base url ' + url.baseWebhook
        }
        await this._removeHook(org, undefined, hook.id, token)
        await this._handleHookForLinkedRepoInOrg(org, token, this.createRepoHook.bind(this))
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
}

module.exports = new WebhookService()