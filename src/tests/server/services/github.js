// unit test
var rewire = require('rewire');
var assert = require('assert');
var sinon = require('sinon');

// modules
var GitHubApi = require('github');

//api
var github_api = require('../../../server/api/github');

// config
global.config = require('../../../config');

// service
var github = rewire('../../../server/services/github');

var callStub = sinon.stub();
var authenticateStub = sinon.stub();

describe('github:call', function(done) {
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

// describe('github:direct_call', function(done){
//     beforeEach(function(){
//         sinon.stub(github_api, 'direct_call', function(req, done){
//             done();
//         });
//     });

//     afterEach(function(){
//         github_api.direct_call.restore();
//     });

// });

describe('github:call_direct', function(done) {
    var https = require('https');

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
    var args;

    beforeEach(function(){
        sinon.stub(https, 'request', function(options, done) {
            assert.equal(options, 'url');
            done(res);
            return https_req;
        });

        args = {token: 'abc', url: 'url'};
    });

    afterEach(function(){
        https.request.restore();
    });

    it('should call github api directly with user token', function(done){
        github.direct_call(args, function(error, res) {
            assert.equal(res.meta.scopes, 'GitHub scopes');
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.data('{}');
        callbacks.end();
    });

    it('should call github api directly with user token using promises', function(done){
        github.direct_call(args).then(function(res) {
            assert.equal(res.meta.scopes, 'GitHub scopes');
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.data('{}');
        callbacks.end();
    });

    it('should fail with error message', function(done){
        github.direct_call(args, function(error, res) {
            assert(error);
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.error('Wrong URL!');
    });

    it('should fail with error message unsing promises', function(done){
        github.direct_call(args).then(null, function(error, res) {
            assert(error);
            assert.equal(https_req.header.Authorization, 'token abc');

            done();
        });

        callbacks.error('Wrong URL!');
    });

    xit('should use different method then get if provided', function(done){
        args.http_method = 'POST';

        github.direct_call(args, function(err, res){
            assert(err);
            done();
        });
        callbacks.data('{}');
        callbacks.end();
    });
});
