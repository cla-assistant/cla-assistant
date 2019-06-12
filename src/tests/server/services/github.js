/*global describe, it, beforeEach*/

// unit test
const rewire = require('rewire')
const assert = require('assert')
const sinon = require('sinon')

// config
global.config = require('../../../config')

// service
const github = rewire('../../../server/services/github')
const cache = require('memory-cache')

const callStub = sinon.stub()
const authenticateStub = sinon.stub()

describe('github:call', () => {
    let expectedAuth
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

        this.authenticate = authenticateStub

        this.paginate = callStub
    }
    OctokitMock.plugin = sinon.stub().returns(OctokitMock)

    github.__set__('Octokit', OctokitMock)

    beforeEach(() => {
        github.resetList = {}
        callStub.reset()
        cache.clear()
        expectedAuth = undefined
        authenticateStub.reset()
    })

    it('should return an error if obj is not set', async () => {
        try {
            await github.call({})
            assert(false, 'Should throw an error')
        } catch (error) {
            assert.equal(error.message, 'obj required/obj not found')
        }
    })

    it('should return an error if fun is not set', async () => {
        try {
            await github.call({ obj: 'obj' })
            assert(false, 'Should throw an error')
        } catch (error) {
            assert.equal(error.message, 'fun required/fun not found')
        }
    })

    it('should authenticate when token is set', async () => {
        expectedAuth = 'token token'
        callStub.resolves({ data: {}, meta: {} })

        await github.call({
            obj: 'obj',
            fun: 'fun',
            token: 'token'
        })
    })

    it('should authenticate when basic authentication is required', async () => {
        expectedAuth = {
            username: 'user',
            password: 'pass'
        }
        callStub.resolves({ data: {}, meta: {} })
        await github.call({
            obj: 'obj',
            fun: 'fun',
            basicAuth: {
                user: 'user',
                pass: 'pass'
            }
        })
    })

    it('should not authenticate when neither token nor basicAuth are provided', async () => {
        expectedAuth = undefined
        callStub.resolves({ data: {}, meta: {} })
        await github.call({
            obj: 'obj',
            fun: 'fun'
        })
    })

    it('should call the appropriate function on the github api', async () => {
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
    })

    it('should return github error', async () => {
        callStub.rejects('github error')
        try {
            await github.call({
                obj: 'obj',
                fun: 'fun'
            })
            assert(false, 'Should throw an error')
        } catch (error) {
            assert.equal(error, 'github error')
        }
    })
})