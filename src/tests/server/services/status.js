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
		Repo.findOne.restore();
		github.call.restore();
	});
	it('should create comment with admin token', function(done){
		sinon.stub(Repo, 'findOne', function(args, done){
			done(null, {token: 'abc'});
        });

		sinon.stub(github, 'call', function(args, git_done){
			assert.equal(args.token, 'abc');
		});

		var args = {owner: 'login', repo: 'myRepo', signed: true};
		status.update(args);

		done();
	});
});
