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
	afterEach(function(){
		github.call.restore();
		Repo.findOne.restore();
	});

	it('should create comment with admin token', function(done){
        var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
			done(null, {token: 'abc'});
        });

		var githubStub = sinon.stub(github, 'call', function(args, git_done){
			assert.equal(args.token, 'abc');

			done();
		});

		pullRequest.badgeComment('login', 'myRepo', 123, 1);
	});
});
