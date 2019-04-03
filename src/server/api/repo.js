// module
const repo = require('../services/repo');
const logger = require('../services/logger');
const Joi = require('joi');
const webhook = require('./webhook');

const REPOCREATESCHEMA = Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
    repoId: Joi.number().required(),
    token: Joi.string().required(),
    gist: Joi.alternatives().try(Joi.string().uri(), Joi.any().allow([null])), // Null CLA
    sharedGist: Joi.boolean(),
    minFileChanges: Joi.number(),
    minCodeChanges: Joi.number()
})

const REPOREMOVESCHEMA = Joi.alternatives().try(Joi.object().keys({
    owner: Joi.string().required(),
    repo: Joi.string().required(),
}), Joi.object().keys({
    repoId: Joi.number().required()
}))

module.exports = {

    check: (req) => repo.check(req.args),
    create: async (req) => {
        req.args.token = req.args.token || req.user.token;
        validateArgs(req.args, REPOCREATESCHEMA, true)

        const repoArgs = {
            repo: req.args.repo,
            owner: req.args.owner,
            token: req.args.token
        };
        let dbRepo
        try {
            dbRepo = await repo.get(repoArgs)
            if (!dbRepo) {
                throw 'New repo should be created'
            }
            try {
                const ghRepo = await repo.getGHRepo(repoArgs)
                if (ghRepo && ghRepo.id != dbRepo.repoId) {
                    throw 'Repo id has changed'
                }
            } catch (error) {
                return repo.update(req.args)
            }
        } catch (error) {
            dbRepo = await repo.create(req.args)

            if (dbRepo.gist) {
                try {
                    webhook.create(req)
                } catch (error) {
                    logger.error(`Could not create a webhook for the new repo ${new Error(error)}`)
                }
            }
            return dbRepo
        }
        throw 'This repository is already linked.'
    },
    // get: function(req, done){
    // 	repo.get(req.args, function(err, found_repo){
    // 		if (!found_repo || err || found_repo.owner !== req.user.login) {
    // 			log.warn(err);
    // 			done(err);
    // 			return;
    // 		}
    // 		done(err, found_repo);
    // 	});
    // },
    getAll: (req) => repo.getAll(req.args),
    update: (req) => {
        req.args.token = req.args.token || req.user.token;
        return repo.update(req.args)
    },
    remove: async (req) => {
        validateArgs(req.args, REPOREMOVESCHEMA)

        const dbRepo = await repo.remove(req.args)
        if (dbRepo && dbRepo.gist) {
            req.args.owner = dbRepo.owner;
            req.args.repo = dbRepo.repo;
            try {
                webhook.remove(req)
            } catch (error) {
                logger.error(`Could not remove the webhook for the repo ${new Error(error)}`)
            }
        }
        return dbRepo
    }
};

function validateArgs(args, schema, allowUnknown) {
    const joiRes = Joi.validate(args, schema, { abortEarly: false, allowUnknown });
    if (joiRes.error) {
        joiRes.error.code = 400;
        throw joiRes.error;
    }
}