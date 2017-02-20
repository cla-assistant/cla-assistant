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

var updateStatus = function (args) {
    var status = args.signed ? 'success' : 'pending';
    var description = args.signed ? 'Contributor License Agreement is signed.' : 'Contributor License Agreement is not signed yet.';

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
            context: 'licence/cla',
            noCache: true
        },
        token: args.token
    }, function (error, response) {
        if (error) {
            logger.warn('Error on Create Status, possible cause - wrong token, saved token does not have enough rights: ');
            log(error, response, args);
        }
    });
};

module.exports = {
    update: function (args) {
        if (args && !args.sha) {
            getPR(args, function (err, resp) {
                if (!err && resp && resp.head) {
                    args.sha = resp.head.sha;
                    updateStatus(args);
                }
            });
        } else if (args) {
            updateStatus(args);
        }
    }
};
