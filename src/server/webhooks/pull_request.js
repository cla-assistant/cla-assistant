var merge = require('merge');

// models
var User = require('mongoose').model('User');
var Repo = require('mongoose').model('Repo');

// services
var github = require('../services/github');
var pullRequest = require('../services/pullRequest');
var status = require('../services/status');
var cla = require('../services/cla');
var repoService = require('../services/repo');


//////////////////////////////////////////////////////////////////////////////////////////////
// Github Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(req, res) {
	var pull_request = req.args.pull_request;

	console.log(req.args.action);
	if( ['opened', 'reopened', 'synchronize'].indexOf(req.args.action) > -1) {
		var args = {
			owner: req.args.repository.owner.login,
			repo: req.args.repository.name,
			number: req.args.number
		};

		// var notification_args = {
		// 	user: req.args.repository.owner.login,
		// 	repo: req.args.repository.name,
		// 	number: req.args.number,
		// 	sender: req.args.sender,
		// 	url: url.reviewPullRequest(req.args.repository.owner.login, req.args.repository.name, req.args.number)
		// };

		// notification.sendmail(
		//         'pull_request_opened',
		//         req.args.repository.owner.login,
		//         req.args.repository.name,
		//         req.args.repository.id,
		//         user.token,
		//         req.args.number,
		//         notification_args
		// );

		repoService.getPRCommitters(args, function(err, committers){
			if(!err && committers && committers.length > 0){
				cla.check(args, function(err, signed){
					args.signed = signed;
					status.update(args);
					if (!signed) {

						pullRequest.badgeComment(
							req.args.repository.owner.login,
							req.args.repository.name,
							req.args.repository.id,
							req.args.number
						);
					}
				});
			}
		});
	}

  // if(req.args.action === 'synchronize') {

  // }

	res.status(200).send('OK');
};
