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

var hasDeprecatedStatus = function (args, done) {
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
    }, function (error, response) {
        var statuses = '';
        try {
            statuses = JSON.stringify(response);
        } catch (error) {
            statuses = response;
        }
        done(error ? false : statuses.includes('licence/cla'));
    });
};

var updateStatus = function (args, done) {
    var status = args.signed ? 'success' : 'pending';
    var description = args.signed ? 'Contributor License Agreement is signed.' : 'Contributor License Agreement is not signed yet.';

    hasDeprecatedStatus(args, function (deprecated) {
        github.call({
            obj: 'repos',
            fun: 'createStatus',
            arg: {
                owner: args.owner,
                repo: args.repo,
                sha: args.sha,
                state: status,
                description: description,
                target_url: url.claURL(args.owner, args.repo, args.number),
                context: deprecated ? 'licence/cla' : 'license/cla',
                noCache: true
            },
            token: args.token
        }, function (error, response) {
            console.log('repos createStatus');

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
                console.log('getPR called back');
                if (!err && resp && resp.head) {
                    args.sha = resp.head.sha;
                    console.log('call updateStatus 1');
                    updateStatus(args, done);
                } else {
                    console.log('call updateStatus 1 error', err, resp);
                    if (typeof done === 'function') {
                        done(err);
                    }
                }
            });
        } else if (args) {
            console.log('call updateStatus 2');
            updateStatus(args, done);
        }
    }
};
