// services
var pullRequest = require('../services/pullRequest');
var status = require('../services/status');
var cla = require('../services/cla');
var repoService = require('../services/repo');
var log = require('../services/logger');


//////////////////////////////////////////////////////////////////////////////////////////////
// Github Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function(req, res) {
	log.debug(req.args.action);
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

		repoService.getPRCommitters(args, function(e, committers){
			if(!e && committers && committers.length > 0){
				cla.check(args, function(err, signed, user_map){
					if (err) {
						log.warn(err);
					}
					args.signed = signed;
					status.update(args);
					if (!signed) {

						pullRequest.badgeComment(
							req.args.repository.owner.login,
							req.args.repository.name,
							req.args.repository.id,
							req.args.number,
							signed,
							user_map
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
