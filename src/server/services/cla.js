// models
require('../documents/cla')
const CLA = require('mongoose').model('CLA')

//services
const logger = require('../services/logger')
const orgService = require('../services/org')
const repoService = require('../services/repo')
const github = require('./github')
const config = require('../../config')
const _ = require('lodash')

class ClaService {

    async _getGistObject(gist_url, token) {
        let id = ''
        try {
            let gistArray = gist_url.split('/') // e.g. https://gist.github.com/KharitonOff/60e9b5d7ce65ca474c29
            id = gistArray[gistArray.length - 1]
            id = id.match(/[\w\d]*/g)[0]
        } catch (ex) {
            throw 'The gist url "' + gist_url + '" seems to be invalid'
        }
        const args = {
            obj: 'gists',
            fun: 'get',
            arg: {
                gist_id: id
            },
            token: token
        }

        return github.call(args)
    }

    async _checkAll(users, repoId, orgId, sharedGist, gist_url, gist_version, onDates, hasExternalCommiter) {
        let promises = []
        const userMap = {
            signed: [],
            not_signed: [],
            unknown: [],
            hasExternalCommiter
        }
        if (!users) {
            throw new Error(`There are no users to check :( users: ${users}, repoId: ${repoId}, orgId: ${orgId}, sharedGist: ${sharedGist}, gist_url: ${gist_url}, gist_version: ${gist_version}, onDates: ${onDates}`)
        }
        promises = users.map(async (user) => {
            if (!user.id) {
                userMap.unknown.push(user.name)
            }
            try {
                const cla = await this._getLastSignatureOnMultiDates(user.name, user.id, repoId, orgId, sharedGist, gist_url, gist_version, onDates)
                if (cla) {
                    userMap.signed.push(cla.user)
                } else {
                    userMap.not_signed.push(user.name)
                }
            } catch (error) {
                userMap.not_signed.push(user.name)
                logger.info(`could not get signature of ${user.name} for repoId ${repoId}`)
            }
        })

        await Promise.all(promises)

        return {
            signed: userMap.not_signed.length === 0,
            userMap: userMap
        }
    }

    _generateSharedGistQuery(gist_url, gist_version, user, userId) {
        const sharedGistCondition = {
            owner: undefined,
            repo: undefined,
            gist_url: gist_url,
        }
        if (gist_version) {
            sharedGistCondition.gist_version = gist_version
        }
        if (userId) {
            sharedGistCondition.userId = userId
        } else if (user) {
            sharedGistCondition.user = user
        }

        return sharedGistCondition
    }

    _generateDateConditions(onDates) {
        let dateConditions = []
        if (!Array.isArray(onDates) || onDates.length === 0) {
            return dateConditions
        }
        onDates.forEach(date => {
            dateConditions = dateConditions.concat([{
                created_at: {
                    $lte: date
                },
                end_at: {
                    $gt: date
                }
            }, {
                created_at: {
                    $lte: date
                },
                end_at: undefined
            }])
        })

        return dateConditions
    }

    _updateQuery(query, sharedGist, onDates) {
        const queries = [query]
        if (query.userId) {
            const queryForOldCLAs = _.clone(query)
            queryForOldCLAs.userId = {
                $exists: false
            }
            queries.push(queryForOldCLAs)
            delete query.user
        }
        if (sharedGist) {
            const shardGistQuery = this._generateSharedGistQuery(query.gist_url, query.gist_version, query.user, query.userId)
            queries.push(shardGistQuery)
        }
        const dateConditions = this._generateDateConditions(onDates)
        const newQuery = {
            $or: []
        }
        if (dateConditions.length === 0) {
            newQuery.$or = queries
        } else {
            queries.forEach(query => {
                dateConditions.forEach((date) => newQuery.$or.push(Object.assign({}, query, date)))
            })
        }
        return newQuery
    }

    async _getPR(owner, repo, number, token, noCache) {
        return github.call({
            obj: 'pulls',
            fun: 'get',
            arg: {
                owner: owner,
                repo: repo,
                pull_number: number,
                noCache: noCache
            },
            token: token
        })
    }

