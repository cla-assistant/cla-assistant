// models
require('../documents/cla');
require('../documents/user');
var User = require('mongoose').model('User');
var CLA = require('mongoose').model('CLA');

var github = require('../services/github');
var url = require('../services/url');
var repoService = require('../services/repo');
var status = require('../services/status');

module.exports = {
	getGist: function(repo, done){
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
	},
	getRepo: function(args, done) {
		repoService.get(args, function(err, repo){
			done(err, repo);
		});
	},

    get: function(args, done) {
		CLA.findOne({repo: args.repo, owner: args.owner, user: args.user, href: args.gist}, function(err, cla){
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

			self.get(args, function(err, cla){
				if (!cla) {
					done(err, !!cla);
					return;
				}
				self.getGist(repo, function(err, gist){
					var gistTime = new Date(gist.updated_at).getTime();
					var claTime = new Date(cla.created_at).getTime();
					if (gistTime <= claTime) {
						done(err, !!cla);
					} else {
						done(err, !cla);
					}
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

				args.href = repo.gist;

				self.create(args, function(){
					User.findOne({uuid: args.user_id}, function(err, user){
						if (!err) {
							var number;
							try{
								user.requests.forEach(function(request){
									status.update({
										user: args.user,
										owner: args.owner,
										repo_uuid: request.repo.id,
										repo: request.repo.name,
										sha: request.sha,
										signed: true
									});
									number = request.number;
								});

								user.requests.length = 0;
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
		CLA.find({repo: args.repo, owner: args.owner, href: args.gist}, function(err, clas){
            done(err, clas);
        });
    },
    create: function(args, done){
		var guid = function(){
			return 'xxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
				var r = Math.floor(Math.random() * 10);
				return r.toString();
			});
		};

		var now = new Date();

		CLA.create({uuid: guid(), repo: args.repo, owner: args.owner, user: args.user, href: args.gist, created_at: now}, done);

		// var cla = new CLA({uuid: guid(), repo: args.repo, owner: args.owner, user: args.user, href: args.gist, created_at: now});
		// cla.save(done);
    },
    remove: function(args, done){
		var string = '';
		CLA.where('uuid').gte(1).exec(function(err, data){
			console.log(data);
			data.forEach(function(entry){
				CLA.remove({uuid: entry.uuid}).exec();
				string = string + '; repo: ' + entry.repo + ' user: ' + entry.user;
			});
			done(string);
		});
    }
};
