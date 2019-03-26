require('../documents/user');

// services
let pullRequest = require('../services/pullRequest');
let status = require('../services/status');
let cla = require('../services/cla');
let repoService = require('../services/repo');
let logger = require('../services/logger');
let config = require('../../config');
let User = require('mongoose').model('User');
const promisify = require('../util').promisify;
const promiseDelay = require('../util').promiseDelay;

//////////////////////////////////////////////////////////////////////////////////////////////
// GitHub Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

function storeRequest(committers, repo, owner, number) {
    return Promise.all(committers.map(async committer => {
        const [ user ] = await promisify(User.findOne.bind(User))({ name: committer });
        const pullRequest = { repo: repo, owner: owner, numbers: [number] };
        if (!user) {
            return promisify(User.create.bind(User))({ name: committer, requests: [pullRequest] });
        }
        if (!user.requests || user.requests.length < 1) {
            user.requests = user.requests ? user.requests : [];
            user.requests.push(pullRequest);

            return user.save();
        }
        const repoPullRequests = user.requests.find((request) => {
            return request.repo === repo && request.owner === owner;
        });
        if (repoPullRequests && repoPullRequests.numbers.indexOf(number) < 0) {
            repoPullRequests.numbers.push(number);

            return user.save();
        }
        if (!repoPullRequests) {
            user.requests.push(pullRequest);

            return user.save();
        }
    }));
}

async function updateStatusAndComment(args) {
    try {
        logger.trackEvent('CLAAssistantPullRequestUpdateStatusAndCommentStart', { deliveryId: args.deliveryId });
        const [committers] = await promisify(repoService.getPRCommitters.bind(repoService))(args);
        logger.trackEvent('CLAAssistantPullRequestGetPRCommittersSuccess', { deliveryId: args.deliveryId });
        if (!committers || committers.length === 0) {
            throw new Error('Cannot get committers of the pull request');
        }
        const [signed, user_map] = await promisify(cla.check.bind(cla))(args);
        logger.trackEvent('CLAAssistantPullRequestClaCheckSuccess', { deliveryId: args.deliveryId });
        args.signed = signed;
        if (!user_map ||
            (user_map.signed && user_map.signed.length > 0) ||
            (user_map.not_signed && user_map.not_signed.length > 0) ||
            (user_map.unknown && user_map.unknown.length > 0)
        ) {
            await promisify(status.update.bind(status))(args);
        } else {
            await promisify(status.updateForClaNotRequired.bind(status))(args);
        }
        logger.trackEvent('CLAAssistantPullRequestStatusUpdateSuccess', { deliveryId: args.deliveryId });
        if (!signed || !config.server.feature_flag.close_comment) {
            await promisify(pullRequest.badgeComment.bind(pullRequest))(
                args.owner,
                args.repo,
                args.number,
                signed,
                user_map
            );
            logger.trackEvent('CLAAssistantPullRequestCommentUpdateSuccess', { deliveryId: args.deliveryId });
        }
        if (user_map && user_map.not_signed) {
            await promisify(storeRequest)(user_map.not_signed, args.repo, args.owner, args.number);
            logger.trackEvent('CLAAssistantPullRequestStoreUserRequestSuccess', { deliveryId: args.deliveryId });
        }
    } catch (err) {
        if (!args.handleCount || args.handleCount < 2) {
            args.handleCount = args.handleCount ? ++args.handleCount : 1;
            await promiseDelay(10000 * args.handleCount * args.handleDelay);
            await updateStatusAndComment(args);
        } else {
            logger.warn(new Error(err).stack, 'called with args: ', { repo: args.repo, owner: args.owner, number: args.number, handleCount: args.handleCount });
            throw err;
        }
    }
}