    async _getGHOrgMembers(org, token) {
        try {
            const response = await github.call({
                obj: 'orgs',
                fun: 'listMembers',
                arg: {
                    org: org
                },
                token: token
            })
            const orgMembers = []
            response.data.map((orgMember) => {
                orgMembers.push({
                    name: orgMember.login,
                    id: orgMember.id
                })
            })

            return orgMembers

        } catch (error) {
            logger.error(new Error(error).stack)
        }

    }

    // let getOrg = function (args, done) {
    //     let deferred = q.defer()
    //     orgService.get(args, function (err, org) {
    //         if (!err && org) {
    //             deferred.resolve(org)
    //         } else {
    //             deferred.reject(err)
    //         }
    //         if (typeof done === 'function') {
    //             done(err, org)
    //         }
    //     })
    //     return deferred.promise
    // }

    // let getRepo = function (args, done) {
    //     let deferred = q.defer()
    //     repoService.get(args, function (err, repo) {
    //         if (!err && repo) {
    //             deferred.resolve(repo)
    //         } else {
    //             deferred.reject(err)
    //         }
    //         if (typeof done === 'function') {
    //             done(err, repo)
    //         }
    //     })
    //     return deferred.promise
    // }

    async _getLinkedItem(repo, owner, token) {
        token = token || config.server.github.token

        if (owner && !repo) {
            return await orgService.get({
                org: owner
            })
        }

        const ghRepo = await repoService.getGHRepo({
            owner: owner,
            repo: repo,
            token: token
        })
        try {
            const linkedRepo = await repoService.get({
                repoId: ghRepo.id
            })
            if (linkedRepo) {
                return linkedRepo
            }
            throw 'There is no linked repo'
        } catch (error) {
            const linkedOrg = await orgService.get({
                orgId: ghRepo.owner.id
            })
            if (linkedOrg) {
                return linkedOrg
            }
            throw new Error(`could not find linked item for owner ${owner} and repo ${repo}`)
        }
    }

    async _getLastSignatureOnMultiDates(user, userId, repoId, orgId, sharedGist = false, gist_url, gist_version, date) {
        if ((!user && !userId) || (!repoId && !orgId) || !gist_url || (date && !Array.isArray(date))) {
            const msg = `Not enough arguments provided for getLastSignatureOnMultiDates() ${user} ${userId} ${repoId} ${orgId} ${sharedGist} ${gist_url} ${gist_version} ${date}`
            logger.error(msg)
            throw new Error(msg)
        }
        let query = {
            gist_url: gist_url,
            org_cla: !!orgId
        }
        if (repoId) {
            query.repoId = repoId
        }
        if (orgId) {
            query.ownerId = orgId
        }
        if (gist_version) {
            query.gist_version = gist_version
        }
        query.userId = userId
        query.user = user

        query = this._updateQuery(query, sharedGist, date)
        let cla = await CLA.findOne(query, {}, {
            sort: {
                'created_at': -1
            }
        })

        if (cla && cla.user !== user) {
            cla.user = user
            await cla.save()
        }
        return cla
    }

    async _isSignificantPullRequest(repo, owner, number, token, item) {
        if (!repo || !owner || !number) {
            throw new Error('There are NOT enough arguments for isSignificantPullRequest. Repo: ' + repo + ' Owner: ' + owner + ' Number: ' + number)
        }
        try {
            if (!item) {
                item = await this._getLinkedItem(repo, owner, token)
            }
            if (typeof item.minFileChanges !== 'number' && typeof item.minCodeChanges !== 'number') {
                return true
            }
            token = token || item.token // in case this method is called via controller/default.js check -> api/cla.js validatePullRequest -> services/cla.js isCLARequired there is no user token
            const pullRequest = await this._getPR(owner, repo, number, token, true)
            if (typeof item.minFileChanges === 'number' && pullRequest.data.changed_files >= item.minFileChanges) {
                return true
            }
            if (typeof item.minCodeChanges === 'number' && pullRequest.data.additions + pullRequest.data.deletions >= item.minCodeChanges) {
                return true
            }

            return false
        } catch (e) {
            logger.error(new Error(e).stack)

            return true
        }
    }

