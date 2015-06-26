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


var testData_commits = [
  {
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
    'parents': [
      {
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
      }
    ]
  },
  {
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
    'parents': [
      {
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
      }
    ]
  },
  {
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
    'parents': [
      {
        'url': 'https://api.github.com/repos/octocat/Hello-World/commits/6dcb09b5b57875f334f61aebed695e2e4193db5e',
        'sha': '6dcb09b5b57875f334f61aebed695e2e4193db5e'
      }
    ]
  }
];

describe('repo:create', function() {
    afterEach(function(){
        Repo.create.restore();
    });

    it('should create repo entry ', function(it_done){
        sinon.stub(Repo, 'create', function(args, done){
            assert(args);
            assert(args.gist);
            assert(args.owner);
            done(null, {repo: args.repo});
        });

        var args = {repo: 'myRepo', user: 'login', owner: 'owner', gist: 'url/gistId', token: 'abc'};
        repo.create(args, function(err){
            assert.ifError(err);
            it_done();
        });
    });
});

describe('repo:check', function() {
    afterEach(function(){
        Repo.findOne.restore();
    });

    it('should check repo entry', function(it_done){
        sinon.stub(Repo, 'findOne', function(args, done){
            assert(args);
            assert(args.repo);
            assert(args.owner);
            done(null, {});
        });

        var args = {repo: 'myRepo', owner: 'owner'};
        repo.check(args, function(err, obj){
            assert.ifError(err);
            assert(obj);
            it_done();
        });
    });
});

describe('repo:addPullRequest', function() {
    var test_repo;

    beforeEach(function(){
		test_repo = {token: 'abc', save: function(){}};

		sinon.stub(Repo, 'findOne', function(args, done){
			done(null, test_repo);
		});
		sinon.stub(github, 'direct_call', function(args, done){
			assert(args.token);
			assert.equal(args.url, url.githubPullRequestCommits('owner', 'myRepo', 1));
			done(null, {data: testData_commits});
		});
    });

    afterEach(function(){
        Repo.findOne.restore();
        github.direct_call.restore();
    });

    it('should get list of committers for a pull request', function(it_done){
		var args = {repo: 'myRepo', owner: 'owner', number: '1'};

		repo.getPRCommitters(args, function(err, data){
			assert.ifError(err);
            assert.equal(data.length, 2);
			assert.equal(data[0].name, 'octocat');
			assert(Repo.findOne.called);
			assert(github.direct_call.called);
		});

		it_done();
    });

    it('should handle error', function(it_done){
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function(args, done){
			done(null, {data: {message: 'Any Error message'}});
		});
		var args = {repo: 'myRepo', owner: 'owner', number: '1'};

		repo.getPRCommitters(args, function(err){
			assert(err);
			assert(Repo.findOne.called);
			assert(github.direct_call.called);
		});

		it_done();
    });
});
