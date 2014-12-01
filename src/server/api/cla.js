// module
var fs = require('fs');
var request = require('request');

// models
var User = require('mongoose').model('User');

//services
var github = require('../services/github');
var url = require('../services/url');
var cla = require('../services/cla');
var repoService = require('../services/repo');
var status = require('../services/status');

module.exports = {
	getGist: function(req, done){
		repoService.get(req.args, function(err, repo){
			if (err || !repo) {
				done(err);
				return;
			}

			var gistArray = repo.gist.split('/');
			github.call({
				obj: 'gists',
				fun: 'get',
				arg: {
					id: gistArray[gistArray.length - 1]
				},
				token: repo.token
			}, function(err, res){
				if (err || !res) {
					done(err);
					return;
				}
				done(err, res);
			});
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
				}
			}, function(err, result) {
				if (result.statusCode !== 200 && err){
					done(err);
				}
				done(null, {raw: result.body});
			});
		});
	},

    sign: function(req, done) {
		var now = new Date();
		var self = this;

		this.check(req, function(err, signed){

			if (!err && !signed) {
				repoService.get(req.args, function(err, repo){
					if (err || !repo) {
						done(err);
						return;
					}

					var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login, href: repo.gist};
					cla.create(args, function(){
						User.findOne({uuid: req.user.id}, function(err, user){
							if (!err) {
								var number;

								user.requests.forEach(function(request){
									status.update({
										user: req.user.login,
										owner: req.args.owner,
										repo_uuid: request.repo.id,
										repo: request.repo.name,
										sha: request.sha
									}, null);
									number = request.number;
								});

								user.requests.length = 0;
								user.save();

								done(err, {pullRequest: number});
							} else {
								done(err);
							}
						});
					});
				});
			} else if (signed) {
				done(null);
			}
		});
    },

    getAll: function(req, done){
		var self = this;

		this.getGist(req, function(err, gist){
			if (err || !gist) {
				done(err);
				return;
			}
			var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login, href: gist.url};
			cla.getAll(args, done);
		});
    },

    check: function(req, done){
		var self = this;

		this.getGist(req, function(err, gist){
			if (err || !gist) {
				done(err);
				return;
			}

			var args = {repo: req.args.repo, owner: req.args.owner, user: req.user.login, href: gist.url};
			cla.check(args, done);
		});
    },

    remove: function(req, done) {
		cla.remove(req.args, done);
    }
};
