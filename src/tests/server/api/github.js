// unit test
var assert = require('assert');
var sinon = require('sinon');

// api
var github_api = require('../../../server/api/github');

// module
var github = require('../../../server/services/github');

describe('github:call', function(done) {
    beforeEach(function(){
        sinon.stub(github, 'call', function(args, done) {
			assert.deepEqual(args, {obj: 'gists', fun: 'get', token: 'abc'});
			done();
		});
    });

    afterEach(function(){
        github.call.restore();
    });

    it('should call github service with user token', function(done){


        var req = {user: {id: 1, login: 'login', token: 'abc'}, args: {obj: 'gists', fun: 'get'}};

        github_api.call(req, function(error, res) {
            done();
        });
	});
});

describe('github:call_direct', function(done) {
    beforeEach(function(){
        sinon.stub(github, 'call', function(args, done) {
            assert.deepEqual(args, {url: 'url', token: 'abc'});
            done();
        });
    });

    afterEach(function(){
        github.call.restore();
    });

    it('should call github service with user token', function(done){
        var req = {user: {id: 1, login: 'login', token: 'abc'}, args: {url: 'url'}};

        github_api.direct_call(req, function(error, res) {
            done();
        });
    });
});