    async getGist(args) {
        let gist_url = args.gist ? args.gist.gist_url || args.gist.url || args.gist : undefined
        // let gist_version = args.gist ? args.gist.gist_version : undefined
        const gistRes = await this._getGistObject(gist_url, args.token)
        return gistRes.data
    }

    /**
     * Get the last signature of the current version cla at current moment or at a pull request moment
     * Params:
     *   user (mandatory)
     *   owner (mandatory)
     *   repo (optional)
     *   number (optional)
     */
    async getLastSignature(args) {
        const item = await this._getLinkedItem(args.repo, args.owner)
        args.gist = item.gist
        if (!item.gist) {
            return 'null-cla'
        }

        const gist = await this._getGistObject(args.gist, item.token)

        args.gist_version = gist.data.history[0].version
        args.onDates = [new Date()]
        if (args.number) {
            const pullRequest = (await this._getPR(args.owner, args.repo, args.number, item.token)).data
            args.onDates.push(new Date(pullRequest.created_at))
        }

        return this._getLastSignatureOnMultiDates(
            args.user,
            args.userId,
            item.repoId,
            item.orgId,
            item.sharedGist,
            item.gist,
            args.gist_version,
            args.onDates
        )
    }

    /**
     * Check whether a user signed the current cla at current moment or at the pull request moment.
     * Params:
     *   user (mandatory)
     *   owner (mandatory)
     *   repo (optional)
     *   number (optional)
     */
    async checkUserSignature(args) {
        const cla = await this.getLastSignature(args)
        return {
            signed: !!cla
        }
    }

    /**
     * Check whether all committers signed the current cla at current moment or at the pull request moment.
     * Params:
     *   user (mandatory)
     *   number (mandatory)
     *   owner (mandatory)
     *   repo (optional)
     */
    async checkPullRequestSignatures(args, item) {
        const submitterSignatureRequired = config.server.feature_flag.required_signees.indexOf('submitter') > -1
        const committerSignatureRequired = !config.server.feature_flag.required_signees || config.server.feature_flag.required_signees.indexOf('committer') > -1
        const organizationOverrideEnabled = config.server.feature_flag.organization_override_enabled
        if (!item) {
            item = await this._getLinkedItem(args.repo, args.owner, args.token)
        }

        let signees = []
        var hasExternalCommiter = {
            check: false
        }

        if (!item) {
            throw new Error('No linked item found')
        }

        args.gist = item.gist
        args.repoId = item.repoId
        args.orgId = item.orgId
        args.onDates = [new Date()]

        if (!args.gist) {
            return ({
                signed: true
            })
        }

        const gist = await this._getGistObject(args.gist, item.token)
        if (!gist) {
            throw new Error('No gist found for item')
        }
        args.gist_version = gist.data.history[0].version

        const pullRequest = (await this._getPR(args.owner, args.repo, args.number, item.token)).data
        //console.log(pullRequest)
        if (!pullRequest) {
            throw new Error('No pull request found')
        }
        args.onDates.push(new Date(pullRequest.created_at))

        if (pullRequest.head && pullRequest.head.repo && pullRequest.head.repo.owner) {
            const isOrgHead = pullRequest.head.repo.owner.type === 'Organization'
            const isForked = pullRequest.head.repo.fork
            if (organizationOverrideEnabled && isOrgHead) {
                const {
                    owner: headOrg
                } = pullRequest.head.repo
                const {
                    owner: baseOrg
                } = pullRequest.base.repo
                if (item.isUserWhitelisted !== undefined && item.isUserWhitelisted(headOrg.login)) {
                    const orgMembers = await this._getGHOrgMembers(headOrg.login, item.token)
                    const committers = await repoService.getPRCommitters(args)
                    var externalCommitters = _.differenceBy(committers, orgMembers, 'id')
                    if ((!externalCommitters || externalCommitters.length === 0) || (baseOrg.login === headOrg.login && isForked === false)) {
                        return ({
                            signed: true
                        })

                    } else if (externalCommitters.length > 0 && isForked && baseOrg.login !== headOrg.login) {
                        externalCommitters = externalCommitters.filter(externalCommitter =>
                            externalCommitter && !(item.isUserWhitelisted !== undefined && item.isUserWhitelisted(externalCommitter.name))
                        )
                        hasExternalCommiter.check = true
                        hasExternalCommiter.orgName = headOrg.login
                        return this._checkAll(
                            externalCommitters,
                            item.repoId,
                            item.orgId,
                            item.sharedGist,
                            item.gist,
                            args.gist_version,
                            args.onDates,
                            hasExternalCommiter
                        )
                    }

                }
                const {
                    signed,
                    userMap
                } = await this._checkAll(
                    [{
                        name: headOrg.login,
                        id: headOrg.id
                    }],
                    item.repoId,
                    item.orgId,
                    item.sharedGist,
                    item.gist,
                    args.gist_version,
                    args.onDates,
                    hasExternalCommiter
                )
                if (signed && userMap.signed.includes(headOrg.login)) {
                    return ({
                        signed,
                        userMap
                    })
                }
            }
        }

        if (submitterSignatureRequired) { //TODO: test it
            signees.push({
                name: pullRequest.user.login,
                id: pullRequest.user.id
            })
        }

        if (committerSignatureRequired) {
            const committers = await repoService.getPRCommitters(args)
            signees = _.uniqWith([...signees, ...committers], (object, other) => object.id == other.id)
        }

        signees = signees.filter(signee =>
            signee && !(item.isUserWhitelisted !== undefined && item.isUserWhitelisted(signee.name))
        )

        return this._checkAll(
            signees,
            item.repoId,
            item.orgId,
            item.sharedGist,
            item.gist,
            args.gist_version,
            args.onDates,
            hasExternalCommiter.check
        )
    }

