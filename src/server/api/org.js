let org = require('../services/org');
let github = require('../services/github');
let log = require('../services/logger');
let q = require('q');
let Joi = require('joi');
let webhook = require('./webhook');

//queries
let queries = require('../graphQueries/github');

module.exports = {

    // check: function(req, done) {
    //     org.check(req.args, done);
    // },
    create: function (req, done) {
        req.args.token = req.args.token || req.user.token;
        let schema = Joi.object().keys({
            orgId: Joi.number().required(),
            org: Joi.string().required(),
            gist: Joi.string().required(),
            token: Joi.string().required(),
            excludePattern: Joi.string(),
            sharedGist: Joi.boolean(),
            minFileChanges: Joi.number(),
            minCodeChanges: Joi.number()
        });
        Joi.validate(req.args, schema, { abortEarly: false, allowUnknown: true }, function (joiError) {
            if (joiError) {
                joiError.code = 400;
                return done(joiError);
            }
            let query = {
                orgId: req.args.orgId,
                org: req.args.org,
            };
            org.get(query, function (err, dbOrg) {
                if (dbOrg) {
                    return done('This org is already linked.');
                }
                org.create(req.args, function (createOrgErr, dbOrg) {
                    if (createOrgErr) {
                        return done(createOrgErr);
                    }
                    webhook.create(req, function (createHookErr) {
                        done(createHookErr, dbOrg);
                    });
                });
            });
        });
    },
    getForUser: function (req, done) {
        this.getGHOrgsForUser(req, function (err, res) {
            if (err) {
                log.warn(new Error(err).stack);
                done(err);
                return;
            }
            let argsForOrg = {
                orgId: res.map((org) => { return org.id; })
            };
            org.getMultiple(argsForOrg, done);
        });
    },

    getGHOrgsForUser: function (req, done) {
        let organizations = [];

        function callGithub(arg) {

            let query = arg.query ? arg.query : queries.getUserOrgs(req.user.login, null);

            github.callGraphql(query, req.user.token, function (err, res, body) {
                if (err || res.statusCode > 200) {
                    log.info(new Error(err).stack);
                    if (!res) {
                        handleError('No result on GH call, getting user orgs! For user: ', req.user);
                        return;
                    }
                }

                body = body ? JSON.parse(body) : body;
                if (body && body.data && !res.message) {
                    try {
                        let data = body.data.user.organizations;

                        organizations = data.edges.reduce((orgs, edge) => {
                            if (edge.node.viewerCanAdminister) {
                                edge.node.id = edge.node.databaseId;
                                orgs.push(edge.node);
                            }
                            return orgs;
                        }, organizations);

                        if (data.pageInfo.hasNextPage) {
                            arg.query = queries.getUserOrgs(req.user.login, data.pageInfo.endCursor);
                            callGithub(arg);
                        } else {
                            done(null, organizations);
                        }
                    } catch (error) {
                        log.warn(new Error('Could not find and filter user organizations; ' + error).stack);
                        done(error);
                        return;
                    }

                } else if (res.message || body.errors || res.statusCode > 200) {
                    try {
                        done(res.message || body.errors[0].message);
                    } catch (error) {
                        done('Error occured by getting users organizations');
                    }
                }

            });
        };
        if (req.user && req.user.login) {
            callGithub({});
        } else {
            done('User is undefined');
        }
    },
    // update: function(req, done){
    //     org.update(req.args, done);
    // },
    remove: function (req, done) {
        let schema = Joi.object().keys({
            org: Joi.string(),
            orgId: Joi.number()
        }).or('org', 'orgId');
        Joi.validate(req.args, schema, { abortEarly: false }, function (joiError) {
            if (joiError) {
                joiError.code = 400;
                return done(joiError);
            }
            org.remove(req.args, function (removeOrgErr, dbOrg) {
                if (removeOrgErr) {
                    return done(removeOrgErr);
                }
                req.args.org = dbOrg.org;
                webhook.remove(req, function (removeHookErr) {
                    done(removeHookErr, dbOrg);
                });
            });
        });
    }
};
