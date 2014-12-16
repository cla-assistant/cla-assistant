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
			cla.getGist({token: repo.token, gist: req.args.gist || repo.gist}, done);
		});
	},

	get: function(req, done){
		this.getGist(req, function(err, res){
			if (err || !res) {
				done(err);
				return;
			}
			github.call({
				obj: 'markdown',
				fun: 'render',
				arg: {
					text: res.files[Object.keys(res.files)[0]].content
				},
				token: req.user.token
			}, function(err, result) {
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
    },

    remove: function(req, done) {
		cla.remove(req.args, done);
    }
};
