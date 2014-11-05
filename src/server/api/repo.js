// module
var repo = require('../services/repo');

module.exports = {

    check: function(req, done) {
		repo.check(req.args, done);
    },
    create: function(req, done){
		req.args.token = req.user.token;
		repo.create(req.args, done);
	},
	get: function(req, done){
		repo.get(req.args, function(err, repo){
			if (!repo || err || repo.owner !== req.user.login) {
				done(err);
				return;
			}
			done(err, repo);
		});
	},
	update: function(req, done){
		repo.update(req.args, done);
	},
	remove: function(req, done){
		repo.remove(req.args, done);
	}
};
