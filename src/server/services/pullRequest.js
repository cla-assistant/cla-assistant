var url = require('./url');
var github = require('./github');
var log = require('../services/logger');

var commentText = function (signed, badgeUrl, claUrl, user_map) {
	if (signed) {
		return '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>All committers have signed the CLA.';
	}

	var committersCount = 1;
	if (user_map && user_map.not_signed && user_map.signed) {
		committersCount = user_map.signed.length + user_map.not_signed.length;
	}

	var youAll = (committersCount > 1 ? 'you all' : 'you');
	var text = '[![CLA assistant check](' + badgeUrl + ')](' + claUrl + ') <br/>Thank you for your submission, we really appreciate it. Like many open source projects, we ask that ' + youAll + ' sign our [Contributor License Agreement](' + claUrl + ') before we can accept your contribution.<br/>';

	if (committersCount > 1) {
		text += '**' + user_map.signed.length + '** out of **' + (user_map.signed.length + user_map.not_signed.length) + '** committers have signed the CLA.<br/>';
		user_map.signed.forEach(function (signee) {
			text += '<br/>:white_check_mark: ' + signee;
		});
		user_map.not_signed.forEach(function (signee) {
			text += '<br/>:x: ' + signee;
		});
	}

	if (user_map && user_map.unknown && user_map.unknown.length > 0) {
		var seem = (user_map.unknown.length > 1 ? 'seem' : 'seems');
		text += '<hr/>**' + user_map.unknown.join(', ') + '** ' + seem + ' not to be a GitHub user.';
		text += ' You need a GitHub account to be able to sign the CLA. If you have already a GitHub account, please [add the email address used for this commit to your account](https://help.github.com/articles/why-are-my-commits-linked-to-the-wrong-user/#commits-are-not-linked-to-any-user).';
	}
	return text;
};

module.exports = {
	badgeComment: function (owner, repo, pullNumber, signed, user_map) {
		var badgeUrl = url.pullRequestBadge(signed);

		this.getComment({
			repo: repo,
			owner: owner,
			number: pullNumber
		}, function (error, comment) {
			// repoService.get({
			// 	repo: repo,
			// 	owner: owner
			// }, function (err) {
			// 	if (err) {
			// 		log.info(err);
			// 	}
				var claUrl = url.claURL(owner, repo, pullNumber);

				var body = commentText(signed, badgeUrl, claUrl, user_map);

				if (!comment) {
					github.call({
						obj: 'issues',
						fun: 'createComment',
						arg: {
							user: owner,
							repo: repo,
							number: pullNumber,
							body: body
						},
						basicAuth: {
							user: config.server.github.user,
							pass: config.server.github.pass
						}
					}, function (e) {
						if (e) {
							log.error(new Error(e).stack);
						}
					});
				} else {
					github.call({
						obj: 'issues',
						fun: 'editComment',
						arg: {
							user: owner,
							repo: repo,
							id: comment.id,
							body: body
						},
						basicAuth: {
							user: config.server.github.user,
							pass: config.server.github.pass
						}
					}, function (e) {
						if (e) {
							log.error(new Error(e).stack);
						}
					});
				}
			});
		// });
	},

	getComment: function (args, done) {
		args.url = url.githubPullRequestComments(args.owner, args.repo, args.number);
		args.token = config.server.github.token;

		github.direct_call(args, function (e, res) {
			var CLAAssistantComment;
			if (!e && res && res.data && !res.data.message) {
				res.data.some(function (comment) {
					if (comment.body.match(/.*!\[CLA assistant check\].*/)) {
						CLAAssistantComment = comment;
						return true;
					}
				});
			}
			done(e || res.data.message, CLAAssistantComment);
		});
	},

	editComment: function (args, done) {
		var badgeUrl = url.pullRequestBadge(args.signed);
		var claUrl = url.claURL(args.owner, args.repo, args.number);
		this.getComment({
			repo: args.repo,
			owner: args.owner,
			number: args.number
		}, function (error, comment) {
			if (error || !comment) {
				return;
			}

			var user_map = args.user_map ? args.user_map : null;
			var body = commentText(args.signed, badgeUrl, claUrl, user_map);

			github.call({
				obj: 'issues',
				fun: 'editComment',
				arg: {
					user: args.owner,
					repo: args.repo,
					id: comment.id,
					body: body
				},
				basicAuth: {
					user: config.server.github.user,
					pass: config.server.github.pass
				}
			}, function (e) {
				if (e) {
					log.warn(new Error(e).stack);
					log.warn(e, 'with args: ', args, 'and commentId: ', comment.id);
				}
			});
		});
		if (typeof done === 'function') {
			done();
		}
	}
};
