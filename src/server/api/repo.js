// module
let repo = require('../services/repo');
let log = require('../services/logger');
let Joi = require('joi');
let webhook = require('./webhook');

module.exports = {

    check: function (req, done) {
        repo.check(req.args, done);
    },
    create: function (req, done) {
        req.args.token = req.args.token || req.user.token;
        let schema = Joi.object().keys({
            owner: Joi.string().required(),
            repo: Joi.string().required(),
            repoId: Joi.number().required(),
            token: Joi.string().required(),
            gist: Joi.alternatives().try(Joi.string().uri(), Joi.any().allow([null])), // Null CLA
            sharedGist: Joi.boolean(),
            minFileChanges: Joi.number(),
            minCodeChanges: Joi.number()
        });
        Joi.validate(req.args, schema, { abortEarly: false, allowUnknown: true }, function (joiError) {
            if (joiError) {
                joiError.code = 400;

                return done(joiError);
            }
            let repoArgs = {
                repo: req.args.repo,
                owner: req.args.owner,
                token: req.args.token
            };
            repo.get(repoArgs, function (error, dbRepo) {
                if (dbRepo) {
                    repo.getGHRepo(repoArgs, function (err, ghRepo) {
                        if (err || (ghRepo && ghRepo.id != dbRepo.repoId)) {
                            repo.update(req.args, done);
                        } else {
                            done('This repository is already linked.');
                        }
                    });
                } else {
                    repo.create(req.args, function (createRepoErr, dbRepo) {
                        if (createRepoErr) {
                            return done(createRepoErr);
                        }
                        if (!dbRepo.gist) {
                            return done(null, dbRepo);
                        }
                        webhook.create(req, function (createHookErr) {
                            done(createHookErr, dbRepo);
                        });
                    });
                }
            });
        });
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
    getAll: function (req, done) {
        repo.getAll(req.args, function (err, repos) {
            if (err) {
                log.error(err);
            }
            done(err, repos);
        });
    },
    update: function (req, done) {
        req.args.token = req.args.token || req.user.token;
        repo.update(req.args, done);
    },
    remove: function (req, done) {
        let schema = Joi.alternatives().try(Joi.object().keys({
            owner: Joi.string().required(),
            repo: Joi.string().required(),
        }), Joi.object().keys({
            repoId: Joi.number().required()
        }));
        Joi.validate(req.args, schema, { abortEarly: false }, function (joiError) {
            if (joiError) {
                joiError.code = 400;

                return done(joiError);
            }
            repo.remove(req.args, function (removeRepoErr, dbRepo) {
                if (removeRepoErr) {
                    return done(removeRepoErr);
                }
                if (!dbRepo || !dbRepo.gist) {
                    return done(null, dbRepo);
                }
                req.args.owner = dbRepo.owner;
                req.args.repo = dbRepo.repo;
                webhook.remove(req, function (removeHookErr) {
                    done(removeHookErr, dbRepo);
                });
            });
        });
    }
};