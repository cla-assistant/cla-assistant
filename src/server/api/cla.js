// modules
const Joi = require('joi')

// services
const github = require('../services/github')
const cla = require('../services/cla')
const status = require('../services/status')
const repoService = require('../services/repo')
const orgService = require('../services/org')
const prService = require('../services/pullRequest')
const logger = require('../services/logger')

const User = require('mongoose').model('User')

let token

const SIGNATURESCHEMA = Joi.object().keys({
    user: Joi.string().required(),
    userId: Joi.number().required(),
    org: Joi.string(),
    owner: Joi.string(),
    repo: Joi.string(),
    custom_fields: Joi.string(),
    number: Joi.number(),
    origin: Joi.string(),
}).and('repo', 'owner').xor('repo', 'org')

const GISTREQUESTSCHEMA = Joi.object().keys({
    gist: Joi.alternatives([Joi.string().uri(), Joi.object().keys({ gist_url: Joi.string().uri(), gist_version: Joi.strict() })]),
    repoId: Joi.number(),
    orgId: Joi.number(),
    repo: Joi.string(),
    owner: Joi.string()
})

class ClaApi {
    async getGist(req) {
        validateArgs(req.args, GISTREQUESTSCHEMA)
        if (req.user && req.user.token && req.args.gist) {
            return cla.getGist({
                token: req.user.token,
                gist: req.args.gist
            })
        }

        const service = req.args.orgId ? orgService : repoService
        const item = await service.get(req.args)
        if (!item) {
            const err = 'could not get linked item with args: ' + req.args
            logger.warn(err)
            throw err
        }
        let gistArgs = {
            gist_url: item.gist
        }
        gistArgs = req.args.gist ? req.args.gist : gistArgs
        token = item.token
        return cla.getGist({
            token,
            gist: gistArgs
        })
    }

    async get(req) {
        if (!req.args || (!req.args.repo && !req.args.repoId && !req.args.orgId)) {
            logger.info('args: ', removeToken(req.args))
            logger.info('request headers: ', req.headers)
            throw 'Please, provide owner and repo name or orgId'
        }
        const gist = await this.getGist(req)

        try {
            let renderToken = token ? token : req.user && req.user.token ? req.user.token : token
            return renderFiles(gist.files, renderToken)
        } catch (error) {
            logger.error(new Error(error).stack, 'with args: ', removeToken(req.args))
            throw error
        }
    }


    //Get list of signed CLAs for all repos the authenticated user has contributed to
    //Parameters: none (user should be taken)
    getSignedCLA(req) {
        return cla.getSignedCLA(req.args)
    }

    //Get users last signature for given repository (if repo is currently linked)
    //Parameters: repo, owner (mandatory)
    getLastSignature(req) {
        let args = req.args
        args.user = req.user.login
        args.userId = req.user.id
        return cla.getLastSignature(args)
    }

    //Find linked item using reponame and owner as parameters
    // Params:
    // repo (mandatory)
    // owner (mandatory)
    getLinkedItem(req) {
        return cla.getLinkedItem(req.args)
    }

    //Get all signed CLAs for given repo and gist url and/or a given gist version
    //Params:
    //	repo (mandatory)
    //	owner (mandatory)
    //	gist.gist_url (mandatory)
    //	gist.gist_version (optional)
    getAll(req) { return cla.getAll(req.args) }

    //Get number of signed CLAs for the given repo. If no gist_version provided, the latest one will be used.
    //Params:
    //	repo (mandatory)
    //	owner (mandatory)
    //	gist.gist_url (optional)
    //	gist.gist_version (optional)
    async countCLA(req) {
        let params = req.args
        try {

            if (params.gist && params.gist.gist_url && params.gist.gist_version && (params.repoId || params.orgId)) {
                throw 'invalid parameters provided'
            }
            const item = await this.getLinkedItem(req)
            if (!item) {
                throw new Error('no item found')
            }
            params.token = item.token
            params.sharedGist = item.sharedGist
            if (item.orgId) {
                params.orgId = item.orgId
            } else if (item.repoId) {
                params.repoId = item.repoId
            }
            params.gist = params.gist && params.gist.gist_url ? params.gist : {
                gist_url: item.gist
            }
            const gist = await cla.getGist(params)
            if (!gist) {
                let error = `No gist found ${removeToken(req.args)}`
                logger.warn(new Error(error).stack)
                throw error
            }
            params.gist.gist_version = gist.history[0].version
        } catch (e) {
            logger.info(`${e} There is no such item for args: ${removeToken(req.args)}`)
            throw (`${e} There is no such item`)
        }

        const clas = await cla.getAll(params)
        return clas.length
    }

