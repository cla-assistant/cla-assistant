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

let callStub = sinon.stub();
let authenticateStub = sinon.stub();
let getNextPageStub = sinon.stub();

describe('github:call', function () {
    let expectedAuth;
    function OctokitMock(args) {
        assert.deepStrictEqual(args.auth, expectedAuth)
        assert.strictEqual(args.protocol, 'https')
        assert.strictEqual(args.version, '3.0.0')
        assert.strictEqual(args.host, 'api.github.com')
        assert.strictEqual(args.pathPrefix, null)

        this.obj = {
            fun: callStub,
            listSomething: {
                endpoint: {
                    merge: function (args) {
                        return args
                    }
                }
            }
        }

        this.authenticate = authenticateStub;

        this.hasNextPage = function (link) {
            return link;
        };

        this.paginate = callStub
    }

    github.__set__('Octokit', OctokitMock);

    beforeEach(function () {
        github.resetList = {};
        callStub.reset();
        authenticateStub.reset();
        getNextPageStub.reset();
        cache.clear();
        expectedAuth = undefined;
    });

    it('should return an error if obj is not set', async function () {
        try {
            await github.call({})
            assert(false, 'Should throw an error')
        } catch (error) {
            assert.equal(error, 'obj required/obj not found');
        }
    });

    it('should return an error if fun is not set', async function () {
        try {
            await github.call({ obj: 'obj' })
            assert(false, 'Should throw an error')
        } catch (error) {
            assert.equal(error, 'fun required/fun not found');
        }
    });

    it('should authenticate when token is set', async function () {
        expectedAuth = 'token token';
        callStub.resolves({ data: {}, meta: {} });

        await github.call({
            obj: 'obj',
            fun: 'fun',
            token: 'token'
        });
    });

    it('should authenticate when basic authentication is required', async function () {
        expectedAuth = {
            username: 'user',
            password: 'pass'
        };
        callStub.resolves({ data: {}, meta: {} });
        await github.call({
            obj: 'obj',
            fun: 'fun',
            basicAuth: {
                user: 'user',
                pass: 'pass'
            }
        });
    });

    it('should not authenticate when neither token nor basicAuth are provided', async function () {
        callStub.resolves({ data: {}, meta: {} });
        await github.call({
            obj: 'obj',
            fun: 'fun'
        });
        assert(authenticateStub.notCalled);
    });

    it('should call the appropriate function on the github api', async function () {
        const testHeaders = {
            link: null,
            'x-oauth-scopes': []
        }
        callStub.resolves({ data: {}, headers: testHeaders })
        const res = await github.call({
            obj: 'obj',
            fun: 'fun'
        })
        assert.deepStrictEqual(res, { data: {}, headers: testHeaders })
    });

    it('should return github error', async function () {
        callStub.rejects('github error');
        try {
            const res = await github.call({
                obj: 'obj',
                fun: 'fun'
            })
            assert(false, 'Should throw an error')
        } catch (error) {
            assert.equal(error, 'github error');
        }
    });
});