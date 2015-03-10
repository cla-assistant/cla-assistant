//services
var github = require('../services/github');
var cla = require('../services/cla');
var status = require('../services/status');
var repoService = require('../services/repo');
var url = require('../services/url');
var prService = require('../services/pullRequest');

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
			try{
				var args = {
					obj: 'markdown',
					fun: 'render',
					arg: {
						text: res.files[Object.keys(res.files)[0]].content
					}
				};
			} catch (e){
				console.log(e);
				done(e);
				return;
			}
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

	getLastSignature: function(req, done){
		cla.getRepo(req.args, function(err, repo){
			if (err || !repo) {
				done(err);
				return;
			}
			var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login, gist_url: repo.gist};

			cla.getLastSignature(args, done);
		});
	},

    sign: function(req, done) {
		var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login, user_id: req.user.id};

		cla.sign(args, function(err, signed){
			repoService.get({repo: args.repo, owner: args.owner}, function(err, repo){
				github.direct_call({url: url.githubPullRequests(args.owner, args.repo, 'open'), token: repo.token}, function(err, res){
					if(res && res.data && !err){
						res.data.forEach(function(pullRequest){
							var status_args = {repo: args.repo, owner: args.owner};
							status_args.number = pullRequest.number;
							cla.check(status_args, function(err, all_signed){
								status_args.signed = all_signed;
								status.update(status_args);
								prService.editComment({repo: args.repo, owner: args.owner, number: status_args.number, signed: all_signed});
							});
						});
					}
				});
			});
			done(err, signed);
		});
    },

    getAll: function(req, done){
		cla.getAll(req.args, done);
	},

    check: function(req, done){
		var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login};

		cla.check(args, done);
    }
};
