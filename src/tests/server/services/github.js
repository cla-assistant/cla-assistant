/*global describe, it, beforeEach, afterEach*/

// unit test
let rewire = require('rewire');
let assert = require('assert');
let sinon = require('sinon');

// config
global.config = require('../../../config');

// service
let github = rewire('../../../server/services/github');
let cache = require('memory-cache');
let logger = require('../../../server/services/logger');

let callStub = sinon.stub();
let authenticateStub = sinon.stub();
let getNextPageStub = sinon.stub();

describe('github:call', function () {
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

        this.hasNextPage = function (link) {
            return link;
        };

        this.getNextPage = getNextPageStub;
    }

    github.__set__('GitHubApi', GitHubApiMock);

    beforeEach(function () {
        github.resetList = {};
        callStub.reset();
        authenticateStub.reset();
        getNextPageStub.reset();
        cache.clear();
        sinon.stub(logger, 'info').callsFake(() => { }); //eslint-disable-line no-empty-function
    });

    afterEach(function () {
        logger.info.restore();
    });

    it('should return an error if obj is not set', function (it_done) {
        github.call({}, function (err) {
            assert.equal(err, 'obj required/obj not found');
            it_done();
        });
    });

    it('should return an error if fun is not set', function (it_done) {
        github.call({
            obj: 'obj'
        }, function (err) {
            assert.equal(err, 'fun required/fun not found');
            it_done();
        });
    });

    it('should authenticate when token is set', function (it_done) {
        callStub.yields(null, { data: {}, meta: {} });
        github.call({
            obj: 'obj',
            fun: 'fun',
            token: 'token'
        }, function () {
            assert(authenticateStub.calledWith({
                type: 'token',
                token: 'token'
            }));
            it_done();
        });
    });

    it('should authenticate when basic authentication is required', function (it_done) {
        callStub.yields(null, { data: {}, meta: {} });
        github.call({
            obj: 'obj',
            fun: 'fun',
            basicAuth: {
                user: 'user',
                pass: 'pass'
            }
        }, function () {
            assert(authenticateStub.calledWith({
                type: 'basic',
                username: 'user',
                password: 'pass'
            }));
            it_done();
        });
    });

    it('should not authenticate when neither token nor basicAuth are provided', function (it_done) {
        callStub.yields(null, { data: {}, meta: {} });
        github.call({
            obj: 'obj',
            fun: 'fun'
        }, function () {
            assert(authenticateStub.notCalled);
            it_done();
        });
    });

    it('should call the appropriate function on the github api', function (it_done) {
        callStub.yields(null, { data: {}, meta: {} });
        github.call({
            obj: 'obj',
            fun: 'fun'
        }, function (err, res, meta) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert(meta);
            it_done();
        });
    });

    it('should call the appropriate function on the github api with meta', function (it_done) {
        callStub.yields(null, {
            data: {},
            meta: {
                link: null,
                'x-oauth-scopes': []
            }
        });
        github.call({
            obj: 'obj',
            fun: 'fun'
        }, function (err, res, meta) {
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

    it('should call the appropriate function on the github api with meta and link', function (it_done) {
        callStub.yields(null, {
            data: {},
            meta: {
                link: 'link',
                'x-oauth-scopes': []
            }
        });
        getNextPageStub.yields(null, {
            data: {},
            meta: {
                link: null,
                'x-oauth-scopes': []
            }
        });
        github.call({
            obj: 'obj',
            fun: 'fun'
        }, function (err, res) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert(getNextPageStub.called);
            it_done();
        });
    });

    it('should return github error', function (it_done) {
        callStub.yields('github error', null);
        github.call({
            obj: 'obj',
            fun: 'fun'
        }, function (err, res, meta) {
            assert.equal(err, 'github error');
            assert.equal(res, null);
            assert.equal(meta, null);
            it_done();
        });
    });

    it('should set and delete RateLimit-Reset timer', function (it_done) {
        let resetTime = Math.floor((Date.now() + 1000) / 1000);
        callStub.yields(null, {
            data: {},
            meta: {
                'x-ratelimit-remaining': 9,
                'x-ratelimit-reset': resetTime,
            }
        });
        this.timeout(1050);
        github.call({
            obj: 'obj',
            fun: 'fun',
            token: 'abc'
        }, function (err, res) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert.equal(github.resetList.abc, resetTime * 1000);
            setTimeout(function () {
                assert.equal(github.resetList.abc, undefined);
                it_done();
            }, 1010);
        });
    });
    it('should set RateLimit-Reset timer only if there are less than 100 calls allowed', function (it_done) {
        let resetTime = Math.floor((Date.now() + 1000) / 1000);
        callStub.yields(null, {
            data: {},
            meta: {
                'x-ratelimit-remaining': 115,
                'x-ratelimit-reset': resetTime,
            }
        });
        // this.timeout(1050);
        github.call({
            obj: 'obj',
            fun: 'fun',
            token: 'abc'
        }, function (err, res) {
            assert.equal(err, null);
            assert.deepEqual(res, {});
            assert.equal(github.resetList.abc, undefined);
            it_done();
        });
    });

    it('should call github with delay if there is RateLimit-Reset set for the token', function (it_done) {
        github.resetList.abc = Date.now() + 1000;
        let githubCalledBack = false;

        callStub.yields(null, { data: {}, meta: {} });
        this.timeout(1050);
        github.call({
            obj: 'obj',
            fun: 'fun',
            token: 'abc'
        }, function () {
            githubCalledBack = true;
        });
        setTimeout(function () {
            assert(!githubCalledBack);
        }, 900);
        setTimeout(function () {
            assert(githubCalledBack);
            it_done();
        }, 1020);
    });
});