/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var Repo = require('../../../server/documents/repo').Repo;

//services
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');

// service under test
var repo = require('../../../server/services/repo');

var testData_commit = [{
	'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
	'commit': {
		'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'author': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'committer': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'message': 'Fix all the bugs',
		'tree': {
			'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
			'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
		},
		'comment_count': 0
	},
	'author': {
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
	'committer': {
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
	'parents': [{
		'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
	}]
}];

var testData_commits = [{
	'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
	'commit': {
		'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'author': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'committer': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'message': 'Fix all the bugs',
		'tree': {
			'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
			'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
		},
		'comment_count': 0
	},
	'author': {
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
	'committer': {
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
	'parents': [{
		'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
	}]
}, {
	'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
	'commit': {
		'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'author': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'committer': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'message': 'Fix all the bugs',
		'tree': {
			'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
			'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
		},
		'comment_count': 0
	},
	'author': {
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
	'committer': {
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
	'parents': [{
		'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
	}]
}, {
	'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'html_url': 'https://github.com/octocat/Hello-World/commit/6dcb09b5b57875f334f61aebed695e2e4193db5e',
	'comments_url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e/comments',
	'commit': {
		'url': 'https://api.github.com/repos/octocat/Hello-World/git/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'author': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'committer': {
			'name': 'Monalisa Octocat',
			'email': 'support@github.com',
			'date': '2011-04-14T16:00:49Z'
		},
		'message': 'Fix all the bugs',
		'tree': {
			'url': 'https://api.github.com/repos/octocat/Hello-World/tree/6dcb09b5b57875f334f61aebed695e2e4193db5e',
			'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
		},
		'comment_count': 0
	},
	'author': {
		'login': 'octocat2',
		'id': 1,
		'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
		'gravatar_id': '',
		'url': 'https://api.github.com/users/octocat2',
		'html_url': 'https://github.com/octocat2',
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
	'committer': {
		'login': 'octocat2',
		'id': 1,
		'avatar_url': 'https://github.com/images/error/octocat_happy.gif',
		'gravatar_id': '',
		'url': 'https://api.github.com/users/octocat2',
		'html_url': 'https://github.com/octocat2',
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
	'parents': [{
		'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
		'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
	}]
}];

var testData_commit_with_no_user = [{
	'sha': '0b0f859cb34ccc39c038376a58b612a9574d7d55',
	'commit': {
		'author': {
			'name': 'Anton Kharitonoff',
			'email': 'ak@gmail.com',
			'date': '2015-08-14T12:15:42Z'
		},
		'committer': {
			'name': 'Anton Kharitonoff',
			'email': 'ak@gmail.com',
			'date': '2015-08-14T12:15:42Z'
		},
		'message': 'some more changes',
		'tree': {
			'sha': '297200be0c1886e8ea6185ae71eaa3d8708f53b4',
			'url': 'https://api.github.com/repos/KharitonOff/cla3/git/trees/297200be0c1886e8ea6185ae71eaa3d8708f53b4'
		},
		'url': 'https://api.github.com/repos/KharitonOff/cla3/git/commits/0b0f859cb34ccc39c038376a58b612a9574d7d55',
		'comment_count': 0
	},
	'url': 'https://api.github.com/repos/KharitonOff/cla3/commits/0b0f859cb34ccc39c038376a58b612a9574d7d55',
	'html_url': 'https://github.com/KharitonOff/cla3/commit/0b0f859cb34ccc39c038376a58b612a9574d7d55',
	'comments_url': 'https://api.github.com/repos/KharitonOff/cla3/commits/0b0f859cb34ccc39c038376a58b612a9574d7d55/comments',
	'author': null,
	'committer': null,
	'parents': [{
		'sha': 'b43123ef4c5d862cd57aabf99b53e8d68c7eac85',
		'url': 'https://api.github.com/repos/KharitonOff/cla3/commits/b43123ef4c5d862cd57aabf99b53e8d68c7eac85',
		'html_url': 'https://github.com/KharitonOff/cla3/commit/b43123ef4c5d862cd57aabf99b53e8d68c7eac85'
	}]
}];

describe('repo:create', function () {
	afterEach(function () {
		Repo.create.restore();
	});

	it('should create repo entry ', function (it_done) {
		sinon.stub(Repo, 'create', function (args, done) {
			assert(args);
			assert(args.gist);
			assert(args.owner);
			done(null, {
				repo: args.repo
			});
		});

		var arg = {
			repo: 'myRepo',
			user: 'login',
			owner: 'owner',
			gist: 'url/gistId',
			token: 'abc'
		};
		repo.create(arg, function (err) {
			assert.ifError(err);
			it_done();
		});
	});
});

describe('repo:check', function () {
	afterEach(function () {
		Repo.findOne.restore();
	});

	it('should check repo entry', function (it_done) {
		sinon.stub(Repo, 'findOne', function (args, done) {
			assert(args);
			assert(args.repo);
			assert(args.owner);
			done(null, {});
		});

		var arg = {
			repo: 'myRepo',
			owner: 'owner'
		};
		repo.check(arg, function (err, obj) {
			assert.ifError(err);
			assert(obj);
			it_done();
		});
	});
});

describe('repo:getPRCommitters', function () {
	var test_repo;

	beforeEach(function () {
		test_repo = {
			token: 'abc',
			save: function () {}
		};

		sinon.stub(Repo, 'findOne', function (args, done) {
			done(null, test_repo);
		});
		sinon.stub(github, 'direct_call', function (args, done) {
			assert(args.token);
			assert.equal(args.url, url.githubPullRequestCommits('owner', 'myRepo', 1));
			done(null, {
				data: testData_commits
			});
		});
	});

	afterEach(function () {
		Repo.findOne.restore();
		github.direct_call.restore();
	});

	it('should get committer for a pull request', function (it_done) {
		var arg = {
			repo: 'myRepo',
			owner: 'owner',
			number: '1'
		};

		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function (argums, done) {
			assert(argums.token);
			assert.equal(argums.url, url.githubPullRequestCommits('owner', 'myRepo', 1));
			done(null, {
				data: testData_commit
			});
		});

		repo.getPRCommitters(arg, function (err, data) {
			assert.ifError(err);
			assert.equal(data.length, 1);
			assert.equal(data[0].name, 'octocat');
			assert(Repo.findOne.called);
			assert(github.direct_call.called);
		});

		it_done();
	});

	it('should get list of committers for a pull request', function (it_done) {
		var arg = {
			repo: 'myRepo',
			owner: 'owner',
			number: '1'
		};

		repo.getPRCommitters(arg, function (err, data) {
			assert.ifError(err);
			assert.equal(data.length, 2);
			assert.equal(data[0].name, 'octocat');
			assert(Repo.findOne.called);
			assert(github.direct_call.called);
		});

		it_done();
	});

	it('should handle committers who has no github user', function (it_done) {
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function (argums, done) {
			done(null, {
				data: testData_commit_with_no_user
			});
		});
		var arg = {
			repo: 'myRepo',
			owner: 'owner',
			number: '1'
		};

		repo.getPRCommitters(arg, function (err, data) {
			assert.ifError(err);
			assert.equal(data.length, 1);
			// assert.equal(data[0].name, 'octocat');
			// assert(Repo.findOne.called);
			assert(github.direct_call.called);
		});
		it_done();
	});

	it('should handle error', function (it_done) {
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function (args, done) {
			done(null, {
				data: {
					message: 'Any Error message'
				}
			});
		});
		var arg = {
			repo: 'myRepo',
			owner: 'owner',
			number: '1'
		};

		repo.getPRCommitters(arg, function (err) {
			assert(err);
			assert(Repo.findOne.called);
			assert(github.direct_call.calledOnce);
		});

		it_done();
	});

	it('should retry api call if gitHub returns "Not Found"', function (it_done) {
		this.timeout(4000);
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function (args, done) {
			done(null, {
				data: {
					message: 'Not Found'
				}
			});
		});
		var arg = {
			repo: 'myRepo',
			owner: 'owner',
			number: '1'
		};

		repo.getPRCommitters(arg, function (err) {
			assert(err);
			assert(Repo.findOne.called);
			assert(github.direct_call.calledThrice);
		});
		setTimeout(it_done, 3500);
	});

	it('should handle not found repo', function (it_done) {
		Repo.findOne.restore();
		sinon.stub(Repo, 'findOne', function (args, done) {
			done(null, null);
		});
		var arg = {
			repo: 'myRepo',
			owner: 'owner',
			number: '1'
		};

		repo.getPRCommitters(arg, function (err) {
			assert(err);
			assert(Repo.findOne.called);
			assert(!github.direct_call.called);
		});

		it_done();
	});
});

describe('repo:getUserRepos', function () {
	afterEach(function () {
		github.direct_call.restore();
		Repo.find.restore();
	});

	it('should return all linked repositories of the logged user', function (it_done) {
		sinon.stub(github, 'direct_call', function (args, done) {
			assert.equal(args.url.indexOf('https://api.github.com/user/repos?per_page=100'), 0);
			assert(args.token);
			done(null, {
				data: [{
					owner: {
						login: 'login'
					},
					name: 'repo1'
				}, {
					owner: {
						login: 'login'
					},
					name: 'repo2'
				}]
			});
		});
		sinon.stub(Repo, 'find', function (args, done) {
			assert.equal(args.$or.length, 2);
			done(null, [{
				owner: 'login',
				repo: 'repo1'
			}]);
		});

		repo.getUserRepos({
			token: 'test_token'
		}, function (err, res) {
			assert.ifError(err);
			assert(res[0].repo, 'repo1');
			assert(Repo.find.called);

			it_done();
		});
	});

	it('should handle github error', function (it_done) {
		sinon.stub(github, 'direct_call', function (args, done) {
			done(null, {
				data: {
					message: 'Bad credentials'
				}
			});
		});
		sinon.stub(Repo, 'find', function (args, done) {
			done();
		});

		repo.getUserRepos({}, function (err) {
			assert.equal(err, 'Bad credentials');
			assert(!Repo.find.called);

			it_done();
		});
	});

	it('should handle mogodb error', function (it_done) {
		sinon.stub(github, 'direct_call', function (args, done) {
			done(null, {
				data: [{
					owner: {
						login: 'login'
					},
					name: 'repo1'
				}, {
					owner: {
						login: 'login'
					},
					name: 'repo2'
				}]
			});
		});
		sinon.stub(Repo, 'find', function (args, done) {
			done('DB error');
		});

		repo.getUserRepos({}, function (err) {
			assert(err);
			assert(Repo.find.called);

			it_done();
		});
	});
});
