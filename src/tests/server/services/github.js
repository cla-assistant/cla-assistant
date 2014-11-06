// unit test
var rewire = require('rewire');
var assert = require('assert');
var sinon = require('sinon');

// modules
var GitHubApi = require('github');

// config
global.config = require('../../../config');

// service
var github = rewire('../../../server/services/github');

var callStub = sinon.stub();
var authenticateStub = sinon.stub();

function GitHubApiMock(args) {

    assert.deepEqual(args, {
        protocol: 'https',
        version: '3.0.0',
        host: 'api.github.com',
        pathPrefix: null
    });

    this.obj = {
        fun: callStub
    };

    this.authenticate = authenticateStub;

    this.hasNextPage = function(link) {
        return link;
    };
}

github.__set__('GitHubApi', GitHubApiMock);

beforeEach(function() {
    callStub.reset();
    authenticateStub.reset();
});

describe('github:call', function(done) {
    it('should return an error if obj is not set', function(done) {
        github.call({}, function(err) {
            assert.equal(err, 'obj required/obj not found');
            done();
        });
    });

    it('should return an error if fun is not set', function(done) {
        github.call({obj: 'obj'}, function(err) {
            assert.equal(err, 'fun required/fun not found');
            done();
        });
    });

    it('should authenticate when token is set', function(done) {
        callStub.yields(null, {});
        github.call({obj: 'obj', fun: 'fun', token: 'token'}, function(err, res) {
            assert(authenticateStub.calledWith({
                type: 'oauth',
                token: 'token'
            }));
            done();
        });
    });

    xit('should authenticate when basicAuth is set', function(done) {
        callStub.yields(null, {});
        github.call({obj: 'obj', fun: 'fun', basicAuth: {user: 'user', pass: 'pass'}}, function(err, res) {
            assert(authenticateStub.calledWith({
                type: 'basic',
                username: 'user',
                password: 'pass'
            }));
            done();
        });
    });

    it('should not authenticate when neither token or basicAuth are provided', function(done) {
        callStub.yields(null, {});
        github.call({obj: 'obj', fun: 'fun'}, function(err, res) {
            assert(authenticateStub.notCalled);
            done();
        });
    });

    it('should call the appropriate function on the github api', function(done) {
        callStub.yields(null, {});
        github.call({obj: 'obj', fun: 'fun'}, function(err, res, meta) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert.equal(meta, null);
            done();
        });
    });

    it('should call the appropriate function on the github api with meta', function(done) {
        callStub.yields(null, {meta: {link: null, 'x-oauth-scopes': []}});
        github.call({obj: 'obj', fun: 'fun'}, function(err, res, meta) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert.deepEqual(meta, {
                link: null,
                hasMore: false,
                scopes: []
            });
            done();
        });
    });

    it('should call the appropriate function on the github api with meta and link', function(done) {
        callStub.yields(null, {meta: {link: 'link', 'x-oauth-scopes': []}});
        github.call({obj: 'obj', fun: 'fun'}, function(err, res, meta) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert.deepEqual(meta, {
                link: 'link',
                hasMore: true,
                scopes: []
            });
            done();
        });
    });

    it('should return github error', function(done) {
        callStub.yields('github error', null);
        github.call({obj: 'obj', fun: 'fun'}, function(err, res, meta) {
            assert.equal(err, 'github error');
            assert.equal(res, null);
            assert.equal(meta, null);
            done();
        });
    });
});
