// models
require('../documents/cla')
require('../documents/repo')
require('../documents/org')

const mongoose = require('mongoose')
const CLA = mongoose.model('CLA')
const Repository = mongoose.model('Repo')
const Org = mongoose.model('Org')

//services
const logger = require('../services/logger')
const orgService = require('../services/org')
const repoService = require('../services/repo')
const github = require('./github')
const config = require('../config')
const _ = require('lodash')

class ClaService {

    async _getGistObject(gist_url, token, owner) {
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
                gist_id: id,
                cacheTime: 60 //seconds
            },
            token: token,
            owner: owner
        }
        try {
            // The gists.get endpoint currently doesn't support the usage of a Github App installation token
            // Therefore we try to use the stored user token
            // If that fails we fall back to the generic CLA token
            // This helps to not use the complete rate limit for the CLA bot, while still keep working in case the user token gets revoked
            return await github.call(args)
        } catch (error) {
            logger.error(new Error(error).stack)
            args.token = config.server.github.token
            return await github.call(args)
        }
    }

    async _checkAll(users, repoId, orgId, sharedGist, gist_url, gist_version, onDates, hasExternalCommiter) {
        logger.debug(`checkPullRequestSignatures--> _checkAll for the repoId ${repoId} and orgId ${orgId}`)
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
                },
                revoked_at: {
                    $gt: date
                }
            }, {
                created_at: {
                    $lte: date
                },
                end_at: undefined,
                revoked_at: undefined
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

    async _getPR(owner, repo, number, token) {
        return github.callWithGitHubApp({
            obj: 'pulls',
            fun: 'get',
            arg: {
                owner: owner,
                repo: repo,
                pull_number: number
            },
            token: token,
            owner: owner
        })
    }

    async _getGHOrgMembers(org, token) {
        try {
            const response = await github.callWithGitHubApp({
                obj: 'orgs',
                fun: 'listMembers',
                arg: {
                    org: org
                },
                token: token,
                owner: org
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

    async _getGHOrgMemberships(username, token, owner) {
        try {
            const response = await github.callWithGitHubApp({
                obj: 'orgs',
                fun: 'listForUser',
                arg: {
                    username: username
                },
                token: token,
                owner: owner,
            })
            const orgMemberships = []
            response.data.map((orgMembership) => {
                orgMemberships.push({
                    name: orgMembership.login,
                    id: orgMembership.id
                })
            })

            return orgMemberships

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

    async _getLinkedItem(repo, owner, token, repoId, orgId) {
        token = token || config.server.github.token

        if (owner && !repo) {
            return await orgService.get({
                org: owner
            })
        }

        if (!orgId && !repoId) {
            const ghRepo = await repoService.getGHRepo({
                owner: owner,
                repo: repo,
                token: token
            })
            repoId = ghRepo.id
            orgId = ghRepo.owner.id
        }
        try {
            const linkedRepo = await repoService.get({ repoId: repoId })
            if (linkedRepo) {
                return linkedRepo
            }
            throw 'There is no linked repo'
        } catch (error) {
            const linkedOrg = await orgService.get({ orgId: orgId })
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

        logger.info(`temporary debug - query: ${JSON.stringify(query)}`)

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
            const pullRequest = await this._getPR(owner, repo, number, token)
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
        const gistRes = await this._getGistObject(gist_url, args.token, args.owner)
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
    async getLastSignature(args, item) {
        if (!item) {
            item = await this._getLinkedItem(args.repo, args.owner)
        }
        args.gist = item.gist
        if (!item.gist) {
            return 'null-cla'
        }

        const gist = await this._getGistObject(args.gist, item.token, args.owner)

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
    async checkUserSignature(args, item) {
        const cla = await this.getLastSignature(args, item)
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
        // logger.debug(`checkPullRequestSignatures-->getGistObject for the repo ${args.owner}/${args.repo}`)
        const gist = await this._getGistObject(args.gist, item.token, args.owner)
        if (!gist) {
            throw new Error('No gist found for item')
        }
        args.gist_version = gist.data.history[0].version

        // logger.debug(`checkPullRequestSignatures-->getPR for the repo ${args.owner}/${args.repo}`)
        const pullRequest = (await this._getPR(args.owner, args.repo, args.number, item.token)).data
        if (!pullRequest) {
            throw new Error('No pull request found')
        }
        args.onDates.push(new Date(pullRequest.created_at))

        if (pullRequest.head && pullRequest.head.repo && pullRequest.head.repo.owner) {
            // check if the contribution comes from an Organization
            const isOrgHead = pullRequest.head.repo.owner.type === 'Organization'
            // check that this is actually a fork (and not just a branch in the same repo)
            const isForked = pullRequest.head.repo.fork
            // only if feature flag is enabled
            if (organizationOverrideEnabled && isOrgHead) {
                const {
                    owner: headOrg
                } = pullRequest.head.repo
                const {
                    owner: baseOrg
                } = pullRequest.base.repo
                if (item.isUserOnAllowlist !== undefined && item.isUserOnAllowlist(headOrg.login)) {
                    const orgMembers = await this._getGHOrgMembers(headOrg.login, item.token)
                    const committers = await repoService.getPRCommitters(args)
                    var externalCommitters = _.differenceBy(committers, orgMembers, 'id')
                    if ((!externalCommitters || externalCommitters.length === 0) || (baseOrg.login === headOrg.login && isForked === false)) {
                        return ({
                            signed: true
                        })
                    }

                    if (externalCommitters.length > 0 && isForked && baseOrg.login !== headOrg.login) {                   // filter out users explicitly mentioned on allowlist
                        externalCommitters = externalCommitters.filter(externalCommitter =>
                            externalCommitter && !(item.isUserOnAllowlist !== undefined && item.isUserOnAllowlist(externalCommitter.name))
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
            // logger.debug(`checkPullRequestSignatures-->getPRCommitters for the repo ${args.owner}/${args.repo}`)
            const committers = await repoService.getPRCommitters(args)
            signees = _.uniqWith([...signees, ...committers], (object, other) => object.id == other.id)
        }

        signees = signees.filter(signee =>
            signee && !(item.isUserOnAllowlist !== undefined && item.isUserOnAllowlist(signee.name))
        )

        // loop through the signees and check which ones belong to an excepted org
        const signeesNotExcluded = []
        for (const signee of signees) {
            // get org memberships for the signee
            const userOrgMemberships = await this._getGHOrgMemberships(signee.name, item.token, args.owner)

            // if one of the Organizations is on the allowlist we accept that as signature and don't need to look further
            const userOrgIsOnAllowlist = userOrgMemberships && userOrgMemberships.find(userOrgMembership => item.isOrgOnAllowlist && item.isOrgOnAllowlist(userOrgMembership.name))

            // if the user is not on the allowlist add them to the signeesNotExcluded array
            if (!userOrgIsOnAllowlist) {
                signeesNotExcluded.push(signee)
            }
        }

        return this._checkAll(
            signeesNotExcluded,
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
            return this.checkUserSignature(args, item)
        } else if (args.number) {
            return this.checkPullRequestSignatures(args, item)
        }
        throw new Error('A user or a pull request number is required.')
    }

    async sign(args, item) {
        if (!item) {
            item = await this._getLinkedItem(args.repo, args.owner, args.token)
        }
        if (!item.gist) {
            const nullClaErr = new Error('The repository doesn\'t need to sign a CLA because it has a null CLA.')
            nullClaErr.code = 200
            throw nullClaErr
        }

        const gist = await this._getGistObject(item.gist, item.token, args.owner)
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

    // Get list of signed CLAs for all repos/owners the user has contributed to
    async getSignedCLA(user) {
        // get all ever signed CLAs for the given user/userId
        let clas = await CLA.find({
            $or: [{
                user: user.login,
            }, {
                userId: user.id,
            }],
        }, {
            'repo': 1,
            'owner': 1,
            'created_at': 1,
            'repoId': 1,
            'gist_url': 1,
            'gist_version': 1,
            'revoked_at': 1,
            'org_cla': 1,
        }, {
            sort: {
                'created_at': -1
            }
        })

        // return only the ones which are not yet revoked
        clas = clas.filter(cla => cla.revoked_at == undefined)
        // return empty array if we don't have any repositories anymore
        if (clas.length == 0) { return [] }

        // find all repositories related to the clas and only return still existing repositories and where the signature is up-to-date
        const repofilter = clas.map(cla => ({
            owner: cla.owner,
            gist: cla.gist_url
        }))
        const repos = await Repository.find({
            $or: repofilter
        })

        // find all owners/organizations related to the clas and only return still existing owners and where the signature is up-to-date
        const ownerfilter = clas.map(cla => ({
            org: cla.owner,
            gist: cla.gist_url
        }))
        const owners = await Org.find({
            $or: ownerfilter
        })

        // filter if its an org CLA (org_cla == true) or if repo exists
        clas = clas.filter(cla => {
            // if org_cla is true it is an organization based CLA
            if (cla.org_cla) {
                // if owner and gist matches return cla
                return owners.find(owner => owner.org == cla.owner && owner.gist == cla.gist_url)
            }
            // if repo, owner and gist matches return cla
            return repos.find(repo => repo.repo == cla.repo && repo.owner == cla.owner && repo.gist == cla.gist_url)
        })
        // filter out non-unique entries based on our three "unique" properties repo, owner, gist_url
        const uniqueCLAs = []
        for (const cla of clas) {
            const isNotNew = uniqueCLAs.find(uniqueCLA =>
                cla.repo === uniqueCLA.repo &&
                cla.owner === uniqueCLA.owner &&
                cla.gist_url === uniqueCLA.gist_url
            )
            if (isNotNew === undefined) {
                uniqueCLAs.push(cla)
            }
        }
        return uniqueCLAs
    }

    // Get linked repo or org
    // Params:
    // repo (mandatory)
    // owner (mandatory)
    // token (optional)
    // repoId (optional)
    // orgId (optional)
    async getLinkedItem(args) {
        return this._getLinkedItem(args.repo, args.owner, args.token, args.repoId, args.orgId)
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
            try {
                return CLA.find(selection, {}, options)
            } catch (error) {
                logger.warn('Error occured when getting all signed CLAs for given repo without gist version' + error)
                logger.warn('Api cla.getAll failed with selection ' + selection)
                // eslint-disable-next-line no-console
                console.log('Api cla.getAll failed with selection from console log ' + selection)
            }
        }
        try {
            const clas = await CLA.find(selection, {}, options)
            if (!clas) {
                throw new Error('no clas found')
            }
            return clas
        } catch (error) {
            logger.warn('Error occured when getting all signed CLAs for given repo ' + error)
        }


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

        const gist = await this._getGistObject(item.gist, item.token, args.owner)
        const endDate = new Date(args.endDate)
        const onDates = [endDate]
        const currentVersion = gist.data.history[0].version


        logger.info(`temporary debug repoId: ${item.repoId}`)
        logger.info(`temporary debug orgId: ${item.orgId}`)
        logger.info(`temporary debug userId: ${args.userId}`)
        logger.info(`temporary debug args.user: ${args.user}`)
        logger.info(`temporary debug endDate: ${endDate}`)

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

    async revoke(args, user) {
        const cla = await CLA.findOne({ _id: args._id });

        if (user.id !== Number(cla.userId)) {
            logger.error('User: ' + cla.user + ' is unauthorized to revoke cla with id: ' + cla._id);
            throw new Error('Unauthorized to revoke CLA');
        }

        cla.revoked_at = new Date();
        await cla.save();
        logger.info('User: ' + cla.user + ' has revoked the cla for repo: ' + cla.repo);

        return cla;

    }
}


module.exports = new ClaService()
