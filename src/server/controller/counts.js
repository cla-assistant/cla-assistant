// modules
var express = require('express');

// models
var Repo = require('mongoose').model('Repo');
var Org = require('mongoose').model('Org');
var CLA = require('mongoose').model('CLA');

var router = express.Router();

//services
var logger = require('./../services/logger');
var github = require('./../services/github');

router.post('/count/*', function (req, res, next) {
	//No token is sent by slack :(
	// if (req.body.token && config.server.slack.token.match(req.body.token)) {
	next();
	// }
	// res.status(404);
});

router.all('/count/repos', function (req, res) {
	Repo.find({}, function (err, repos) {
		if (err) {
			logger.info(err);
		}
		res.set('Content-Type', 'application/json');
		var list = '';
		if (req.query.last && repos.length > 0) {
			var fullName = repos[repos.length - 1].owner + '/' + repos[repos.length - 1].repo;
			list = '\n Newest repo is https://github.com/' + fullName;
		} else if (repos.length > 0){
			repos.forEach(function (repo, i) {
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

router.all('/count/orgs', function (req, res) {
	Org.find({}, function (err, orgs) {
		if (err) {
			logger.info(err);
		}
		res.set('Content-Type', 'application/json');
		var list = '';
		if (req.query.last && orgs.length > 0) {
			var orgName = orgs[orgs.length - 1].org;
			list = '\n Newest org is https://github.com/' + orgName;
		} else if (orgs.length > 0){
			orgs.forEach(function (org, i) {
				list += '\n ' + ++i + '. ' + org.org;
			});
		}
		res.send(JSON.stringify({
			count: orgs.length,
			text: 'There are ' + orgs.length + ' registered organizations!' + list,
			mrkdwn_in: ['text']
		}));
	});
});

router.all('/count/clas', function (req, res) {
	if (req.query.last) {
		CLA.find().sort({
			'created_at': -1
		}).limit(1).exec(function (err, cla) {
			if (err) {
				return;
			}
			res.set('Content-Type', 'application/json');
			var fullName = cla[0].owner + '/' + cla[0].repo;

			res.send(JSON.stringify({
				text: cla[0].user + ' signed a CLA for https://github.com/' + fullName
			}));
		});
	} else {
		CLA.aggregate([{
			'$group': {
				'_id': {
					repo: '$repo',
					owner: '$owner',
					user: '$user'
				}
			}
		}], function (err, data) {
			if (err) {
				logger.info(err);
			}
			res.set('Content-Type', 'application/json');
			var text = {
				text: 'There are ' + data.length + ' signed CLAs!'
			};
			text.attachments = [];
			var list = {};
			if (req.query.detailed) {
				data.forEach(function (cla) {
					list[cla._id.owner + '/' + cla._id.repo] = list[cla._id.owner + '/' + cla._id.repo] ? list[cla._id.owner + '/' + cla._id.repo] : [];
					list[cla._id.owner + '/' + cla._id.repo].push(cla._id.user);
					// list += '\n ' + cla._id.user + ' is contributing to ' + cla._id.owner + '/' + cla._id.repo;
				});
				for (var repository in list) {
					var users = list[repository];
					text.attachments.push({
						title: repository,
						// pretext: Pretext _supports_ mrkdwn,
						text: 'CLA is signed by ' + users.length + ' committer(s): ' + JSON.stringify(users),
						mrkdwn_in: ['title']
					});
				}
			}
			// text = list ? text + list : text;
			res.send(JSON.stringify({
				count: data.length,
				text: text.text,
				attachments: text.attachments
			}));
		});
	}
});

router.all('/count/stars', function (req, res) {
	github.call({
		obj: 'repos',
		fun: 'get',
		arg: {
			user: 'cla-assistant',
			repo: 'cla-assistant'
		},
		basicAuth: {
			user: config.server.github.user,
			pass: config.server.github.pass
		}
	}, function(err, resp){
		res.send(JSON.stringify({
			count: resp.stargazers_count
		}));
	});
});
module.exports = router;
