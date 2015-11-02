require('../documents/repo');
var mongoose = require('mongoose');
var Repo = mongoose.model('Repo');

//services
var github = require('../services/github');
var logger = require('../services/logger');

//services
var url = require('../services/url');

module.exports = {
	all: function (done) {
		Repo.find({}, function (err, repos) {
			done(err, repos);
		});
	},

	check: function (args, done) {
		Repo.findOne({
			repo: args.repo,
			owner: args.owner
		}, function (err, repo) {
			done(err, !!repo);
		});
	},
	create: function (args, done) {
		Repo.create({
			repo: args.repo,
			owner: args.owner,
			gist: args.gist,
			token: args.token
		}, function (err, repo) {
			done(err, repo);
		});
	},
	get: function (args, done) {
		Repo.findOne({
			repo: args.repo,
			owner: args.owner
		}, function (err, repo) {
			done(err, repo);
		});
	},
	getAll: function (args, done) {
		Repo.find({
			$or: args.set
		}, function (err, repos) {
			done(err, repos);
		});
	},
	update: function (args, done) {
		Repo.findOne({
			repo: args.repo,
			owner: args.owner
		}, function (err, repo) {
			if (err) {
				done(err);
				return;
			}
			repo.gist = args.gist;
			repo.save(done);
		});
	},
	remove: function (args, done) {
		Repo.remove({
			repo: args.repo,
			owner: args.owner
		}).exec(done);
	},

	getPRCommitters: function (args, done) {
		var callGithub = function (arg) {
			var committers = [];

			github.direct_call(arg, function (err, res) {
				if (err) {
					logger.info(new Error(err).stack);
				}
				if (res.data && !res.data.message) {
					res.data.forEach(function (commit) {
						try {
							var committer = commit.committer || commit.commit.committer;
						} catch (error) {
							logger.warn('Problem on PR ', url.githubPullRequest(arg.owner, arg.repo, arg.number));
							logger.warn(new Error('commit info seems to be wrong; ' + error).stack);
							return;
						}
						var user = {
							name: committer.login || committer.name,
							id: committer.id || ''
						};
						if (committers.length === 0 || committers.map(function (c) {
								return c.name;
							}).indexOf(user.name) < 0) {
							committers.push(user);
						}
					});
					done(null, committers);
				} else if (res.data.message) {
					logger.info(new Error(res.data.message).stack);
					logger.info('getPRCommitters with arg: ', arg);

					arg.count = arg.count ? arg.count + 1 : 1;
					if (res.data.message === 'Not Found' && arg.count < 3) {
						setTimeout(function () {
							callGithub(arg);
						}, 1000);
					} else {
						done(res.data.message);
					}
				}

			});
		};

		Repo.findOne({
			owner: args.owner,
			repo: args.repo
		}, function (e, repo) {
			if (e || !repo) {
				var errorMsg = e;
				errorMsg += 'with following arguments: ' + JSON.stringify(args);
				logger.error(new Error(errorMsg).stack);
				done(errorMsg);
				return;
			}

			args.url = url.githubPullRequestCommits(args.owner, args.repo, args.number);
			args.token = repo.token;

			callGithub(args);
		});
	},

	getUserRepos: function (args, done) {
		var that = this;
		var affiliation = args.affiliation ? args.affiliation : 'owner,organization_member';
		github.direct_call({
			url: 'https://api.github.com/user/repos?per_page=100;affiliation=' + affiliation,
			token: args.token
		}, function (err, res) {
			if (!res.data || res.data.length < 1 || res.data.message) {
				err = res.data && res.data.message ? res.data.message : err;
				done(err, null);
				return;
			}

			var repoSet = [];
			res.data.forEach(function (githubRepo) {
				repoSet.push({
					owner: githubRepo.owner.login,
					repo: githubRepo.name
				});
			});
			that.getAll({
				set: repoSet
			}, function (error, result) {
				done(error, result);
			});
		});
	}
};
