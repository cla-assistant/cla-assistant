/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// services
var github = require('../../../server/services/github');
var cla_config = require('../../../config');

//model
var Repo = require('../../../server/documents/repo').Repo;

// service under test
var pullRequest = require('../../../server/services/pullRequest');

var testDataComments_withCLAComment = [{
	'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1',
	'id': 1,
	'diff_hunk': '@@ -16,33 +16,40 @@ public class Connection : IConnection...',
	'path': 'file1.txt',
	'position': 1,
	'original_position': 4,
	'commit_id': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'original_commit_id': '9c48853fa3dc5c1c3d6f1f1cd1f2743e72652840',
	'user': {
		'login': 'octocat',
		'id': 1,
		'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
		'gravatar_id': '',
		'url': 'https://api.github.com/users/octocat',
		'html_url': 'https://github.com/octocat',
		'followers_url': 'https://api.github.com/users/octocat/followers',
		'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
		'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
		'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
		'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
		'organizations_url': 'https://api.github.com/users/octocat/orgs',
		'repos_url': 'https://api.github.com/users/octocat/repos',
		'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
		'received_events_url': 'https://api.github.com/users/octocat/received_events',
		'type': 'User',
		'site_admin': false
	},
	'body': 'any comment',
	'created_at': '2011-04-14T16:00:49Z',
	'updated_at': '2011-04-14T16:00:49Z',
	'html_url': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1',
	'pull_request_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1',
	'_links': {
		'self': {
			'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1'
		},
		'html': {
			'href': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1'
		},
		'pull_request': {
			'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1'
		}
	}
}, {
	'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1',
	'id': 2,
	'diff_hunk': '@@ -16,33 +16,40 @@ public class Connection : IConnection...',
	'path': 'file1.txt',
	'position': 1,
	'original_position': 4,
	'commit_id': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'original_commit_id': '9c48853fa3dc5c1c3d6f1f1cd1f2743e72652840',
	'user': {
		'login': 'octocat',
		'id': 1,
		'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
		'gravatar_id': '',
		'url': 'https://api.github.com/users/octocat',
		'html_url': 'https://github.com/octocat',
		'followers_url': 'https://api.github.com/users/octocat/followers',
		'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
		'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
		'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
		'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
		'organizations_url': 'https://api.github.com/users/octocat/orgs',
		'repos_url': 'https://api.github.com/users/octocat/repos',
		'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
		'received_events_url': 'https://api.github.com/users/octocat/received_events',
		'type': 'User',
		'site_admin': false
	},
	'body': '[![CLA assistant check](http://cla_dev.ngrok.com/24456091/pull/71/badge)](http://cla_dev.ngrok.com/KharitonOff/testGithub) <br/>Please agree to our Contributor License Agreement in order to get your pull request merged.',
	'created_at': '2011-04-14T16:00:49Z',
	'updated_at': '2011-04-14T16:00:49Z',
	'html_url': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1',
	'pull_request_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1',
	'_links': {
		'self': {
			'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1'
		},
		'html': {
			'href': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1'
		},
		'pull_request': {
			'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1'
		}
	}
}];

var testDataComments_withoutCLA = [{
	'url': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1',
	'id': 2,
	'diff_hunk': '@@ -16,33 +16,40 @@ public class Connection : IConnection...',
	'path': 'file1.txt',
	'position': 1,
	'original_position': 4,
	'commit_id': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'original_commit_id': '9c48853fa3dc5c1c3d6f1f1cd1f2743e72652840',
	'user': {
		'login': 'octocat',
		'id': 1,
		'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
		'gravatar_id': '',
		'url': 'https://api.github.com/users/octocat',
		'html_url': 'https://github.com/octocat',
		'followers_url': 'https://api.github.com/users/octocat/followers',
		'following_url': 'https://api.github.com/users/octocat/following{/other_user}',
		'gists_url': 'https://api.github.com/users/octocat/gists{/gist_id}',
		'starred_url': 'https://api.github.com/users/octocat/starred{/owner}{/repo}',
		'subscriptions_url': 'https://api.github.com/users/octocat/subscriptions',
		'organizations_url': 'https://api.github.com/users/octocat/orgs',
		'repos_url': 'https://api.github.com/users/octocat/repos',
		'events_url': 'https://api.github.com/users/octocat/events{/privacy}',
		'received_events_url': 'https://api.github.com/users/octocat/received_events',
		'type': 'User',
		'site_admin': false
	},
	'body': 'any comment',
	'created_at': '2011-04-14T16:00:49Z',
	'updated_at': '2011-04-14T16:00:49Z',
	'html_url': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1',
	'pull_request_url': 'https://api.github.com/repos/octocat/Hello-World/pulls/1',
	'_links': {
		'self': {
			'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/comments/1'
		},
		'html': {
			'href': 'https://github.com/octocat/Hello-World/pull/1#discussion-diff-1'
		},
		'pull_request': {
			'href': 'https://api.github.com/repos/octocat/Hello-World/pulls/1'
		}
	}
}];


