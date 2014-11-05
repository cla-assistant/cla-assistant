require('../documents/repo');
var mongoose = require('mongoose');
var Repo = mongoose.model('Repo');

var guid = function(){
	return 'xxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
		var r = Math.floor(Math.random() * 10);
		return r.toString();
	});
};

module.exports = {
    check: function(args, done) {
		Repo.findOne({repo: args.repo, owner: args.owner}, function(err, repo){
            done(err, !!repo);
        });
    },
    create: function(args, done){
		var repo = new Repo({uuid: guid(), repo: args.repo, owner: args.owner, gist: args.gist, token: args.token});
		repo.save(done);
    },
    get: function(args, done){
		Repo.findOne({repo: args.repo, owner: args.owner}, function(err, repo){
            done(err, repo);
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
    }
  //   remove: function(args, done){
		// CLA.remove({repo:24456091}).exec();
		// done('all done');
  //   }
};
