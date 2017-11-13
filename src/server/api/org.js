var org = require('../services/org');
var github = require('../services/github');
var log = require('../services/logger');
var q = require('q');

//queries
let queries = require('../graphQueries/github');

var extractIds = function (orgs) {
    var ids = [];
    try {
        orgs.forEach(function (org) {
            ids.push(org.id);
        });
    } catch (ex) {

    }
    return ids;
};
module.exports = {

    // check: function(req, done) {
    //     org.check(req.args, done);
    // },
    create: function (req, done) {
        req.args.token = req.user.token;
        org.create(req.args, done);
    },
    getForUser: function (req, done) {
        this.getGHOrgsForUser(req, function (err, res) {
            if (err) {
                log.warn(err);
                done(err);
                return;
            }
            var argsForOrg = {
                orgId: res.map((org) => { return org.id; }),
                login: res.map((org) => { return org.login; })
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
                        data.edges.forEach((edge) => {
                            let org = edge.node;
                            if (org.viewerCanAdminister) {
                                organizations.push(org);
                            }
                        });
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
    remove: function (req, done) {
        org.remove(req.args, done);
    }
};
