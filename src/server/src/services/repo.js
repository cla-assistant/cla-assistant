// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

require('../documents/repo')
const mongoose = require('mongoose')
const Repo = mongoose.model('Repo')
const Org = mongoose.model('Org');

const github = require('../services/github')
const logger = require('../services/logger')
const queries = require('../graphQueries/github')
const url = require('../services/url')

const _ = require('lodash')

//services

const org_selection = function (args) {
    const selectArguments = args.orgId ? { orgId: args.orgId } : { org: args.org };

    return selectArguments;
};

const _resp = (message, success = false) => {
    return {'success': success, 'message': message}
}

class OrgService {
    async create(args) {
        return Org.create({
            orgId: args.orgId,
            org: args.org,
            gist: args.gist,
            excludePattern: args.excludePattern,
            sharedGist: !!args.sharedGist,
            minFileChanges: args.minFileChanges,
            minCodeChanges: args.minCodeChanges,
            allowListPattern: args.allowListPattern,
            allowListPatternOrgs: args.allowListPatternOrgs,
            privacyPolicy: args.privacyPolicy,
            updatedAt: new Date()
        })
    }

    async get(args) {
        return Org.findOne(org_selection(args))
    }

    async update(args) {
        const org = await this.get(args)
        org.gist = args.gist
        org.token = args.token ? args.token : org.token
        org.sharedGist = !!args.sharedGist
        org.excludePattern = args.excludePattern
        org.minFileChanges = args.minFileChanges
        org.minCodeChanges = args.minCodeChanges
        org.allowListPattern = args.allowListPattern
        org.allowListPatternOrgs = args.allowListPatternOrgs
        org.privacyPolicy = args.privacyPolicy
        org.updatedAt = new Date()

        return org.save()
    }

    async migrate(args) {
        const { org: orgArg, orgId: orgIdArg } = args

        // find organization in database
        const org = await Org.findOne({
            org: orgArg,
            orgId: orgIdArg
        })
        if (!org) {
            return _resp('Organization not found')
        }
        if (!org.token) {
            // return a message that the organization is already migrated
            // return success = true because technically, the migration was successful
            return _resp('Organization already migrated', true)
        }
        // try to get GitHub Apps token
        let appToken
        try {
            appToken = await github.getInstallationAccessTokenForOrg(orgArg)
        } catch(error) {
            return _resp('GitHub App not installed')
        }
        logger.debug('generated app token:', appToken)

        // remove token from database
        logger.info('Removing token from organization object')
        org.token = undefined
        try {
            await org.save()
        } catch(error) {
            return _resp('Cannot save organization')
        }
        logger.info('done!')

        // remove webhook from organization
        try {
            await webhookService.removeOrgHook(org.org, appToken)
        } catch(error) {
            logger.warn('cannot remove webhook/s from repository:', error.toString())
        }

        return _resp('Migration successful', true)
    }

    async getMultiple(args) {
        return Org.find({ orgId: { $in: args.orgId } })
    }

    async getOrgWithSharedGist(gist) {
        return Org.find({ gist: gist, sharedGist: true })
    }

    remove(args) {
        return Org.findOneAndRemove(org_selection(args))
    }
}

const orgService = new OrgService()