    async validateOrgPullRequests(req) {
        try {
            const repos = await getReposNeedToValidate(req)

            repos.forEach(repo => {
                let validateRequest = {
                    args: {
                        owner: repo.owner.login,
                        repo: repo.name,
                        token: req.args.token || req.user.token
                    },
                    user: req.user
                }
                this.validateAllPullRequests(validateRequest)
                logger.info('validateOrgPRs for ' + validateRequest.args.owner + '/' + validateRequest.args.repo)
            })
        } catch (error) {
            logger.info(new Error(error).stack)
        }
        return true
    }

    // Check/update status and comment of PR
    // Params:
    // repo (mandatory)
    // owner (mandatory)
    // number (mandatory)
    // gist (optional)
    // sharedGist (optional)
    // token (optional)
    // sha (optional)
    async validatePullRequest(args) {
        return validatePR(args)
    }

    async validateAllPullRequests(req) {
        let pullRequests = []
        const token = req.args.token ? req.args.token : req.user.token

        try {
            const resp = await github.call({
                obj: 'pulls',
                fun: 'list',
                arg: {
                    owner: req.args.owner,
                    repo: req.args.repo,
                    state: 'open',
                    per_page: 100
                },
                token
            })
            pullRequests = resp.data
        } catch (error) {
            logger.error(new Error(error).stack)
        }

        if (pullRequests.length > 0) {
            const promises = pullRequests.map((pullRequest) => {
                const status_args = {
                    repo: req.args.repo,
                    owner: req.args.owner,
                    sha: pullRequest.head.sha,
                    token: token
                }
                status_args.number = pullRequest.number

                return this.validatePullRequest(status_args)
            })
            return Promise.all(promises)
        }
        return []
    }

    async validateSharedGistItems(req) {
        const sharedItems = await getLinkedItemsWithSharedGist(req.args.gist)
        const items = (sharedItems.repos || []).concat(sharedItems.orgs || [])
        const promises = items.map(function (item) {
            let tmpReq = {
                args: {
                    token: item.token,
                    gist: item.gist,
                    sharedGist: true
                }
            }
            if (item.org) {
                tmpReq.args.org = item.org
                return this.validateOrgPullRequests(tmpReq)
            }
            tmpReq.args.repo = item.repo
            tmpReq.args.owner = item.owner
            return this.validateAllPullRequests(tmpReq)
        }.bind(this))
        return Promise.all(promises)
    }

    async sign(req) {
        let args = {
            repo: req.args.repo,
            owner: req.args.owner,
            user: req.user.login,
            userId: req.user.id,
        }
        if (req.args.custom_fields) {
            args.custom_fields = req.args.custom_fields
        }
        try {
            const item = await this.getLinkedItem({
                args: {
                    repo: args.repo,
                    owner: args.owner
                }
            })

            args.item = item
            args.token = item.token
            args.origin = `sign|${req.user.login}`

            const signed = await cla.sign(args)
            await updateUsersPullRequests(args)

            return signed
        } catch (e) {
            if (!e.code || e.code != 200) {
                logger.error(new Error(e).stack)
            }
            throw e
        }
    }

    check(req) {
        let args = {
            repo: req.args.repo,
            owner: req.args.owner,
            number: req.args.number,
            user: req.user.login,
            userId: req.user.id
        }
        return cla.check(args)
    }

    async upload(req) {
        const signatures = req.args.signatures || []
        const uploadInitiator = req.user.login

        const promises = signatures.map(async signature => {
            try {
                if (!signature || !signature.user) {
                    // eslint-disable-next-line quotes
                    throw `Uploaded signature doesn't contain user name`
                }
                const ghUser = await getGithubUser(signature.user, req.user.token);

                const args = {
                    repo: req.args.repo,
                    owner: req.args.owner,
                    user: ghUser.login,
                    userId: ghUser.id,
                    origin: `upload|${uploadInitiator}`
                }
                if (signature.created_at) {
                    args.created_at = signature.created_at
                }
                if (signature.custom_fields) {
                    args.custom_fields = signature.custom_fields
                }

                const signed = await cla.sign(args)
                return signed

            } catch (error) {
                logger.info(new Error(error).stack)
                throw error
            }
        })
        return Promise.all(promises.map(promise => promise.catch(() => undefined)))
    }

