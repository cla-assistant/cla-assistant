// //api
// var github_api = require('../api/github');

// services
var url = require('../services/url');
var github = require('../services/github');
var logger = require('../services/logger');

var log = function (err, res, args) {
    if (err) {
        logger.warn(new Error(err));
    }
    logger.info('Error: ', err, '; result: ', res, '; Args: ', args);
};

var getPR = function (args, cb) {
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

var getStatuses = function (args, done) {
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

var createStatus = function (args, context, description, done) {
    github.call({
        obj: 'repos',
        fun: 'createStatus',
        arg: {
            owner: args.owner,
            repo: args.repo,
            sha: args.sha,
            state: args.state,
            description: description,
            target_url: args.noUrl ? undefined : url.claURL(args.owner, args.repo, args.number),
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

var findStatusToBeChanged = function (args, done) {
    getStatuses(args, function (error, response) {
        var statuses = '';
        var description = args.signed ? 'Contributor License Agreement is signed.' : 'Contributor License Agreement is not signed yet.';

        var status = {
            context: 'license/cla',
            description: description
        };
        try {
            statuses = JSON.parse(response);
        } catch (error) {
            statuses = response;
        }
        var statString = JSON.stringify(statuses);
        if (statString.includes('licence/cla') && args.state == 'success') { // temporary fix if both contexts are there
            var shouldBeChanged = false;
            statuses.some(function findClaStatusToChange(s) {
                if (s.context.match(/licence\/cla/g)) {
                    shouldBeChanged = s.state === 'pending';
                    return true;
                }
            });
            if (shouldBeChanged) {
                createStatus(args, 'licence/cla', status.description);
            }
        }
        if (statuses) {
            statuses.some(function findClaStatusToChange(s) {
                if (s.context.match(/license\/cla/g)) {
                    status = s.state !== args.state ? status : undefined;
                    return true;
                }
            });
        }

        done(status);
    });
};

var updateStatus = function (args, done) {
    args.state = args.signed ? 'success' : 'pending';

    findStatusToBeChanged(args, function (status) {
        if (!status) {
            if (typeof done === 'function') {
                done();
            }
            return;
        }
        createStatus(args, status.context, status.description, done);
    });
};

var deleteStatus = function (args, done) {
    // Github api don't support delete status. We override previous one.
    args.state = 'success';
    args.noUrl = true;
    var description = 'No need to sign Contributor License Agreement.';
    var context = 'license/cla';
    createStatus(args, context, description, done);
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

    delete: function (args, done) {
        if (args && !args.sha) {
            getPR(args, function (err, resp) {
                if (!err && resp && resp.head) {
                    args.sha = resp.head.sha;
                    deleteStatus(args, done);
                } else {
                    if (typeof done === 'function') {
                        done(err);
                    }
                }
            });
        } else if (args) {
            deleteStatus(args, done);
        }
    }
};