// unit test
var assert = require('assert');
var sinon = require('sinon');

// services
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');

//model
var Repo = require('../../../server/documents/repo').Repo;
var CLA = require('../../../server/documents/cla').CLA;

// service under test
var status = require('../../../server/services/status');

describe('status:update', function(done) {
	afterEach(function(){
		CLA.findOne.restore();
		Repo.findOne.restore();
		github.call.restore();
	});
	xit('should create comment with admin token', function(done){
        var claStub = sinon.stub(CLA, 'findOne', function(args, done){
			done(null, {uuid: 1});
        });
		var repoStub = sinon.stub(Repo, 'findOne', function(args, done){
			done(null, {token: 'abc'});
        });

		var githubStub = sinon.stub(github, 'call', function(args, git_done){
			assert.equal(args.token, 'abc');
			git_done();
			done();
		});

		var args = {owner: 'login', repo: 'myRepo'};
		status.update(args);
	});
});
