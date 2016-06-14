var org = require('../services/org');
var github = require('../services/github');
var log = require('../services/logger');

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
            var argsForOrg = {
                orgId: extractIds(res)
            };
            org.getMultiple(argsForOrg, done);
        });
    },
    // update: function(req, done){
    //     org.update(req.args, done);
    // },
    remove: function (req, done) {
        org.remove(req.args, done);
    }
};