    async check(args, item) {
        if (args.user) {
            return this.checkUserSignature(args)
        } else if (args.number) {
            return this.checkPullRequestSignatures(args, item)
        }
        throw new Error('A user or a pull request number is required.')
    }

    async sign(args) {
        const item = await this._getLinkedItem(args.repo, args.owner, args.token)
        if (!item.gist) {
            const nullClaErr = new Error('The repository doesn\'t need to sign a CLA because it has a null CLA.')
            nullClaErr.code = 200
            throw nullClaErr
        }

        const gist = await this._getGistObject(item.gist, item.token)
        let onDates = [new Date()]
        let currentVersion = gist.data.history[0].version

        const cla = await this._getLastSignatureOnMultiDates(args.user, args.userId, item.repoId, item.orgId, item.sharedGist, item.gist, currentVersion, onDates)
        if (cla) {
            let signedErr = new Error('You\'ve already signed the cla')
            signedErr.code = 200
            throw signedErr
        }
        let argsToCreate = {
            user: args.user,
            userId: args.userId,
            gist: item.gist,
            gist_version: currentVersion,
            custom_fields: args.custom_fields,
            origin: args.origin,
            created_at: args.created_at,
        }
        if (!item.sharedGist) {
            argsToCreate.ownerId = item.orgId
            argsToCreate.repoId = item.repoId
            argsToCreate.org_cla = !!item.orgId
            argsToCreate.owner = item.owner || item.org
            argsToCreate.repo = item.repo
        }
        if (!argsToCreate.origin) {
            logger.error(new Error('unknown origin of the signature'))
            argsToCreate.origin = `unknown|${args.user}`
        }

        const signature = await this.create(argsToCreate)

        return signature
    }

