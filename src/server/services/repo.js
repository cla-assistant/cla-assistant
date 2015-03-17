require('../documents/repo');
var mongoose = require('mongoose');
var Repo = mongoose.model('Repo');

//services
var github = require('../services/github');

//services
var url = require('../services/url');

module.exports = {
    check: function(args, done) {
		Repo.findOne({repo: args.repo, owner: args.owner}, function(err, repo){
            done(err, !!repo);
        });
    },
    create: function(args, done){
		Repo.create({repo: args.repo, owner: args.owner, gist: args.gist, token: args.token}, function(err, repo){
            done(err, repo);
        });
    },
    get: function(args, done){
        Repo.findOne({repo: args.repo, owner: args.owner}, function(err, repo){
            done(err, repo);
        });
    },
    getAll: function(args, done){
		Repo.find({$or: args.set}, function(err, repos){
            done(err, repos);
        });
    },
    update: function(args, done){
        Repo.findOne({repo: args.repo, owner: args.owner}, function(err, repo){
            if (err) {
                done(err);
                return;
            }
            repo.gist = args.gist;
            repo.save(done);
        });
    },
    remove: function(args, done){
        Repo.remove({repo: args.repo, owner: args.owner}).exec(done);
    },

    getPRCommitters: function(args, done){
        Repo.findOne({owner: args.owner, repo: args.repo}, function(err, repo){
            var committers = [];

            args.url = url.githubPullRequestCommits(args.owner, args.repo, args.number);
            args.token = repo.token;
            github.direct_call(args, function(err, res){
                if (res.data && !res.data.message) {
                    res.data.forEach(function(commit){
                        if(committers.map(function(c) { return c.name; }).indexOf(commit.committer.login) < 0){
                            committers.push({name: commit.committer.login, id: commit.committer.id});
                        }
                    });
                    done(null, committers);
                } else if (res.data.message) {
                    done(res.data.message);
                }

            });
        });
    }
  //   remove: function(args, done){
		// CLA.remove({repo:24456091}).exec();
		// done('all done');
  //   }
};
