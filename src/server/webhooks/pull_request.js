// services
var pullRequest = require('../services/pullRequest');
var status = require('../services/status');
var cla = require('../services/cla');
var repoService = require('../services/repo');
var log = require('../services/logger');


//////////////////////////////////////////////////////////////////////////////////////////////
// Github Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

module.exports = function (req, res) {
	log.debug(req.args.action);
	if (['opened', 'reopened', 'synchronize'].indexOf(req.args.action) > -1) {
		var args = {
			owner: req.args.repository.owner.login,
			repo: req.args.repository.name,
			number: req.args.number
		};

		repoService.get(args, function(e, repo){
			if (repo) {
				repoService.getPRCommitters(args, function (err, committers) {
					if (!err && committers && committers.length > 0) {
						cla.check(args, function (error, signed, user_map) {
							if (error) {
								log.warn(new Error(error).stack);
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
					} else {
						log.warn(new Error(err).stack);
					}
				});
			}
		});
	}

	// if(req.args.action === 'synchronize') {
	// }

	res.status(200).send('OK');
};
