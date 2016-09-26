// services
var pullRequest = require('../services/pullRequest');
var status = require('../services/status');
var cla = require('../services/cla');
var repoService = require('../services/repo');
var orgService = require('../services/org');
var log = require('../services/logger');


//////////////////////////////////////////////////////////////////////////////////////////////
// Github Pull Request Webhook Handler
//////////////////////////////////////////////////////////////////////////////////////////////

function handleWebHook(args) {
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
                        args.owner,
                        args.repo,
                        args.number,
                        signed,
                        user_map
                    );
                }
            });
        } else {
            log.warn(new Error(err).stack);
            log.warn('called with args: ', args);
        }
    });
}

module.exports = function (req, res) {
	log.debug(req.args.action);
	if (['opened', 'reopened', 'synchronize'].indexOf(req.args.action) > -1) {
		var args = {
            owner: req.args.repository.owner.login,
			repoId: req.args.repository.id,
			repo: req.args.repository.name,
			number: req.args.number
		};
        args.orgId = req.args.organization ? req.args.organization.id : req.args.repository.owner.id;

        orgService.get({ orgId: args.orgId }, function(err, org) {
            if (org) {
                args.token = org.token;
                args.gist = org.gist; //TODO: Test it!!
                if (!org.isRepoExcluded(args.repo)) {
                    handleWebHook(args);
                }
            } else {
                args.orgId = undefined;
                repoService.get(args, function(e, repo){
                    if (repo) {
                        args.token = repo.token;
                        args.gist = repo.gist; //TODO: Test it!!
                        handleWebHook(args);
                    }
                });
            }
        });
	}

    res.status(200).send('OK');
};
