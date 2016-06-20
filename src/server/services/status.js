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

module.exports = {
  update: function (args) {
    args.url = url.githubPullRequest(args.owner, args.repo, args.number);

    github.direct_call(args, function (err, resp) {
      if (!err && resp && resp.data.head) {
        args.sha = resp.data.head.sha;

        var status = args.signed ? 'success' : 'pending';
        var description = args.signed ? 'Contributor License Agreement is signed.' : 'Contributor License Agreement is not signed yet.';

        github.call({
          obj: 'repos',
          fun: 'createStatus',
          arg: {
            user: args.owner,
            repo: args.repo,
            sha: args.sha,
            state: status,
            description: description,
            target_url: url.claURL(args.owner, args.repo, args.number),
            context: 'licence/cla'
          },
          token: args.token
        }, function (error, response) {
          if (error) {
            logger.warn('Error on Create Status, possible cause - wrong token, saved token does not have enough rights: ');
            log(error, response, args);
          }
        });
      } else {
        // logger.warn('Get PR: ');
        // log(err, resp, args);
      }
    });
  }
};
