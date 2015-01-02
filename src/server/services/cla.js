// models
require('../documents/cla');
require('../documents/user');
var https = require('https');
var User = require('mongoose').model('User');
var CLA = require('mongoose').model('CLA');

//services
var github = require('../services/github');
var url = require('../services/url');
var repoService = require('../services/repo');
var status = require('../services/status');

module.exports = {
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
		CLA.findOne({repo: args.repo, owner: args.owner, user: args.user, gist_url: args.gist, gist_version: args.gist_version}, function(err, cla){
            done(err, cla);
        });
    },

    getLastSignature: function(args, done) {
		CLA.findOne({repo: args.repo, owner: args.owner, user: args.user, gist_url: args.gist_url}, {'gist_url': '*', 'gist_version': '*'}, {select: {'created_at': -1}}, function(err, cla){
            done(err, cla);
        });
    },

    check: function(args, done){
		var self = this;

		this.getRepo(args, function(err, repo){
			if (err || !repo) {
				done(err);
				return;
			}

			args.gist = repo.gist;

			self.getGist(repo, function(err, gist){
				args.gist_version = gist.history[0].version;

				self.get(args, function(err, cla){

					done(err, !!cla);
				});
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

				self.create(args, function(){
					User.findOne({uuid: args.user_id}, function(err, user){
						if (!err) {
							var number;
							try{
								for (var i = user.requests.length - 1; i >= 0; i--) {
									var request = user.requests[i];
									if (request.repo.name === args.repo && request.repo.owner.login === args.owner) {
										status.update({
											user: args.user,
											owner: args.owner,
											repo_uuid: request.repo.id,
											repo: request.repo.name,
											sha: request.sha,
											signed: true
										});
										number = request.number;

										user.requests.splice(i, 1);
									}
								}
								user.save();

								done(err, {pullRequest: number});
							} catch (ex) {
								done(err);
							}
						} else {
							done(err);
						}
					});
				});
			});
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
		var guid = function(){
			return 'xxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
				var r = Math.floor(Math.random() * 10);
				return r.toString();
			});
		};

		var now = new Date();

		CLA.create({uuid: guid(), repo: args.repo, owner: args.owner, user: args.user, gist_url: args.gist, gist_version: args.gist_version, created_at: now}, function(err, res){
			done(err, res);
		});
    }
};
