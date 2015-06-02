// models
require('../documents/cla');
require('../documents/user');
var https = require('https');
var q = require('q');
var User = require('mongoose').model('User');
var CLA = require('mongoose').model('CLA');

//services
var github = require('../services/github');
var url = require('../services/url');
var repoService = require('../services/repo');
var status = require('../services/status');

module.exports = function(){
	var claService;

	var	checkAll = function (users, args) {
		var deferred = q.defer();
		var all_signed = true;
		var promises = [];
		users.some(function(user){
			args.user = user.name;
			promises.push(claService.get(args, function(err, cla){
					all_signed = !!cla === false ? false : all_signed;
				})
			);
		});
		q.all(promises).then(function(){
			deferred.resolve(all_signed);
		});
		return deferred.promise;
	};


	claService = {
		getGist: function(args, done){
			try{
				var gist_url = args.gist.gist_url || args.gist.url || args.gist;
				var gistArray = gist_url.split('/'); // https://gist.github.com/KharitonOff/60e9b5d7ce65ca474c29

			} catch(ex) {
				done('The gist url "' + gist_url + '" seems to be invalid');
				return;
			}

			var path = '/gists/';
			var id = gistArray[gistArray.length - 1];
			path += id;
			if (args.gist.gist_version) {
				path = path + '/' + args.gist.gist_version;
			}

			var req = {};
			var data = '';
			var options = {
				hostname: config.server.github.api,
				port: 443,
				path: path,
				method: 'GET',
				headers: {
					'Authorization': 'token ' + args.token,
					'User-Agent': 'cla-assistant'
				}
			};

			req = https.request(options, function(res){
				res.on('data', function(chunk) { data += chunk; });
				res.on('end', function(){
					data = JSON.parse(data);
					done(null, data);
				});
			});

			req.end();
			req.on('error', function (e) {
				done(e);
			});
		},
		getRepo: function(args, done) {
			repoService.get(args, function(err, repo){
				done(err, repo);
			});
		},

		get: function(args, done) {

			var deferred = q.defer();
			CLA.findOne({repo: args.repo, owner: args.owner, user: args.user, gist_url: args.gist, gist_version: args.gist_version}, function(err, cla){
				deferred.resolve();
				done(err, cla);
			});
			return deferred.promise;
		},

		getLastSignature: function(args, done) {
			CLA.findOne({repo: args.repo, owner: args.owner, user: args.user, gist_url: args.gist_url}, {'gist_url': '*', 'gist_version': '*'}, {select: {'created_at': -1}}, function(err, cla){
				done(err, cla);
			});
		},


		check: function(args, done){
			var self = this;

			this.getRepo(args, function(err, repo){
				if (err || !repo || !repo.gist) {
					done(err, false);
					return;
				}

				args.gist = repo.gist;

				self.getGist(repo, function(err, gist){
					if (err || !gist.history) {
						done(err, false);
						return;
					}
					args.gist_version = gist.history[0].version;

					if (args.user) {
						self.get(args, function(err, cla){
							done(err, !!cla);
						});
					}
					else if (args.number) {
						repoService.getPRCommitters(args, function(err, committers){
							checkAll(committers, args).then(function(all_signed){
								done(null, all_signed);
							});
						});
					}
				});
			});
		},

		sign: function(args, done) {
			var now = new Date();
			var self = this;

			self.check(args, function(err, signed){
				if (err || signed) {
					done(err);
					return;
				}

				self.getRepo(args, function(err, repo){
					if (err || !repo) {
						done(err);
						return;
					}

					args.gist_url = repo.gist;

					self.create(args, function(err){
						if (err) {
							done(err);
							return;
						}
						done(err, 'done');
					});
				});
			});
		},

		getSignedCLA: function(args, done){
			CLA.find({user: args.user}, function(err, clas){
				done(err, clas);
				return;
			});
		},

		getAll: function(args, done) {
			var self = this;
			var valid = [];
			if (args.gist.gist_version) {
				CLA.find({repo: args.repo, owner: args.owner, gist_url: args.gist.gist_url, gist_version: args.gist.gist_version}, function(err, clas){
					done(err, clas);
				});
			} else {
				CLA.find({repo: args.repo, owner: args.owner, gist_url: args.gist.gist_url}, function(err, clas){
					if (!clas) {
						done(err, clas);
						return;
					}
					self.getRepo(args, function(err, repo){
						self.getGist(repo, function(err, gist){
							if (!gist) {
								done(err, gist);
								return;
							}
							clas.forEach(function(cla){
								if (gist.history.length > 0 && gist.history[0].version === cla.gist_version) {
									valid.push(cla);
								}
							});
							done(err, valid);
						});
					});
				});
			}

		},
		create: function(args, done){
			var now = new Date();

			CLA.create({repo: args.repo, owner: args.owner, user: args.user, gist_url: args.gist, gist_version: args.gist_version, created_at: now}, function(err, res){
				done(err, res);
			});
		}
	};
	return claService;
}();
