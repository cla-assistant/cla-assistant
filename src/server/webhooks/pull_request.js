// models
var User = require('mongoose').model('User');
var CLA = require('mongoose').model('CLA');
// services
var github = require('../services/github');
var pullRequest = require('../services/pullRequest');
var status = require('../services/status');
var cla = require('../services/cla');


//////////////////////////////////////////////////////////////////////////////////////////////
// Github Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(req, res) {
	var pull_request = req.args.pull_request;

	if(req.args.action === 'opened') {
		var args = {
			user: pull_request.user.id,
			owner: req.args.repository.owner.login,
			repo: req.args.repository.name,
			repo_uuid: req.args.repository.id,
			sha: req.args.pull_request.head.sha,
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


		User.findOne({ uuid: pull_request.user.id }, function(err, user) {
			if (err) {
				console.log(err);
				return;
			}

			cla.check({repo: args.repo, user: args.user}, function(err, signed){
				if (!signed && !err) {

					if(user) {
						user.requests.push({
							id: pull_request.id,
							url: pull_request.url,
							number: req.args.number,
							sha: pull_request.head.sha,
							repo: pull_request.base.repo
						});
					} else {
						user = new User({
							uuid: pull_request.user.id,
							requests: [{
								id: pull_request.id,
								url: pull_request.url,
								number: req.args.number,
								sha: pull_request.head.sha,
								repo: pull_request.base.repo
							}]
						});
					}
					user.save();

					status.update(args);

					pullRequest.badgeComment(
						req.args.repository.owner.login,
						req.args.repository.name,
						req.args.repository.id,
						req.args.number
					);
				}
			});
		});
	}

  // if(req.args.action === 'synchronize') {

  // }

	res.status(200).send('OK');
};
