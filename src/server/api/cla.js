//services
var github = require('../services/github');
var cla = require('../services/cla');

module.exports = {
	get: function(req, done){
		cla.getRepo(req.args, function(err, repo){
			if (err || !repo) {
				done(err);
				return;
			}
			cla.getGist(repo, function(err, res){
				if (err || !res) {
					done(err);
					return;
				}
				github.call({
					obj: 'markdown',
					fun: 'render',
					arg: {
						text: res.files[Object.keys(res.files)[0]].content
					}
				}, function(err, result) {
					if (result.statusCode !== 200 && err){
						done(err);
					}
					done(null, {raw: result.body});
				});
			});
		});
	},

    sign: function(req, done) {
		var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login};

		cla.sign(args, done);
    },

    getAll: function(req, done){
		cla.getAll(req.args, done);
	},

    check: function(req, done){
		var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login};

		cla.check(args, done);
    },

    remove: function(req, done) {
		cla.remove(req.args, done);
    }
};
