// unit test
var assert = require('assert');
var sinon = require('sinon');

// services
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');

//model
var Repo = require('../../../server/documents/repo').Repo;

// service under test
var pullRequest = require('../../../server/services/pullRequest');

describe('pullRequest:badgeComment', function(done) {
	var direct_call_data;

  beforeEach(function(){
    sinon.stub(Repo, 'findOne', function(args, done){
			done(null, {token: 'abc'});
    });
    sinon.stub(github, 'direct_call', function(args, done){
      assert.equal(args.token, 'abc');
      done(null, {data: direct_call_data});
    });
  });

  afterEach(function(){
    github.direct_call.restore();
    github.call.restore();
    Repo.findOne.restore();
  });

  it('should create comment with admin token', function(done){
    direct_call_data = [];
    sinon.stub(github, 'call', function(args, git_done){
      assert.equal(args.fun, 'createComment');
      assert.equal(args.token, 'abc');
      git_done(null, 'res', 'meta');
      done();
    });

    pullRequest.badgeComment('login', 'myRepo', 123, 1);
  });

  it('should edit comment with admin token', function(done){
    direct_call_data = testDataComments_withCLAComment;
		sinon.stub(github, 'call', function(args, git_done){
			assert.equal(args.fun, 'editComment');
      assert.equal(args.token, 'abc');
			git_done(null, 'res', 'meta');
			done();
		});

		pullRequest.badgeComment('login', 'myRepo', 123, 1);
	});
});

describe('pullRequest:getComment', function(done) {
	beforeEach(function(){
        sinon.stub(Repo, 'findOne', function(args, done){
			done(null, {token: 'abc'});
        });

		sinon.stub(github, 'call', function(args, git_done){
			assert.equal(args.token, 'abc');
			git_done(null, 'res', 'meta');
			done();
		});

		sinon.stub(github, 'direct_call', function(args, done){
			assert.equal(args.token, 'abc');
			done(null, {data: testDataComments_withCLAComment});
		});
	});

	afterEach(function(){
		github.call.restore();
		github.direct_call.restore();
		Repo.findOne.restore();
	});

	it('should get CLA assistant_s commment', function(done){

		var args = {repo: 'myRepo', owner: 'owner', number: 1};
		pullRequest.getComment(args, function(err, comment){
			assert.ifError(err);
			assert(github.direct_call.called);
			assert.deepEqual(comment, testDataComments_withCLAComment[1]);
			done();
		});
	});

	it('should not find the comment if it is not there', function(done){
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function(args, done){
			done(null, {data: testDataComments_withoutCLA});
		});
		var args = {repo: 'myRepo', owner: 'owner', number: 1};
		pullRequest.getComment(args, function(err, comment){
			assert.ifError(err);
			assert(github.direct_call.called);
			assert(!comment);
			done();
		});
	});

	it('should not find the comment if github is not answering in a proper way', function(done){
		github.direct_call.restore();
		sinon.stub(github, 'direct_call', function(args, done){
			done(null, {data: {message: 'Error'}});
		});
		var args = {repo: 'myRepo', owner: 'owner', number: 1};
		pullRequest.getComment(args, function(err, comment){
			assert(err);
			assert(github.direct_call.called);
			assert(!comment);
			done();
		});
	});
});

describe('pullRequest:editComment', function(done) {
	beforeEach(function(){
        sinon.stub(Repo, 'findOne', function(args, done){
			done(null, {token: 'abc'});
        });

		sinon.stub(github, 'call', function(args, git_done){
			assert.equal(args.token, 'abc');
      assert(args.arg.id);
			git_done(null, 'res', 'meta');
		});

		sinon.stub(github, 'direct_call', function(args, done){
			assert.equal(args.token, 'abc');
			done(null, {data: testDataComments_withCLAComment});
		});
	});

	afterEach(function(){
		github.call.restore();
		github.direct_call.restore();
		Repo.findOne.restore();
	});

  it('should edit comment if not signed', function(done){
    var args = {repo: 'myRepo', owner: 'owner', number: 1};

    pullRequest.editComment(args, function(){
      assert(github.direct_call.called);
      assert(github.call.called);

      done();
    });
  });

	it('should edit comment if signed', function(done){
		var args = {repo: 'myRepo', owner: 'owner', number: 1, signed: true};

		pullRequest.editComment(args, function(){
      assert(github.direct_call.called);
			assert(github.call.called);

			done();
		});
	});
});

var testDataComments_withCLAComment = [
  {
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
  },
  {
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
  }
];

var testDataComments_withoutCLA = [
{
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
