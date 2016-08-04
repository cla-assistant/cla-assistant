var org = require('../services/org');
var github = require('../services/github');
var log = require('../services/logger');
var q = require('q');

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
                orgId: extractIds(res)
            };
            org.getMultiple(argsForOrg, done);
        });
    },

    getGHOrgsForUser: function (req, done) { // TODO: test it!
        var promises = [];
        var argsForGithub = {
            obj: 'users',
            fun: 'getOrgs',
            token: req.user.token
        };
        github.call(argsForGithub, function (err, res) {
            if (err) {
                log.warn(err);
                done(err);
                return;
            }
            var orgs = res;
            var adminOrgs = [];

            if (orgs instanceof Array) {
                orgs.forEach(function (org) {
                    argsForGithub.fun = 'getOrganizationMembership';
                    argsForGithub.arg = { org: org.login };
                    var promise = github.call(argsForGithub).then(function (info) {
                        if (info && info.data && info.data.role === 'admin') {
                            adminOrgs.push(org);
                        }
                    });
                    promises.push(promise);
                });
                q.all(promises).then(function () {
                    done(null, adminOrgs);
                });

            } else {
                done(err ? err : 'Could not find github orgs');
            }
        });
    },
    // update: function(req, done){
    //     org.update(req.args, done);
    // },
    remove: function (req, done) {
        org.remove(req.args, done);
    }
};
