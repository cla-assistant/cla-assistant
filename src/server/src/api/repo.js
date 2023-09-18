// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

// module
const repo = require('../services/repo')
const logger = require('../services/logger')
const Joi = require('joi')
const webhook = require('./webhook')
const utils = require('../middleware/utils')
const github = require('../services/github')

const REPOCREATESCHEMA = Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
    repoId: Joi.number().required(),
    token: Joi.string().optional(),
    gist: Joi.alternatives().try(Joi.string().uri(), Joi.any().allow(null)), // Null CLA
    sharedGist: Joi.boolean(),
    minFileChanges: Joi.number(),
    minCodeChanges: Joi.number(),
    allowListPattern: Joi.string().allow(''),
    allowListPatternOrgs: Joi.string().allow(''),
    privacyPolicy: Joi.string().allow('')
})

const REPOREMOVESCHEMA = Joi.alternatives().try(Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
}), Joi.object().keys({
    repoId: Joi.number().required()
}))

module.exports = {
    check: (req) => repo.check(req.args),
    migrate: async (req) => {
        return await repo.migrate(req.args)
    },
    migrationPending: async (req) => {
        if (!req.user || !req.user.login) {
            throw 'Invalid user'
        }
        const pending = await repo.getMigrationPending(req.user.login)
        return pending.map(repo => {
            return { owner: repo.owner, repo: repo.repo, id: repo.repoId }
        })
    },
    create: async (req) => {
        utils.validateArgs(req.args, REPOCREATESCHEMA, true)

        const repoArgs = {
            repo: req.args.repo,
            owner: req.args.owner,
        }
        const dbRepo = await repo.get(repoArgs)

        // repo not yet in database: create
        if (!dbRepo) {
            // check if repo exists and if the GitHub App is installed
            try {
                // this will throw an error if the app is not installed
                await github.getInstallationAccessTokenForRepo(req.args.owner, req.args.repo)
            } catch(error) {
                throw 'GitHub App not installed'
            }

            const createdRepo = await repo.create(req.args)
            if (createdRepo.gist) {
                try {
                    await webhook.create(req)
                } catch (error) {
                    logger.error(`Could not create a webhook for the new repo ${new Error(error)}`)
                }
            }
            return createdRepo
        }

        // repo already in database: check for update
        const ghRepo = await repo.getGHRepo(repoArgs)
        if (ghRepo && ghRepo.id !== dbRepo.repoId) {
            return repo.update(req.args)
        }

        throw 'This repository is already linked.'
    },
    // get: function(req, done){
    // 	repo.get(req.args, function(err, found_repo){
    // 		if (!found_repo || err || found_repo.owner !== req.user.login) {
    // 			log.warn(err)
    // 			done(err)
    // 			return
    // 		}
    // 		done(err, found_repo)
    // 	})
    // },
    getAll: (req) => repo.getAll(req.args),
    getAllAppAccess: (req) => repo.getAllAccessibleByApp(req.user.token),
    update: (req) => {
        req.args.token = req.args.token || req.user.token
        utils.validateArgs(req.args, REPOCREATESCHEMA)
        return repo.update(req.args)
    },
    remove: async (req) => {
        utils.validateArgs(req.args, REPOREMOVESCHEMA)

        const dbRepo = await repo.remove(req.args)
        if (dbRepo && dbRepo.gist) {
            req.args.owner = dbRepo.owner
            req.args.repo = dbRepo.repo
            try {
                await webhook.remove(req)
            } catch (error) {
                logger.error(`Could not remove the webhook for the repo ${new Error(error)}`)
            }
        }
        return dbRepo
    }
}
