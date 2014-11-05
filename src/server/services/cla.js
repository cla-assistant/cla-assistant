// var CLA = require('mongoose').model('CLA');
require('../documents/cla');
var mongoose = require('mongoose');
var CLA = mongoose.model('CLA');

var guid = function(){
	return 'xxxxxxxxxxxxx'.replace(/[x]/g, function(c) {
		var r = Math.floor(Math.random() * 10);
		return r.toString();
	});
};

module.exports = {
    check: function(args, done) {
		CLA.findOne({repo: args.repo, user: args.user, href: args.gist}, function(err, cla){
            done(err, !!cla);
        });
    },
    create: function(args, done){
		var now = new Date();

		var cla = new CLA({uuid: guid(), repo: args.repo, user: args.user, href: args.gist, created_at: now});
		cla.save(done);
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
