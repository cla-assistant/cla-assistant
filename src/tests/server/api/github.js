// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var github = require('../../../server/services/github');

// models
// var User = require('../../../server/documents/user').User;

// api
var github_api = require('../../../server/api/github');


describe('github:call', function(done) {
	it('should call github service with user token', function(done){

        var githubStub = sinon.stub(github, 'call', function(args, done) {
			assert.deepEqual(args, {obj: 'gists', fun: 'get', token: 'abc'});
			done();
		});

		var req = {user: {id: 1, login: 'login', token: 'abc'}, args: {obj: 'gists', fun: 'get'}};

		github_api.call(req,function(error, res) {
            githubStub.restore();
            done();
        });
	});
});
