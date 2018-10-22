// //api
// var github_api = require('../api/github');

// services
let url = require('../services/url');
let github = require('../services/github');
let logger = require('../services/logger');

let log = function (err, res, args) {
    if (err) {
        logger.warn(new Error(err));
    }
    logger.info('Error: ', err, '; result: ', res, '; Args: ', args);
};

let getPR = function (args, cb) {
    github.call({
        obj: 'pullRequests',
        fun: 'get',
        arg: {
            owner: args.owner,
            repo: args.repo,
            number: args.number,
            noCache: true
        },
        token: args.token
    }, cb);
};

let getStatuses = function (args, done) {
    github.call({
        obj: 'repos',
        fun: 'getStatuses',
        arg: {
            owner: args.owner,
            repo: args.repo,
            ref: args.sha,
            noCache: true
        },
        token: args.token
    }, done);
};

let getCombinedStatus = function (args, done) {
    github.call({
        obj: 'repos',
        fun: 'getCombinedStatusForRef',
        arg: {
            owner: args.owner,
            repo: args.repo,
            ref: args.sha,
            noCache: true
        },
        token: args.token
    }, done);
};

let createStatus = function (args, context, description, state, target_url, done) {
    github.call({
        obj: 'repos',
        fun: 'createStatus',
        arg: {
            owner: args.owner,
            repo: args.repo,
            sha: args.sha,
            state: state,
            description: description,
            target_url: target_url,
            context: context,
            noCache: true
        },
        token: args.token
    }, function (error, response) {
        if (error) {
            logger.warn('Error on Create Status, possible cause - wrong token, saved token does not have enough rights: ');
            log(error, response, args);
        }
        if (typeof done === 'function') {
            done(error, response);
        }
    });
};

let findStatusToBeChanged = function (args, done) {
    getStatuses(args, function (error, response) {
        let statuses = '';
        let description = args.signed ? 'Contributor License Agreement is signed.' : 'Contributor License Agreement is not signed yet.';

        let status = {
            context: 'license/cla',
            description: description,
            state: args.signed ? 'success' : 'pending',
            target_url: url.claURL(args.owner, args.repo, args.number)
        };
        try {
            statuses = JSON.parse(response);
        } catch (error) {
            statuses = response;
        }
        let statString = JSON.stringify(statuses);
        if (statString.includes('licence/cla') && status.state == 'success') { // temporary fix if both contexts are there
            let shouldBeChanged = false;
            statuses.some(function findClaStatusToChange(s) {
                if (s.context.match(/licence\/cla/g)) {
                    shouldBeChanged = s.state === 'pending';

                    return true;
                }
            });
            if (shouldBeChanged) {
                createStatus(args, 'licence/cla', status.description, status.state, status.target_url);
            }
        }
        if (statuses) {
            statuses.some(function findClaStatusToChange(s) {
                if (s.context.match(/license\/cla/g)) {
                    status = s.state !== status.state ? status : undefined;

                    return true;
                }
            });
        }

        done(status);
    });
};

let findClaStatus = function (args, done) {
    getCombinedStatus(args, function (err, resp) {
        if (err) {
            return done(err);
        }
        let claStatus = null;
        resp.statuses.some(function (status) {
            if (status.context.match(/license\/cla/g)) {
                claStatus = status;

                return true;
            }
        });

        return done(null, claStatus);
    });
};

let updateStatus = function (args, done) {
    findStatusToBeChanged(args, function (status) {
        if (!status) {
            if (typeof done === 'function') {
                done();
            }

            return;
        }
        createStatus(args, status.context, status.description, status.state, status.target_url, done);
    });
};

let getPullRequestHeadShaIfNeeded = function (args, done) {
    if (args.sha) {
        return done(null, args);
    }
    getPR(args, function (err, resp) {
        if (!resp || !resp.head) {
            err = new Error('Cannot get pull request head.');
        } else {
            args.sha = resp.head.sha;
        }
        done(err, args);
    });
};

let doneIfNeeded = function (done, err, result) {
    if (typeof done === 'function') {
        return done(err, result);
    }
};

let updateStatusIfNeeded = function (args, status, allowAbsent, done) {
    if (!status) {
        return doneIfNeeded(done, new Error('Status is required for updateStatusIfNeeded.'));
    }
    getPullRequestHeadShaIfNeeded(args, function (err, argsWithSha) {
        if (err) {
            log(err, argsWithSha, args);

            return doneIfNeeded(done, err);
        }
        findClaStatus(args, function (err, claStatus) {
            if (err) {
                return doneIfNeeded(done, err);
            }
            if (!claStatus && allowAbsent) {
                return doneIfNeeded(done, null);
            }
            if (!claStatus || claStatus.state !== status.state || claStatus.description !== status.description || claStatus.target_url !== status.target_url) {
                return createStatus(argsWithSha, status.context, status.description, status.state, status.target_url, done);
            }
            doneIfNeeded(done);
        });
    });
};

module.exports = {
    update: function (args, done) {
        if (args && !args.sha) {
            getPR(args, function (err, resp) {
                if (!err && resp && resp.head) {
                    args.sha = resp.head.sha;
                    updateStatus(args, done);
                } else {
                    if (typeof done === 'function') {
                        done(err);
                    }
                }
            });
        } else if (args) {
            updateStatus(args, done);
        }
    },

    updateForNullCla: function (args, done) {
        let status = {
            context: 'license/cla',
            state: 'success',
            description: 'No Contributor License Agreement required.',
            target_url: null
        };
        updateStatusIfNeeded(args, status, true, done);
    },

    updateForClaNotRequired: function (args, done) {
        let status = {
            context: 'license/cla',
            state: 'success',
            description: 'All CLA requirements met.',
            target_url: null
        };
        updateStatusIfNeeded(args, status, false, done);
    }
};