    async addSignature(req) {
        validateArgs(req.args, SIGNATURESCHEMA)
        req.args.owner = req.args.owner || req.args.org
        delete req.args.org
        try {
            const item = await this.getLinkedItem({
                args: {
                    repo: req.args.repo,
                    owner: req.args.owner
                }
            })
            req.args.item = item
            req.args.token = item.token
            req.args.origin = `${req.args.origin ? req.args.origin + '|' : ''}addSignature|${req.user.login}`
            const signed = await cla.sign(req.args)
            updateUsersPullRequests(req.args)
            // Add signature API will get a timeout error if waiting for validating pull requests.
            return signed
        } catch (e) {
            logger.error(new Error(e).stack)
            throw e
        }
    }

    hasSignature(req) {
        validateArgs(req.args, SIGNATURESCHEMA)
        req.args.owner = req.args.owner || req.args.org
        delete req.args.org
        return cla.check(req.args)
    }

    terminateSignature(req) {
        let schema = SIGNATURESCHEMA
        schema = schema.append({
            endDate: Joi.string().isoDate().required()
        })
        validateArgs(req.args, schema)

        req.args.owner = req.args.owner || req.args.org
        delete req.args.org
        return cla.terminate(req.args)
    }

    // updateDBData: function (req, done) {
    //     // repoService.updateDBData(req, function(){
    //         cla.updateDBData(req, function(msg){
    //             done(null, msg)
    //         })
    //     // })
    // }
}
const claApi = new ClaApi()
module.exports = claApi


async function markdownRender(content, token) {
    const args = {
        obj: 'markdown',
        fun: 'render',
        arg: {
            text: content
        },
        token: token
    }
    const response = await github.call(args)
    return { raw: response.body || response.data || response }
}

async function renderFiles(files, renderToken) {
    let content
    try {
        Object.keys(files).some(function (name) {
            content = name != 'metadata' ? files[name].content : content

            return name != 'metadata'
        })
    } catch (e) {
        throw new Error(e)
    }

    const contentPromise = markdownRender(content, renderToken)
    const metaPromise = files && files.metadata ? markdownRender(files.metadata.content, renderToken) : undefined
    const data = await Promise.all([contentPromise, metaPromise])

    let gistContent = {}
    gistContent.raw = data[0] ? data[0].raw : undefined
    gistContent.meta = data[1] ? data[1].raw : undefined

    return gistContent
}

async function getLinkedItemsWithSharedGist(gist) {
    if (!gist) {
        throw 'Gist is required.'
    }
    const linkedItems = {}
    try {
        linkedItems.repos = await repoService.getRepoWithSharedGist(gist)
    } catch (error) {
        logger.error(new Error(error).stack)
    }
    try {
        linkedItems.orgs = await orgService.getOrgWithSharedGist(gist)
    } catch (error) {
        logger.error(new Error(error).stack)
    }

    return linkedItems
}

async function validatePR(args) {
    args.token = args.token ? args.token : token
    try {
        const item = await cla.getLinkedItem(args)
        args.token = item.token
        if (!item.gist) {
            return claNotRequired(args, 'updateForNullCla')
        }
        const isClaRequired = await cla.isClaRequired(args)
        if (!isClaRequired) {
            return claNotRequired(args, 'updateForClaNotRequired')
        }
        const checkResult = await cla.check(args)

        args.signed = checkResult.signed
        const userMap = checkResult.userMap

        const updateMethod = (!userMap ||
            (userMap.signed && userMap.signed.length > 0) ||
            (userMap.not_signed && userMap.not_signed.length > 0) ||
            (userMap.unknown && userMap.unknown.length > 0)) ? 'update' : 'updateForClaNotRequired'

        await status[updateMethod](args)
        prService.editComment({
            repo: args.repo,
            owner: args.owner,
            number: args.number,
            signed: args.signed,
            userMap: userMap
        })
    } catch (e) {
        logger.error(e.stack, removeToken(args))
    }
}

