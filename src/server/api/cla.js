//services
var github = require('../services/github');
var cla = require('../services/cla');

module.exports = {
	getGist: function(req, done){
		cla.getRepo(req.args, function(err, repo){
			if (err || !repo) {
				done(err);
				return;
			}
			var gist_args = {gist_url: repo.gist};
			gist_args = req.args.gist ? req.args.gist : gist_args;

			cla.getGist({token: repo.token, gist: gist_args}, done);
		});
	},

	get: function(req, done){
		this.getGist(req, function(err, res){
			if (err || !res) {
				done(err);
				return;
			}
			var args = {
				obj: 'markdown',
				fun: 'render',
				arg: {
					text: res.files[Object.keys(res.files)[0]].content
				}
			};
			if (req.user && req.user.token) {
				args.token = req.user.token;
			}
			github.call(args, function(err, result) {
				if (result.statusCode !== 200 && err){
					done(err);
				}
				if (result.body) {
					done(null, {raw: result.body});
				} else {
					done(null, {raw: result.data});
				}

			});
		});
	},

    sign: function(req, done) {
		var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login, user_id: req.user.id};

		cla.sign(args, done);
    },

    getAll: function(req, done){
		cla.getAll(req.args, done);
	},

    check: function(req, done){
		var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login};

		cla.check(args, done);
    }
};
