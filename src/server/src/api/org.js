// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const github = require('../services/github')
const log = require('../services/logger')
const Joi = require('joi')
const webhook = require('./webhook')
const logger = require('../services/logger')
const utils = require('../middleware/utils')
const orgService = require('../services/repo').orgService
const newOrgSchema = Joi.object().keys({
    orgId: Joi.number().required(),
    org: Joi.string().required(),
    gist: Joi.string().required(),
    token: Joi.string().required(),
    excludePattern: Joi.string(),
    sharedGist: Joi.boolean(),
    minFileChanges: Joi.number(),
    minCodeChanges: Joi.number(),
    allowListPattern: Joi.string().allow(''),
    allowListPatternOrgs: Joi.string().allow(''),
    privacyPolicy: Joi.string().allow('')
})
const removeOrgSchema = Joi.object().keys({
    org: Joi.string(),
    orgId: Joi.number()
}).or('org', 'orgId')

class OrgAPI {
    async create(req) {
        logger.info('got org create request')
        req.args.token = req.args.token || req.user.token
        utils.validateArgs(req.args, newOrgSchema, true)

        const query = {
            orgId: req.args.orgId,
            org: req.args.org,
        }
        let dbOrg
        try {
            dbOrg = await orgService.get(query)
        } catch (error) {
            logger.info(new Error(error).stack)
        }

        if (dbOrg) {
            throw new Error('This org is already linked.')
        }

        // check if GitHub App is installed to the org
        try {
            // this will throw an error if the app is not installed
            await github.getInstallationAccessTokenForOrg(req.args.org)
        } catch(error) {
            return 'GitHub App not installed or insufficient permissions'
        }

        dbOrg = await orgService.create(req.args)

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

        return orgService.update(req.args)
    }

    async getForUser(req) {
        try {
            const res = await this.getGHOrgsForUser(req)
            const argsForOrg = {
                orgId: res.map((org) => org.id)
            }
            const orgs = JSON.parse(JSON.stringify(await orgService.getMultiple(argsForOrg)))
            return orgs.map((org) => {
                orgService.migrate = !!org.token
                return org
            })
        } catch (error) {
            log.warn(error.stack)
            throw error
        }
    }

    async getGHOrgsForUser(req) {
        let organizations = []

        if (req.user && req.user.login) {
            for (let page = 1; ; page += 1) {
                const installations = await github.call({
                    obj: 'apps',
                    fun: 'listInstallationsForAuthenticatedUser',
                    arg: {
                        per_page: 100,
                        page
                    },
                    token: req.user.token,
                    owner: req.user.login
                })

                installations.data
                    .filter((installation) => installation.target_type === 'Organization')
                    .map((installation) => {
                        const account = JSON.parse(JSON.stringify(installation.account))
                        // move the selection attribute to the account object
                        account.repository_selection = installation.repository_selection
                        return account
                    })
                    .forEach((installation) => organizations.push(installation))

                if (installations.data || installations.data.length < 100) {
                    break
                }
            }

            return organizations
        }
        /*
        async function callGithub(arg) {
            const query = arg.query ? arg.query : queries.getUserOrgs(req.user.login, null)
            logger.info('getGHOrgsForUser arg:', {arg, query})

            try {
                const body = await github.callGraphql(query, req.user.token)
                logger.info('body:', body.data.user)

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
        */

        throw new Error('User is undefined')
    }
    // update(req, done){
    //     orgService.update(req.args, done)
    // }
    async remove(req) {
        utils.validateArgs(req.args, removeOrgSchema)
        const dbOrg = await orgService.remove(req.args)
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

    async migrate(req) {
        utils.validateArgs(req.args, removeOrgSchema)
        return orgService.migrate(req.args, req.user.login)
    }
}

module.exports = new OrgAPI()