class WebhookService {
    async _getHook(owner, repo, token) {
        if (!owner || !token) {
            throw 'Owner/org and token is required.'
        }
        let args = {
            fun: 'listWebhooks',
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
            fun: 'createWebhook',
            arg: {
                config: {
                    content_type: 'json'
                },
                name: 'web',
                events: ['pull_request', 'merge_group'],
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
		logger.error("dfdfsfdsdfsdsfdsfdsf");
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
            fun: 'deleteWebhook',
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

const webhookService = new WebhookService()

const isTransferredRenamed = (dbRepo, ghRepo) => ghRepo.repoId == dbRepo.repoId && (ghRepo.repo !== dbRepo.repo || ghRepo.owner !== dbRepo.owner)

const compareRepoNameAndUpdate = (dbRepo, ghRepo) => {
    if (isTransferredRenamed(dbRepo, ghRepo)) {
        dbRepo.owner = ghRepo.owner
        dbRepo.repo = ghRepo.repo
        dbRepo.save()
        return true
    }
    return false
}

const compareAllRepos = (ghRepos, dbRepos) => {
    dbRepos.forEach((dbRepo) => ghRepos.some((ghRepo) => compareRepoNameAndUpdate(dbRepo, ghRepo)))
}

const extractUserFromCommit = (commit) => commit.author.user || commit.committer.user || commit.author || commit.committer

const selection = args => {
    return args.repoId ? {
        repoId: args.repoId
    } : {
        repo: args.repo,
        owner: args.owner
    }
}

class RepoService {

    constructor() {
        this.timesToRetryGitHubCall = 3
    }

    async all() {
        return Repo.find({})
    }

    async check(args) {
        const repo = await Repo.findOne(selection(args))
        return !!repo
    }

    async create(args) {
        return Repo.create({
            repo: args.repo,
            owner: args.owner,
            repoId: args.repoId,
            gist: args.gist,
            sharedGist: !!args.sharedGist,
            minFileChanges: args.minFileChanges,
            minCodeChanges: args.minCodeChanges,
            allowListPattern: args.allowListPattern,
            allowListPatternOrgs: args.allowListPatternOrgs,
            privacyPolicy: args.privacyPolicy,
            updatedAt: new Date()
        })
    }

    /**
     * @returns {Promise<Repo>}
     */
    async get(args) {
        return Repo.findOne(selection(args))
        // const repo = await Repo.findOne(selection(args))
        // if (repo) {
        //     return repo
        // }
        // throw new Error('Repository not found in Database')
    }

    async getMigrationPending(owner) {
        return Repo.find({
            owner,
            token: { $exists: true },
        })
    }

    async getAllAccessibleByApp(userToken) {
        // list all installations accessible to the authenticated user
        const installations = await github.call({
            obj: 'apps',
            fun: 'listInstallationsForAuthenticatedUser',
            args: {
                per_page: 100,
            },
            token: userToken
        })
        const result = {data: []}
        for (const installation of installations.data) {
            const repos = await github.call({
                obj: 'apps',
                fun: 'listInstallationReposForAuthenticatedUser',
                arg: {
                    installation_id: installation.id,
                    per_page: 100
                },
                token: userToken
            })
            result.data.push(...repos.data)
        }
        return result
    }

    async getAll(args) {
        const repoIds = []
        args.set.forEach((repo) => repoIds.push({
            repoId: repo.repoId
        }))
        // https://github.com/cla-assistant/cla-assistant/commit/1ed8b9d3a5af61c076aa0fa241fe67c3ed78441c
        // When query is too big, docuemntDB will send error 'The SQL query text exceeded the maximum limit of 30720 characters'. Chunk big query to small queries.
        const idChunk = _.chunk(repoIds, 100)
        let startIndex = 0
        const parallelLimit = (limit) => {
            const promises = []
            for (let i = 0; i < limit; i++) {
                promises.push(Repo.find({
                    $or: idChunk[startIndex]
                }))
                ++startIndex
            }
            return promises
        }

        let allRepos = []
        while (startIndex < idChunk.length) {
            const repos = await Promise.all(parallelLimit(Math.min(idChunk.length - startIndex, 3)))
            for (const set of repos) {
                allRepos = allRepos.concat(set.map(r => {
                    const temp = JSON.parse(JSON.stringify(r))
                    temp.migrate = !!temp.token
                    return temp
                }))
            }
        }
        return allRepos
    }

    async getByOwner(owner) {
        return Repo.find({
            owner
        })
    }

    async getRepoWithSharedGist(gist) {
        return Repo.find({
            gist,
            sharedGist: true
        })
    }

    async migrate(args) {
        // find repository in database
        const repo = await Repo.findOne({
            repo: args.repo,
            owner: args.owner,
        })
        if (!repo) {
            return _resp('Repository not found')
        }
        if (!repo.token) {
            // return a message that the repository is already migrated
            // return success = true because technically, the migration was successful
            return _resp('Repository already migrated', true)
        }

        // try to get GitHub Apps token
        let appToken
        try {
            appToken = await github.getInstallationAccessTokenForRepo(args.owner, args.repo)
        } catch(error) {
            return _resp('GitHub App not installed')
        }
        logger.debug('generated app token:', appToken)

        // check if the app has permission to list pull requests
        try {
            await github.call({
                token: appToken,
                obj: 'pulls',
                fun: 'list',
                arg: {
                    owner: args.owner,
                    repo: args.repo,
                    state: 'open',
                    per_page: 1
                },
            }, true)
        } catch (error) {
            logger.error(error)
            return _resp('GitHub App has insufficient permissions')
        }

        // remove token from database
        logger.info('Removing token from repository object')
        repo.token = undefined
        try {
            await repo.save()
        } catch(error) {
            return _resp('Cannot save repository')
        }
        logger.info('done!')

        // remove webhook
        try {
            await webhookService.removeRepoHook(args.owner, args.repo, appToken)
        } catch(error) {
            logger.warn('cannot remove webhook/s from repository:', error.toString())
        }

        return _resp('Migration successful', true)
    }

    async update(args) {
        const repoArgs = {
            repo: args.repo,
            owner: args.owner
        }
        const repo = await Repo.findOne(repoArgs)

        repo.repoId = repo.repoId ? repo.repoId : args.repoId
        repo.gist = args.gist
        repo.sharedGist = !!args.sharedGist
        repo.minFileChanges = args.minFileChanges
        repo.minCodeChanges = args.minCodeChanges
        repo.allowListPattern = args.allowListPattern
        repo.allowListPatternOrgs = args.allowListPatternOrgs
        repo.privacyPolicy = args.privacyPolicy
        repo.updatedAt = new Date()

        // only update repository token if the repository has a token
        if (repo.token) {
            repo.token = args.token || repo.token
        }

        return repo.save()
    }

    async remove(args) {
        return Repo.findOneAndRemove(selection(args))
    }

    async getPRCommitters(args) {
        let self = this

        let handleError = (err, message, a) => {
            logger.warn(err)
            if (!a.count) {
                logger.info('getPRCommitters with arg: ', a)
            }
            throw new Error(message)
        }

        let callGithub = async (arg, linkedItem) => {
            try {
                let committers = []
                let query = arg.query ? arg.query : queries.getPRCommitters(arg.arg.owner, arg.arg.repo, arg.arg.number, '')
                query.owner = arg.arg.owner

                const body = await github.callGraphqlWithGitHubApp(query, arg.token)

                if (body.errors) {
                    logger.info(new Error(body.errors[0].message).stack)
                }

                const data = body.data
                if (!data || !data.repository || !data.repository.pullRequest || !data.repository.pullRequest.commits || !data.repository.pullRequest.commits.edges) {
                    throw new Error('No committers found')
                }

                data.repository.pullRequest.commits.edges.forEach((edge) => {
                    try {
                        let committer = extractUserFromCommit(edge.node.commit)
                        let user = {
                            name: committer.login || committer.name,
                            id: committer.databaseId || ''
                        }
                        if (committers.length === 0 || committers.map((c) => {
                                return c.name
                            }).indexOf(user.name) < 0) {
                            committers.push(user)
                        }
                    } catch (error) {
                        throw new Error('Problem on PR ' + url.githubPullRequest(arg.owner, arg.repo, arg.number) + 'commit info seems to be wrong ' + error)
                    }
                })

                if (data.repository.pullRequest.commits.pageInfo.hasNextPage) {
                    arg.query = queries.getPRCommitters(arg.arg.owner, arg.arg.repo, arg.arg.number, data.repository.pullRequest.commits.pageInfo.endCursor)
                    return callGithub(arg, linkedItem)
                }
                return committers

            } catch (error) {
                let msg = 'No result on GH call, getting PR committers! ' + error

                const linkedRepo = linkedItem && linkedItem.repoId ? linkedItem : undefined
                if (error.message === 'Moved Permanently' && linkedRepo) {
                    let res
                    try {
                        res = await self.getGHRepo(args)
                        if (res && res.id && compareRepoNameAndUpdate(linkedRepo, {
                                repo: res.name,
                                owner: res.owner.login,
                                repoId: res.id
                            })) {
                            arg.arg.repo = res.name
                            arg.arg.owner = res.owner.login
                            return callGithub(arg)
                        }
                    } catch (err) {
                        msg = msg + err
                    }
                } else if (!!this.timesToRetryGitHubCall && (!arg.count || this.timesToRetryGitHubCall > arg.count)) {
                    arg.count = arg.count ? ++arg.count : 1
                    await new Promise((resolve) => setTimeout(resolve, 1000))
                    return callGithub(arg, linkedItem)
                }
                handleError(new Error(msg).stack, msg, arg)
            }
        }

        let collectTokenAndCallGithub = (args, item) => {
            args.token = item.token
            let params = {
                arg: {
                    owner: args.owner,
                    repo: args.repo,
                    number: args.number,
                    per_page: 100
                },
                token: args.token
            }
            return callGithub(params, item)
        }

        let linkedItem
        try {
            linkedItem = await this.get(args)
            if (!linkedItem) {
                linkedItem = await orgService.get({
                    orgId: args.orgId
                })
            }
            if (!linkedItem) {
                throw 'no linked item found'
            }
        } catch (error) {
            handleError(new Error(error).stack, error, args)
        }
        return collectTokenAndCallGithub(args, linkedItem)
    }

    async getUserRepos(args) {
        const affiliation = args.affiliation ? args.affiliation : 'owner,organization_member'
        const ghRepos = await github.call({
            obj: 'repos',
            fun: 'listForAuthenticatedUser',
            arg: {
                affiliation: affiliation,
                per_page: 100
            },
            token: args.token
        })

        let repoSet = []
        ghRepos.data.forEach((githubRepo) => {
            if (githubRepo.permissions.push) {
                repoSet.push({
                    owner: githubRepo.owner.login,
                    repo: githubRepo.name,
                    repoId: githubRepo.id
                })
            }
        })
        const dbRepos = await this.getAll({
            set: repoSet
        })
        compareAllRepos(repoSet, dbRepos)
        return dbRepos
    }

    // updateDBData: function(req, done) {
    //     let self = this
    //     Repo.find({} function(error, dbRepos){
    //         dbRepos.forEach(function(dbRepo){
    //             let params = {
    //                 url: url.githubRepository(dbRepo.owner, dbRepo.repo),
    //                 token: req.user.token
    //             }
    //             github.direct_call(params, function(err, ghRepo){
    //                 if (ghRepo && ghRepo && ghRepo.id) {
    //                     dbRepo.repoId = ghRepo.id
    //                     dbRepo.save()
    //                 } else if (ghRepo && ghRepo && ghRepo.message) {
    //                     logger.info(ghRepo.message, 'with params ', params)
    //                 }
    //             })
    //         })
    //         done()
    //     })
    // }

    async getGHRepo(args) {
        let res = await github.callWithGitHubApp({
            obj: 'repos',
            fun: 'get',
            arg: {
                owner: args.owner,
                repo: args.repo
            },
            owner: args.owner,
            token: args.token
        })
        return res.data
    }
}

const repoService = new RepoService();

module.exports = {
	orgService,
	webhookService,
	repoService
}