    //Get list of signed CLAs for all repos the user has contributed to
    async getSignedCLA(args) {
        const selector = []
        const findCla = async function (query, repoList, claList) {
            const clas = await CLA.find(query, {
                'repo': '*',
                'owner': '*',
                'created_at': '*',
                'gist_url': '*',
                'gist_version': '*'
            }, {
                sort: {
                    'created_at': -1
                }
            })

            clas.forEach((cla) => {
                if (repoList.indexOf(cla.repo) < 0) {
                    repoList.push(cla.repo)
                    claList.push(cla)
                }
            })
        }
        try {
            const repos = await repoService.all()
            repos.forEach((repo) => {
                selector.push({
                    user: args.user,
                    repo: repo.repo,
                    gist_url: repo.gist
                })
            })
        } catch (error) {
            logger.warn(new Error(error).stack)
        }

        const repoList = []
        const uniqueClaList = []
        try {
            await findCla({
                $or: selector
            }, repoList, uniqueClaList)
        } catch (error) {
            logger.warn(new Error(error).stack)
        }
        try {
            await findCla({
                user: args.user
            }, repoList, uniqueClaList)
        } catch (error) {
            logger.warn(new Error(error).stack)
        }
        return uniqueClaList
    }

    // Get linked repo or org
    // Params:
    // repo (mandatory)
    // owner (mandatory)
    // token (optional)
    async getLinkedItem(args) {
        return this._getLinkedItem(args.repo, args.owner, args.token)
    }

    //Get all signed CLAs for given repo and gist url and/or a given gist version
    //Params:
    //	repoId (mandatory) or
    //	orgId (mandatory) and
    //	gist.gist_url (mandatory)
    //	gist.gist_version (optional)
    async getAll(args) {
        if (!args.gist || !args.gist.gist_url || (!args.repoId && !args.orgId)) {
            throw new Error('Wrong arguments, gist url or repo id are missing')
        }
        let selection = {
            gist_url: args.gist.gist_url
        }
        const options = {
            sort: {
                user: 1,
                userId: 1
            }
        }
        if (args.gist.gist_version) {
            selection.gist_version = args.gist.gist_version
            options.sort = {
                'created_at': -1
            }
        }
        if (args.repoId) {
            selection.repoId = args.repoId
        }
        if (args.orgId) {
            selection.ownerId = args.orgId
        }
        selection = this._updateQuery(selection, args.sharedGist)

        if (!args.gist.gist_version) {
            return CLA.find(selection, {}, options)
        }

        const clas = await CLA.find(selection, {}, options)
        if (!clas) {
            throw new Error('no clas found')
        }
        const foundSigners = []
        const distinctClas = clas.filter((cla) => {
            if (foundSigners.indexOf(cla.userId) < 0) {
                foundSigners.push(cla.userId)
                return true
            }
            return false
        })
        return distinctClas
    }

    async create(args) {
        const now = new Date()

        return CLA.create({
            repo: args.repo,
            repoId: args.repoId,
            owner: args.owner,
            ownerId: args.ownerId,
            user: args.user,
            userId: args.userId,
            gist_url: args.gist,
            gist_version: args.gist_version,
            created_at: args.created_at || now,
            end_at: undefined,
            org_cla: args.org_cla,
            custom_fields: args.custom_fields,
            updated_at: now,
            origin: args.origin
        })
    }

    async terminate(args) {
        const item = await this._getLinkedItem(args.repo, args.owner, args.token)
        if (!item.gist) {
            let nullClaErr = new Error('The repository don\'t need to sign a CLA because it has a null CLA.')
            nullClaErr.code = 200
            throw nullClaErr
        }

        const gist = await this._getGistObject(item.gist, item.token)
        const endDate = new Date(args.endDate)
        const onDates = [endDate]
        const currentVersion = gist.data.history[0].version

        const cla = await this._getLastSignatureOnMultiDates(args.user, args.userId, item.repoId, item.orgId, item.sharedGist, item.gist, currentVersion, onDates)

        if (!cla) {
            let noRecordErr = new Error('No valid cla record')
            noRecordErr.code = 200
            throw noRecordErr
        }
        cla.end_at = endDate

        await cla.save()
        return cla
    }

    async isClaRequired(args, item) {
        return this._isSignificantPullRequest(args.repo, args.owner, args.number, args.token, item)
    }
}


module.exports = new ClaService()