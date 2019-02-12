require('../documents/user');

// services
let pullRequest = require('../services/pullRequest');
let status = require('../services/status');
let cla = require('../services/cla');
let repoService = require('../services/repo');
let logger = require('../services/logger');
let config = require('../../config');
let User = require('mongoose').model('User');


//////////////////////////////////////////////////////////////////////////////////////////////
// GitHub Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

function storeRequest(committers, repo, owner, number) {
    committers.forEach(function (committer) {
        User.findOne({ name: committer }, (err, user) => {
            if (err) {
                logger.warn(err.stack);
            }
            let pullRequest = { repo: repo, owner: owner, numbers: [number] };
            if (!user) {
                User.create({ name: committer, requests: [pullRequest] }, (error) => {
                    if (error) {
                        logger.warn(error.stack);
                    }
                });

                return;
            }
            if (!user.requests || user.requests.length < 1) {
                user.requests = user.requests ? user.requests : [];
                user.requests.push(pullRequest);
                user.save();

                return;
            }
            let repoPullRequests = user.requests.find((request) => {
                return request.repo === repo && request.owner === owner;
            });
            if (repoPullRequests && repoPullRequests.numbers.indexOf(number) < 0) {
                repoPullRequests.numbers.push(number);
                user.save();
            }
            if (!repoPullRequests) {
                user.requests.push(pullRequest);
                user.save();
            }
        });
    });
}

function updateStatusAndComment(args) {
    repoService.getPRCommitters(args, function (err, committers) {
        if (!err && committers && committers.length > 0) {
            cla.check(args, function (error, signed, user_map) {
                if (error) {
                    logger.warn(new Error(error).stack);
                }
                args.signed = signed;
                if (!user_map ||
                    (user_map.signed && user_map.signed.length > 0) ||
                    (user_map.not_signed && user_map.not_signed.length > 0) ||
                    (user_map.unknown && user_map.unknown.length > 0)
                ) {
                    status.update(args);
                } else {
                    status.updateForClaNotRequired(args);
                }
                // if (!signed) {
                pullRequest.badgeComment(
                    args.owner,
                    args.repo,
                    args.number,
                    signed,
                    user_map
                );
                if (user_map && user_map.not_signed) {
                    storeRequest(user_map.not_signed, args.repo, args.owner, args.number);
                }
                // }
            });
        } else {
            if (!args.handleCount || args.handleCount < 2) {
                args.handleCount = args.handleCount ? ++args.handleCount : 1;
                setTimeout(function () {
                    updateStatusAndComment(args);
                }, 10000 * args.handleCount * args.handleDelay);
            } else {
                logger.warn(new Error(err).stack, 'PR committers: ', committers, 'called with args: ', args);
            }
        }
    });
}

async function handleWebHook(args) {
    try {
        const claRequired = await cla.isClaRequired(args);
        if (claRequired) {
            updateStatusAndComment(args);
        } else {
            status.updateForClaNotRequired(args);
            pullRequest.deleteComment({
                repo: args.repo,
                owner: args.owner,
                number: args.number
            });
        }
    } catch (error) {
        return logger.error(error);
    }
}

module.exports = function (req, res) {
    if (['opened', 'reopened', 'synchronize'].indexOf(req.args.action) > -1 && (req.args.repository && req.args.repository.private == false)) {
        if (req.args.pull_request && req.args.pull_request.html_url) {
            // eslint-disable-next-line no-console
            console.log('pull request ' + req.args.action + ' ' + req.args.pull_request.html_url);
        }
        let args = {
            owner: req.args.repository.owner.login,
            repoId: req.args.repository.id,
            repo: req.args.repository.name,
            number: req.args.number
        };
        args.orgId = req.args.organization ? req.args.organization.id : req.args.repository.owner.id;
        args.handleDelay = req.args.handleDelay != undefined ? req.args.handleDelay : 1; // needed for unitTests


        setTimeout(async function () {
            try {
                const item = await cla.getLinkedItem(args);
                let nullCla = !item.gist;
                let isExcluded = item.orgId && item.isRepoExcluded && item.isRepoExcluded(args.repo);
                if (nullCla || isExcluded) {
                    return;
                }
                args.token = item.token;
                args.gist = item.gist;
                if (item.repoId) {
                    args.orgId = undefined;
                }

                return handleWebHook(args);
            } catch (e) {
                logger.warn(e);

            }
        }, config.server.github.enforceDelay);
    }

    res.status(200).send('OK');
};