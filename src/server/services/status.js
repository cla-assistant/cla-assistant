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

var findStatusToBeChanged = function (args, done) {
    getStatuses(args, function (error, response) {
        var statuses = '';
        var status = { context: 'license/cla' };
        try {
            statuses = JSON.parse(response);
        } catch (error) {
            statuses = response;
        }
        if (statuses) {
            statuses.some(function findClaStatusToChange(s) {
                if (s.context.match(/licen.e\/cla/g)) {
                    status = undefined;
                    status = s.state !== args.state ? s : status;
                    return true;
                }
            });
        }

        done(status);
    });
};

var updateStatus = function (args, done) {
    args.state = args.signed ? 'success' : 'pending';
    var description = args.signed ? 'Contributor License Agreement is signed.' : 'Contributor License Agreement is not signed yet.';

    findStatusToBeChanged(args, function (status) {
        if (!status) {
            if (typeof done === 'function') {
                done();
            }
            return;
        }
        github.call({
            obj: 'repos',
            fun: 'createStatus',
            arg: {
                owner: args.owner,
                repo: args.repo,
                sha: args.sha,
                state: args.state,
                description: description,
                target_url: url.claURL(args.owner, args.repo, args.number),
                context: status.context,
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
    }
};
