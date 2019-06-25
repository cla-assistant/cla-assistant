const org = require('../services/org')
const github = require('../services/github')
const log = require('../services/logger')
const Joi = require('joi')
const webhook = require('./webhook')
const logger = require('../services/logger')
const utils = require('../middleware/utils')
//queries
const queries = require('../graphQueries/github')
const newOrgSchema = Joi.object().keys({
    orgId: Joi.number().required(),
    org: Joi.string().required(),
    gist: Joi.string().required(),
    token: Joi.string().required(),
    excludePattern: Joi.string(),
    sharedGist: Joi.boolean(),
    minFileChanges: Joi.number(),
    minCodeChanges: Joi.number(),
    whiteListPattern: Joi.string().allow(''),
    privacyPolicy: Joi.string().allow('')
})
const removeOrgSchema = Joi.object().keys({
    org: Joi.string(),
    orgId: Joi.number()
}).or('org', 'orgId')

class OrgAPI {
    async create(req) {
        req.args.token = req.args.token || req.user.token
        utils.validateArgs(req.args, newOrgSchema, true)

        const query = {
            orgId: req.args.orgId,
            org: req.args.org,
        }
        let dbOrg
        try {
            dbOrg = await org.get(query)
        } catch (error) {
            logger.info(new Error(error).stack)
        }

        if (dbOrg) {
            throw new Error('This org is already linked.')
        }
        dbOrg = await org.create(req.args)

        try {
            await webhook.create(req)
        } catch (error) {
            logger.error(new Error(error).stack)
        }
        return dbOrg
    }

    async update(req) {
        req.args.token = req.args.token || req.user.token
        utils.validateArgs(req.args, newOrgSchema, true)

        return org.update(req.args)
    }

    async getForUser(req) {
        try {
            const res = await this.getGHOrgsForUser(req)
            const argsForOrg = {
                orgId: res.map((org) => org.id)
            }
            return org.getMultiple(argsForOrg)
        } catch (error) {
            log.warn(error.stack)
            throw error
        }
    }

    async getGHOrgsForUser(req) {
        let organizations = []

        async function callGithub(arg) {
            const query = arg.query ? arg.query : queries.getUserOrgs(req.user.login, null)

            try {
                let body = await github.callGraphql(query, req.user.token)
                body = JSON.parse(body)

                if (body.errors) {
                    const errorMessage = body.errors[0] && body.errors[0].message ? body.errors[0].message : 'Error occurred by getting users organizations'
                    logger.info(new Error(errorMessage).stack)
                }

                const data = body.data.user.organizations

                organizations = data.edges.reduce((orgs, edge) => {
                    if (edge.node.viewerCanAdminister) {
                        edge.node.id = edge.node.databaseId
                        orgs.push(edge.node)
                    }

                    return orgs
                }, organizations)

                if (data.pageInfo.hasNextPage) {
                    arg.query = queries.getUserOrgs(req.user.login, data.pageInfo.endCursor)
                    return callGithub(arg)
                }
                return organizations
            } catch (error) {
                log.info(new Error(error).stack)
                log.warn(`No result on GH call, getting user orgs! For user: ${req.user}`)
                throw error
            }
        }
        if (req.user && req.user.login) {
            return callGithub({})
        }

        throw new Error('User is undefined')
    }
    // update(req, done){
    //     org.update(req.args, done)
    // }
    async remove(req) {
        utils.validateArgs(req.args, removeOrgSchema)
        const dbOrg = await org.remove(req.args)
        if (!dbOrg) {
            throw new Error('Organization is not Found')
        }
        req.args.org = dbOrg.org
        try {
            await webhook.remove(req)
        } catch (error) {
            logger.warn(new Error(error))
        }
        return dbOrg
    }
}

module.exports = new OrgAPI()