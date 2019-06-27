require('../documents/repo')
const mongoose = require('mongoose')
const Repo = mongoose.model('Repo')
const _ = require('lodash')

//services
const github = require('../services/github')
const logger = require('../services/logger')
const orgService = require('../services/org')

//queries
const queries = require('../graphQueries/github')

//services
const url = require('../services/url')

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
            token: args.token,
            sharedGist: !!args.sharedGist,
            minFileChanges: args.minFileChanges,
            minCodeChanges: args.minCodeChanges,
            whiteListPattern: args.whiteListPattern,
            privacyPolicy: args.privacyPolicy,
            updatedAt: new Date()
        })
    }

    async get(args) {
        return Repo.findOne(selection(args))
        // const repo = await Repo.findOne(selection(args))
        // if (repo) {
        //     return repo
        // }
        // throw new Error('Repository not found in Database')
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
                allRepos = allRepos.concat(set)
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

    async update(args) {
        const repoArgs = {
            repo: args.repo,
            owner: args.owner
        }
        const repo = await Repo.findOne(repoArgs)

        repo.repoId = repo.repoId ? repo.repoId : args.repoId
        repo.gist = args.gist
        repo.token = args.token ? args.token : repo.token
        repo.sharedGist = !!args.sharedGist
        repo.minFileChanges = args.minFileChanges
        repo.minCodeChanges = args.minCodeChanges
        repo.whiteListPattern = args.whiteListPattern
        repo.privacyPolicy = args.privacyPolicy
        repo.updatedAt = new Date()

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

                let body = await github.callGraphql(query, arg.token)

                body = JSON.parse(body)
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
            fun: 'list',
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
        let res = await github.call({
            obj: 'repos',
            fun: 'get',
            arg: {
                owner: args.owner,
                repo: args.repo
            },
            token: args.token
        })
        return res.data
    }
}

module.exports = new RepoService()