async function handleWebHook(args) {
    try {
        logger.trackEvent('CLAAssistantPullRequestHandleWebHookStart', { deliveryId: args.deliveryId });
        args.isClaRequired = await cla.isClaRequired(args);
        logger.trackEvent('CLAAssistantPullRequestIsClaRequiredSuccess', { deliveryId: args.deliveryId });
        if (args.isClaRequired) {
            await updateStatusAndComment(args);
        } else {
            logger.trackEvent('CLAAssistantPullRequestUpdateForClaNotRequiredStart', { deliveryId: args.deliveryId });
            await promisify(status.updateForClaNotRequired.bind(status))(args);
            await promisify(pullRequest.deleteComment.bind(pullRequest))({
                repo: args.repo,
                owner: args.owner,
                number: args.number
            });
            logger.trackEvent('CLAAssistantPullRequestDeleteCommentStart', { deliveryId: args.deliveryId });
        }
    } catch (error) {
        logger.error(error, { repo: args.repo, owner: args.owner, number:args.number, sha: args.sha, signed: args.signed });
        throw error;
    }
}

module.exports = function (req, res) {
    if (['opened', 'reopened', 'synchronize'].indexOf(req.args.action) > -1 && isRepoEnabled(req.args.repository)) {
        const deliveryId = req.headers['x-github-delivery'];
        if (req.args.pull_request && req.args.pull_request.html_url) {
            logger.info(`pull request ${req.args.action} ${req.args.pull_request.html_url} ${deliveryId}`);
        }
        let args = {
            owner: req.args.repository.owner.login,
            repoId: req.args.repository.id,
            repo: req.args.repository.name,
            number: req.args.number,
            deliveryId: deliveryId
        };
        args.orgId = req.args.organization ? req.args.organization.id : req.args.repository.owner.id;
        args.handleDelay = req.args.handleDelay != undefined ? req.args.handleDelay : 1; // needed for unitTests
        let startTime = process.hrtime();

        setTimeout(async function () {
            try {
                const item = await cla.getLinkedItem(args);
                logger.trackEvent('CLAAssistantPullRequestGetLinkedItemSuccess', { deliveryId });
                if (!item) {
                    return logger.info(`Unlinked item ${JSON.stringify(args)}`);
                }
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
                await handleWebHook(args);

                return collectMetrics(req.args.pull_request, startTime, args.signed, req.args.action, args.isClaRequired);
            } catch (e) {
                logger.error(e, 'CLAAssistantHandleWebHookFail', { owner: args.owner, repo: args.repo, number: args.number });
            }
        }, config.server.github.enforceDelay);
    }

    res.status(200).send('OK');
};

function isRepoEnabled(repository) {
    return repository && (repository.private === false || config.server.feature_flag.enable_private_repos);
}

function collectMetrics(pullRequest, startTime, signed, action, isClaRequired, deliveryId) {
    let diffTime = process.hrtime(startTime);
    const logProperty = {
        owner: pullRequest.base.repo.owner.login,
        repo: pullRequest.base.repo.name,
        number: pullRequest.number,
        signed: signed,
        isClaRequired: isClaRequired,
        action: action,
        deliveryId: deliveryId
    };
    logger.trackEvent('CLAAssistantPullRequestDuration', logProperty, { CLAAssistantPullRequestDuration: diffTime[0] * 1000 + Math.round(diffTime[1] / Math.pow(10, 6)) });
    if (action !== 'opened') {
        return;
    }

    return cla.isEmployee(pullRequest.user.id, function (err, isEmployee) {
        if (err) {
            return logger.error(err, 'CLAAssistantCheckEmployeeFail', logProperty);
        }
        logger.trackEvent('CLAAssistantPullRequest', Object.assign(logProperty, { isEmployee: isEmployee }), { CLAAssistantPullRequest: isEmployee ? 0 : 1 });
        if (!isEmployee && isClaRequired) {
            logger.trackEvent(signed ? 'CLAAssistantAlreadySignedPullRequest' : 'CLAAssistantCLARequiredPullRequest', logProperty, signed ? { CLAAssistantAlreadySignedPullRequest: 1 } : { CLAAssistantCLARequiredPullRequest: 1 });
        }
    });
}
