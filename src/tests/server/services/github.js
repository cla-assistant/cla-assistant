/*global describe, it, beforeEach, afterEach*/

// unit test
var rewire = require('rewire');
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// service
var github = rewire('../../../server/services/github');

var callStub = sinon.stub();
var authenticateStub = sinon.stub();
var getNextPageStub = sinon.stub();

describe('github:call', function() {
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

        this.getNextPage = getNextPageStub;
    }

    github.__set__('GitHubApi', GitHubApiMock);

    beforeEach(function() {
        callStub.reset();
        authenticateStub.reset();
        getNextPageStub.reset();
    });

    it('should return an error if obj is not set', function(it_done) {
        github.call({}, function(err) {
            assert.equal(err, 'obj required/obj not found');
            it_done();
        });
    });

    it('should return an error if fun is not set', function(it_done) {
        github.call({ obj: 'obj' }, function(err) {
            assert.equal(err, 'fun required/fun not found');
            it_done();
        });
    });

    it('should authenticate when token is set', function(it_done) {
        callStub.yields(null, {});
        github.call({ obj: 'obj', fun: 'fun', token: 'token' }, function() {
            assert(authenticateStub.calledWith({
                type: 'oauth',
                token: 'token'
            }));
            it_done();
        });
    });

    it('should authenticate when basic authentication is required', function(it_done) {
        callStub.yields(null, {});
        github.call({ obj: 'obj', fun: 'fun', basicAuth: { user: 'user', pass: 'pass' } }, function() {
            assert(authenticateStub.calledWith({
                type: 'basic',
                username: 'user',
                password: 'pass'
            }));
            it_done();
        });
    });

    it('should not authenticate when neither token nor basicAuth are provided', function(it_done) {
        callStub.yields(null, {});
        github.call({ obj: 'obj', fun: 'fun' }, function() {
            assert(authenticateStub.notCalled);
            it_done();
        });
    });

    it('should call the appropriate function on the github api', function(it_done) {
        callStub.yields(null, {});
        github.call({ obj: 'obj', fun: 'fun' }, function(err, res, meta) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert.equal(meta, null);
            it_done();
        });
    });

    it('should call the appropriate function on the github api with meta', function(it_done) {
        callStub.yields(null, { meta: { link: null, 'x-oauth-scopes': [] } });
        github.call({ obj: 'obj', fun: 'fun' }, function(err, res, meta) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert.deepEqual(meta, {
                link: null,
                hasMore: false,
                scopes: []
            });
            it_done();
        });
    });

    it('should call the appropriate function on the github api with meta and link', function(it_done) {
        callStub.yields(null, { meta: { link: 'link', 'x-oauth-scopes': [] } });
        getNextPageStub.yields(null, { meta: { link: null, 'x-oauth-scopes': [] } });
        github.call({ obj: 'obj', fun: 'fun' }, function(err, res, meta) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert(getNextPageStub.called);
            // assert.deepEqual(meta, {
            //     link: 'link',
            //     hasMore: true,
            //     scopes: []
            // });
            it_done();
        });
    });

    it('should return github error', function(it_done) {
        callStub.yields('github error', null);
        github.call({ obj: 'obj', fun: 'fun' }, function(err, res, meta) {
            assert.equal(err, 'github error');
            assert.equal(res, null);
            assert.equal(meta, null);
            it_done();
        });
    });
});

describe('github:call_direct', function() {
    var https = require('https');

    var callbacks = {};
    var exp_options = {};
    var https_req = {
        header: {},
        end: function() { },
        error: function(err) {
            callbacks.error(err);
        },
        on: function(fun, cb) {
            callbacks[fun] = cb;
        },
        setHeader: function(value, key) {
            this.header[value] = key;
        },
        write: function(string) {
            console.log(string);
        }
    };
    var res = {
        headers: {
            'x-oauth-scopes': 'GitHub scopes',
            'link': 'link urls'
        },
        on: function(fun, callback) {
            callbacks[fun] = callback;
        }
    };
    var args;

    beforeEach(function() {
        sinon.stub(https, 'request', function(options, done) {
            assert.equal(options.host, exp_options.host);
            assert.equal(options.path, exp_options.path);
            assert.equal(options.method, exp_options.method);
            done(res);
            return https_req;
        });
        sinon.spy(https_req, 'write');

        args = { token: 'abc', url: 'https://api.github.com/url' };
        exp_options = {
            host: 'api.github.com',
            path: '/url',
            method: 'GET',
        };
    });

    afterEach(function() {
        https.request.restore();
        https_req.write.restore();
    });

    it('should call github api directly with user token', function(it_done) {
        github.direct_call(args, function(error, response) {
            assert.equal(response.meta.scopes, 'GitHub scopes');
            assert.equal(response.meta.link, 'link urls');
            assert.equal(https_req.header.Authorization, 'token abc');
            assert.equal(https_req.write.called, false);

            it_done();
        });

        callbacks.data('{}');
        callbacks.end();
    });

    it('should call github api directly with user token using promises', function(it_done) {
        github.direct_call(args).then(function(response) {
            assert.equal(response.meta.scopes, 'GitHub scopes');
            assert.equal(https_req.header.Authorization, 'token abc');

            it_done();
        });

        callbacks.data('{}');
        callbacks.end();
    });

    it('should fail with error message', function(it_done) {
        github.direct_call(args, function(error) {
            assert(error);
            assert.equal(https_req.header.Authorization, 'token abc');

            it_done();
        });

        callbacks.error('Wrong URL!');
    });

    it('should fail with error message unsing promises', function(it_done) {
        github.direct_call(args).then(null, function(error) {
            assert(error);
            assert.equal(https_req.header.Authorization, 'token abc');

            it_done();
        });

        callbacks.error('Wrong URL!');
    });

    it('should use different method then get if provided', function(it_done) {
        args.http_method = 'POST';
        args.body = {a: 'b'};
        exp_options.method = 'POST';

        github.direct_call(args, function(err, response) {
            assert(!err);
            assert(response);
            assert.equal(https_req.write.calledWith('{"a":"b"}'), true);

            it_done();
        });
        callbacks.data('{}');
        callbacks.end();
    });

    it('should not send data if there are none to send', function(it_done) {
        args.http_method = 'POST';
        exp_options.method = 'POST';

        github.direct_call(args, function() {
            assert.equal(https_req.write.called, false);

            it_done();
        });
        callbacks.end();
    });
});
