// modules
var express = require('express');

// models
var Repo = require('mongoose').model('Repo');
var CLA = require('mongoose').model('CLA');

var router = express.Router();

//services
var logger = require('./../services/logger');

router.post('/count/*', function(req, res, next){
	//No token is sent by slack :(
	// if (req.body.token && config.server.slack.token.match(req.body.token)) {
		next();
	// }
	// res.status(404);
});

router.all('/count/repos', function(req, res) {
	Repo.find({}, function(err, repos) {
		if (err) {
			logger.info(err);
		}
		res.set('Content-Type', 'application/json');
		var list = '';
		if (req.query.last) {
			var fullName = repos[repos.length - 1].owner + '/' + repos[repos.length - 1].repo;
			list = '\n Newest repo is https://github.com/' + fullName;
		} else {
			repos.forEach(function(repo, i){
				list += '\n ' + ++i + '. ' + repo.owner + '/' + repo.repo;
			});
		}
        res.send(JSON.stringify({
            count: repos.length,
            text: 'There are ' + repos.length + ' registered repositories!' + list,
            mrkdwn_in: ['text']
        }));
    });
});

router.all('/count/clas', function(req, res) {
	CLA.aggregate( [{'$group': { '_id': { repo: '$repo',
										owner: '$owner',
										user: '$user'}
	}}], function(err, data){
		if (err) {
			logger.info(err);
		}
		res.set('Content-Type', 'application/json');
		var text = {text: 'There are ' + data.length + ' signed CLAs!'};
		text.attachments = [];
		var list = {};
		if (req.query.detailed) {
			data.forEach(function(cla){
				list[cla._id.owner + '/' + cla._id.repo] = list[cla._id.owner + '/' + cla._id.repo] ? list[cla._id.owner + '/' + cla._id.repo] : [];
				list[cla._id.owner + '/' + cla._id.repo].push(cla._id.user);
				// list += '\n ' + cla._id.user + ' is contributing to ' + cla._id.owner + '/' + cla._id.repo;
			});
			for (var repository in list){
				var users = list[repository];
				text.attachments.push(
					{
						title: repository,
						// pretext: Pretext _supports_ mrkdwn,
						text: 'CLA is signed by ' + users.length + ' committer(s): ' + JSON.stringify(users),
						mrkdwn_in: ['title']
					}
				);
			}
		}
		// text = list ? text + list : text;
		res.send(JSON.stringify({
			count: data.length,
			text: text.text,
			attachments: text.attachments
		}));
	});
});

module.exports = router;
