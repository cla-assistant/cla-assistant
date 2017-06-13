// services
var pullRequest = require('../services/pullRequest');
var status = require('../services/status');
var cla = require('../services/cla');
var repoService = require('../services/repo');
var orgService = require('../services/org');
var log = require('../services/logger');
var config = require('../../config');

//////////////////////////////////////////////////////////////////////////////////////////////
// Github Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

function handleWebHook(args) {
    repoService.getPRCommitters(args, function (err, committers) {
        if (!err && committers && committers.length > 0) {
            cla.check(args, function (error, signed, user_map) {
                if (error) {
                    log.warn(new Error(error).stack);
                }
                args.signed = signed;
                status.update(args);
                // if (!signed) {
                pullRequest.badgeComment(
                    args.owner,
                    args.repo,
                    args.number,
                    signed,
                    user_map
                );
                // }
            });
        } else {
            if (!args.handleCount || args.handleCount < 2) {
                args.handleCount = args.handleCount ? ++args.handleCount : 1;
                setTimeout(function () {
                    handleWebHook(args);
                }, 10000 * args.handleCount * args.handleDelay);
            } else {
                log.warn(new Error(err).stack, 'PR committers: ', committers, 'called with args: ', args);
            }
        }
    });
}

module.exports = function (req, res) {
    if (['opened', 'reopened', 'synchronize'].indexOf(req.args.action) > -1 && (req.args.repository && req.args.repository.private == false)) {
        if (req.args.pull_request && req.args.pull_request.html_url) {
            console.log('pull request ' + req.args.action + ' ' + req.args.pull_request.html_url);
        }
        var args = {
            owner: req.args.repository.owner.login,
            repoId: req.args.repository.id,
            repo: req.args.repository.name,
            number: req.args.number
        };
        args.orgId = req.args.organization ? req.args.organization.id : req.args.repository.owner.id;
        args.handleDelay = req.args.handleDelay != undefined ? req.args.handleDelay : 1; // needed for unitTests


        setTimeout(function () {
            orgService.get({
                orgId: args.orgId
            }, function (err, org) {
                if (org) {
                    args.token = org.token;
                    args.gist = org.gist; //TODO: Test it!!
                    if (!org.isRepoExcluded(args.repo)) {
                        repoService.getGHRepo(args, function (err, repo) {
                            if (repo) {
                                handleWebHook(args);
                            }
                        });
                    }
                } else {
                    args.orgId = undefined;
                    repoService.get(args, function (e, repo) {
                        if (repo) {
                            args.token = repo.token;
                            args.gist = repo.gist; //TODO: Test it!!
                            handleWebHook(args);
                        }
                    });
                }
            });
        }, config.server.github.enforceDelay);
    }

    res.status(200).send('OK');
};