function removeToken(args) {
    let logArgs = Object.assign({}, args)
    logArgs.token = logArgs.token ? logArgs.token.slice(0, 4) + '***' : undefined
    return logArgs
}

async function claNotRequired(args, updateMethod) {
    try {
        await status[updateMethod](args)
        prService.deleteComment({
            repo: args.repo,
            owner: args.owner,
            number: args.number
        })
    }
    catch (error) {
        logger.info(new Error(error).stack)
    }
}

// Check/update status and comment of PRs saved for the user and matching linked item
// Params:
// user (mandatory)
// repo (mandatory)
// owner (mandatory)
// item (mandatory)
//      gist (mandatory)
//      sharedGist (optional)
// token (mandatory)
async function updateUsersPullRequests(args) {
    try {
        const user = await User.findOne({ name: args.user })
        if (!user || !user.requests || user.requests.length < 1) {
            throw 'user or PRs not found'
        }

        return prepareForValidation(args.item, user)
    } catch (e) {
        let req = {
            args: {
                gist: args.item.gist,
                token: args.token
            }
        }
        if (args.item.sharedGist) {
            return claApi.validateSharedGistItems(req)
        } else if (args.item.org) {
            req.args.org = args.item.org

            return claApi.validateOrgPullRequests(req)
        }

        req.args.repo = args.repo
        req.args.owner = args.owner

        return claApi.validateAllPullRequests(req)
    }
}

async function prepareForValidation(item, user) {
    const needRemove = []

    await Promise.all(user.requests.map(async (pullRequests, index) => {
        try {
            const linkedItem = await cla.getLinkedItem({ repo: pullRequests.repo, owner: pullRequests.owner })
            if (!linkedItem) {
                needRemove.push(index)
                return
            }
            if ((linkedItem.owner === item.owner && linkedItem.repo === item.repo) || linkedItem.org === item.org || (linkedItem.gist === item.gist && item.sharedGist === true && linkedItem.sharedGist === true)) {
                needRemove.push(index);
                validateUserPRs(pullRequests.repo, pullRequests.owner, linkedItem.gist, linkedItem.sharedGist, pullRequests.numbers, linkedItem.token);
            }
            return linkedItem;
        }
        catch (e) {
            logger.warn(e.stack);
        }
    }).filter((promise) => {
        return promise !== undefined;
    }));
    needRemove.sort();
    for (let i = needRemove.length - 1; i >= 0; --i) {
        user.requests.splice(needRemove[i], 1);
    }
    user.save();
}

function validateUserPRs(repo, owner, gist, sharedGist, numbers, token) {
    numbers.forEach((prNumber) => {
        validatePR({
            repo: repo,
            owner: owner,
            number: prNumber,
            gist: gist,
            sharedGist: sharedGist,
            token: token
        })
    })
}

async function getReposNeedToValidate(req) {
    let repos = []
    const allRepos = await github.call({
        obj: 'repos',
        fun: 'listForOrg',
        arg: {
            org: req.args.org,
            per_page: 100
        },
        token: req.args.token || req.user.token
    })
    try {
        const linkedOrg = await orgService.get(req.args)
        const linkedRepos = await repoService.getByOwner(req.args.org)
        const linkedRepoSet = new Set(
            linkedRepos
                .filter(repo => repo.repoId) //ignore old DB entries with no repoId
                .map(linkedRepo => linkedRepo.repoId.toString())
        )
        repos = allRepos.data.filter(repo => {
            if (linkedOrg.isRepoExcluded !== undefined && linkedOrg.isRepoExcluded(repo.name)) {
                // The repo has been excluded.
                return false
            }
            if (linkedRepoSet.has(repo.id.toString())) {
                // The repo has a separate CLA.
                return false
            }

            return true
        })
    } catch (error) {
        logger.warn(new Error(error.stack))
    }

    return repos
}

function validateArgs(args, schema) {
    const joiRes = Joi.validate(args, schema, { abortEarly: false, convert: false });
    if (joiRes.error) {
        joiRes.error.code = 400;
        throw joiRes.error;
    }
}

async function getGithubUser(userName, token) {
    const res = await github.call({
        obj: 'users',
        fun: 'getByUsername',
        arg: {
            username: userName
        },
        token: token
    })
    if (!res.data) {
        throw `${userName} is not a GitHub user`
    }
    return res.data
}
