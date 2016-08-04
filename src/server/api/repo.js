// module
var repo = require('../services/repo');
var log = require('../services/logger');

module.exports = {

    check: function(req, done) {
        repo.check(req.args, done);
    },
    create: function(req, done){
        req.args.token = req.user.token;
        var repoArgs = {
            repo: req.args.repo,
            owner: req.args.owner,
            token: req.args.token
        };
        repo.get(repoArgs, function (error, dbRepo) {
            if (dbRepo) {
                repo.getGHRepo(repoArgs, function (err, ghRepo) {
                    if (err || (ghRepo && ghRepo.id != dbRepo.repoId)) {
                        repo.update(req.args, done);
                    } else {
                        done('This repository is already linked.');
                    }
                });
            } else {
                repo.create(req.args, done);
            }
        });
    },
    // get: function(req, done){
    // 	repo.get(req.args, function(err, found_repo){
    // 		if (!found_repo || err || found_repo.owner !== req.user.login) {
    // 			log.warn(err);
    // 			done(err);
    // 			return;
    // 		}
    // 		done(err, found_repo);
    // 	});
    // },
    getAll: function(req, done){
        repo.getAll(req.args, function(err, repos){
            if (err) {
                log.error(err);
            }
            done(err, repos);
        });
    },
    update: function(req, done){
        repo.update(req.args, done);
    },
    remove: function(req, done){
        repo.remove(req.args, done);
    }
};
