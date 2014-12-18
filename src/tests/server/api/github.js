// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var github = require('../../../server/services/github');
var https = require('https');


var config = {server: {github: {api: 'api.github.com'}}};
var callbacks = {};
var https_req = {
	header: {},
    end: function(){},
    error: function(err){
        callbacks.error(err);
    },
    on: function(fun, cb){
        callbacks[fun] = cb;
    },
    setHeader: function(value, key){
		this.header[value] = key;
    }
};
var res = {
	headers: {
		'x-oauth-scopes': 'GitHub scopes'
	},
    on: function(fun, callback){
        callbacks[fun] = callback;
    }
};

// api
var github_api = require('../../../server/api/github');


describe('github:call', function(done) {
	it('should call github service with user token', function(done){

        var githubStub = sinon.stub(github, 'call', function(args, done) {
			assert.deepEqual(args, {obj: 'gists', fun: 'get', token: 'abc'});
			done();
		});

		var req = {user: {id: 1, login: 'login', token: 'abc'}, args: {obj: 'gists', fun: 'get'}};

		github_api.call(req, function(error, res) {
            githubStub.restore();
            done();
        });
	});
});

describe('github:call_direct', function(done) {
	var req;

	beforeEach(function(){
		sinon.stub(https, 'request', function(options, done) {
            assert.equal(options, 'url');
            done(res);
            return https_req;
        });

		req = {user: {id: 1, login: 'login', token: 'abc'}, args: {url: 'url'}};
	});

	afterEach(function(){
        https.request.restore();
	});

	it('should call github api directly with user token', function(done){
		github_api.direct_call(req, function(error, res) {
            assert.equal(res.meta.scopes, 'GitHub scopes');
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.data('{}');
        callbacks.end();
	});

	it('should call github api directly with user token using promises', function(done){
		github_api.direct_call(req).then(function(res) {
            assert.equal(res.meta.scopes, 'GitHub scopes');
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.data('{}');
        callbacks.end();
	});

	it('should fail with error message', function(done){
		github_api.direct_call(req, function(error, res) {
            assert(error);
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.error('Wrong URL!');
	});

	it('should fail with error message unsing promises', function(done){
		github_api.direct_call(req).then(null, function(error, res) {
            assert(error);
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.error('Wrong URL!');
	});
});
