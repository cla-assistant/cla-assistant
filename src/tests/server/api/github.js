/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// api
var github_api = require('../../../server/api/github');

// module
var github = require('../../../server/services/github');

describe('github:call', function() {
    beforeEach(function(){
        sinon.stub(github, 'call', function(args, cb) {
			assert.deepEqual(args, {obj: 'gists', fun: 'get', token: 'abc'});
			cb();
		});
    });

    afterEach(function(){
        github.call.restore();
    });

    it('should call github service with user token', function(it_done){


        var req = {user: {id: 1, login: 'login', token: 'abc'}, args: {obj: 'gists', fun: 'get'}};

        github_api.call(req, function() {
            it_done();
        });
	});
});

describe('github:call_direct', function() {
    beforeEach(function(){
        sinon.stub(github, 'direct_call', function(args, cb) {
            assert.deepEqual(args, {url: 'url', token: 'abc'});
            cb();
        });
    });

    afterEach(function(){
        github.direct_call.restore();
    });

    it('should call github service with user token', function(it_done){
        var req = {user: {id: 1, login: 'login', token: 'abc'}, args: {url: 'url'}};

        github_api.direct_call(req, function() {
            it_done();
        });
    });
});