describe('pullRequest:badgeComment', function () {
	var direct_call_data;
	cla_config.server.github.user = 'cla-assistant';
	cla_config.server.github.pass = 'secret_pass';

	beforeEach(function () {
		cla_config.server.github.token = 'xyz';

		sinon.stub(github, 'direct_call', function (args, cb) {
			assert.equal(args.token, 'xyz');
			cb(null, {
				data: direct_call_data
			});
		});
	});

	afterEach(function () {
		github.direct_call.restore();
		github.call.restore();
	});

	it('should create comment with cla-assistant user', function (it_done) {
		direct_call_data = [];
		sinon.stub(github, 'call', function (args, git_done) {
			assert.equal(args.fun, 'createComment');
			assert(!args.token);
			assert.equal(args.basicAuth.user, 'cla-assistant');
			assert.equal(args.basicAuth.pass, 'secret_pass');
			assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1);
	});

	it('should edit comment with cla-assistant user', function (it_done) {
		direct_call_data = testDataComments_withCLAComment;
		sinon.stub(github, 'call', function (args, git_done) {
			assert.equal(args.fun, 'editComment');
			assert.equal(args.basicAuth.user, 'cla-assistant');
			assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1);
	});

	it('should add a note to the comment if there is a committer who is not a github user', function(it_done){
		direct_call_data = testDataComments_withCLAComment;
		sinon.stub(github, 'call', function (args, git_done) {
			assert.equal(args.fun, 'editComment');
			assert.equal(args.basicAuth.user, 'cla-assistant');
			assert(args.arg.body.indexOf('If you have already a GitHub account, please [add the email address used for this commit to your account]') >= 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1, false, {
			signed: [],
			not_signed: ['user1'],
			unknown: ['user1']
		});
	});

	it('should add a note to the comment with name of ONE committer who has no github account', function(it_done){
		direct_call_data = testDataComments_withCLAComment;
		sinon.stub(github, 'call', function (args, git_done) {
			assert(args.arg.body.indexOf('**user1** seems not to be a GitHub user. You need a GitHub account to be able to sign the CLA. ') >= 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1, false, {
			signed: [],
			not_signed: ['user1'],
			unknown: ['user1']
		});
	});

	it('should add a note to the comment with names of MULTIPLE committers who has no github account', function(it_done){
		direct_call_data = testDataComments_withCLAComment;
		sinon.stub(github, 'call', function (args, git_done) {
			assert(args.arg.body.indexOf('**user1, user2** seem not to be a GitHub user. You need a GitHub account to be able to sign the CLA. ') >= 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1, false, {
			signed: [],
			not_signed: ['user1', 'user2'],
			unknown: ['user1', 'user2']
		});
	});

	it('should write a list of signed and not signed users on create', function (it_done) {
		direct_call_data = [];
		sinon.stub(github, 'call', function (args, git_done) {
			assert.equal(args.fun, 'createComment');
			assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0);
			assert(args.arg.body.indexOf('**1** out of **2**') >= 0);
			assert(args.arg.body.indexOf(':white_check_mark: user1') >= 0);
			assert(args.arg.body.indexOf(':x: user2') >= 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1, false, {
			signed: ['user1'],
			not_signed: ['user2']
		});
	});

	it('should NOT write a list of signed and not signed users on create if there is only one committer', function (it_done) {
		direct_call_data = [];
		sinon.stub(github, 'call', function (args, git_done) {
			assert.equal(args.fun, 'createComment');
			assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0);
			assert(args.arg.body.indexOf('**0** out of **1**') < 0);
			assert(args.arg.body.indexOf(':x: user2') < 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1, false, {
			signed: [],
			not_signed: ['user2']
		});
	});

	it('should write a list of signed and not signed users on edit', function (it_done) {
		direct_call_data = testDataComments_withCLAComment;
		sinon.stub(github, 'call', function (args, git_done) {
			assert.equal(args.fun, 'editComment');
			assert(args.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0);
			assert(args.arg.body.indexOf('**1** out of **2**') >= 0);
			assert(args.arg.body.indexOf(':white_check_mark: user1') >= 0);
			assert(args.arg.body.indexOf(':x: user2') >= 0);
			git_done(null, 'res', 'meta');
			it_done();
		});

		pullRequest.badgeComment('login', 'myRepo', 1, false, {
			signed: ['user1'],
			not_signed: ['user2']
		});
	});
});

describe('pullRequest:getComment', function (done) {
	beforeEach(function () {
		cla_config.server.github.token = 'xyz';

		sinon.stub(github, 'direct_call', function (args, cb) {
			assert.equal(args.token, 'xyz');
			cb(null, {
				data: testDataComments_withCLAComment
			});
		});
	});

	afterEach(function () {
		github.direct_call.restore();
	});

	it('should get CLA assistant_s commment', function (it_done) {

		var args = {
			repo: 'myRepo',
			owner: 'owner',
			number: 1
		};
		pullRequest.getComment(args, function (err, comment) {
			assert.ifError(err);
			assert(github.direct_call.called);
			assert.deepEqual(comment, testDataComments_withCLAComment[1]);
			it_done();
		});
	});

	it('should not find the comment if it is not there', function (it_done) {
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function (arg, cb) {
			cb(null, {
				data: testDataComments_withoutCLA
			});
		});
		var args = {
			repo: 'myRepo',
			owner: 'owner',
			number: 1
		};
		pullRequest.getComment(args, function (err, comment) {
			assert.ifError(err);
			assert(github.direct_call.called);
			assert(!comment);
			it_done();
		});
	});

	it('should not find the comment if github is not answering in a proper way', function (it_done) {
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function (arg, cb) {
			cb(null, {
				data: {
					message: 'Error'
				}
			});
		});
		var args = {
			repo: 'myRepo',
			owner: 'owner',
			number: 1
		};
		pullRequest.getComment(args, function (err, comment) {
			assert(err);
			assert(github.direct_call.called);
			assert(!comment);
			it_done();
		});
	});
});

describe('pullRequest:editComment', function () {
	beforeEach(function () {
		cla_config.server.github.token = 'xyz';

		sinon.stub(github, 'call', function (args, cb) {
			assert.equal(args.basicAuth.user, 'cla-assistant');
			assert(args.arg.id);
			cb(null, 'res', 'meta');
		});

		sinon.stub(github, 'direct_call', function (args, cb) {
			assert.equal(args.token, 'xyz');
			cb(null, {
				data: testDataComments_withCLAComment
			});
		});
	});

	afterEach(function () {
		github.call.restore();
		github.direct_call.restore();
	});

	it('should edit comment if not signed', function (it_done) {
		var args = {
			repo: 'myRepo',
			owner: 'owner',
			number: 1
		};

		pullRequest.editComment(args, function () {
			assert(github.direct_call.called);
			assert(github.call.called);

			it_done();
		});
	});

	it('should write a list of signed and not signed users on edit if not signed', function (it_done) {
		var args = {
			repo: 'myRepo',
			owner: 'owner',
			number: 1,
			signed: false,
			user_map: {
				signed: ['user1'],
				not_signed: ['user2']
			}
		};

		github.call.restore();
		sinon.stub(github, 'call', function (params, git_done) {
			assert.equal(params.fun, 'editComment');
			assert(params.arg.body.indexOf('sign our [Contributor License Agreement]') >= 0);
			assert(params.arg.body.indexOf('**1** out of **2**') >= 0);
			assert(params.arg.body.indexOf(':white_check_mark: user1') >= 0);
			assert(params.arg.body.indexOf(':x: user2') >= 0);
			git_done(null, 'res', 'meta');
		});

		pullRequest.editComment(args, function () {
			assert(github.call.called);

			it_done();
		});
	});

	it('should edit comment if signed', function (it_done) {
		var args = {
			repo: 'myRepo',
			owner: 'owner',
			number: 1,
			signed: true
		};

		pullRequest.editComment(args, function () {
			assert(github.direct_call.called);
			assert(github.call.called);

			it_done();
		});
	});

	it('should not fail if no callback provided', function () {
		var args = {
			repo: 'myRepo',
			owner: 'owner',
			number: 1,
			signed: true
		};

		pullRequest.editComment(args);
	});
});
