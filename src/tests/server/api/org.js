/*global describe, it, beforeEach, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')

// service
const org = require('../../../server/services/org')
const github = require('../../../server/services/github')
const logger = require('../../../server/services/logger')
const webhook = require('../../../server/api/webhook')

// test data
const testData = require('../testData').data

// api
const org_api = require('../../../server/api/org')


describe('org api', () => {
    let testErr = {}
    let testRes = {}
    let req = null
    beforeEach(() => {
        req = {
            args: {
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl'
            },
            user: {
                token: 'abc'
            }
        }
        testErr.githubCall = null
        testRes.githubCall = testData.orgs
        testErr.githubCallGraphql = null
        testRes.githubCallGraphql = { body: JSON.parse(JSON.stringify(testData.graphqlUserOrgs)) }
        testErr.githubGetMembership = null
        testRes.githubGetMembership = { data: { role: 'admin' } }
        testErr.webhook = {}
        testRes.webhook = {}
        testErr.org = {}
        testRes.org = {}

        sinon.stub(github, 'callGraphql').callsFake(async (_query, token) => {
            assert(token)
            if (testErr.githubCallGraphql) {
                throw new Error(testErr.githubCallGraphql)
            }
            return JSON.stringify(testRes.githubCallGraphql.body)
        })
        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.fun === 'getOrgs') {
                if (testErr.githubCall) {
                    throw new Error(testErr.githubCall)
                }
                return testRes.githubCall
            }
            if (args.fun === 'getOrgMembership') {
                return testRes.githubGetMembership
            }
        })
        sinon.stub(org, 'getMultiple').resolves([{}, {}])
        sinon.stub(org, 'create').callsFake(async () => {
            if (testErr.org.create) {
                throw new Error(testErr.org.create)
            }
            return testRes.org.create
        })
        sinon.stub(org, 'get').callsFake(async () => {
            if (testErr.org.create) {
                throw new Error(testErr.org.get)
            }
            return testRes.org.get
        })
        sinon.stub(logger, 'warn').callsFake((msg) => assert(msg))
        sinon.stub(webhook, 'create').callsFake(function () {
            if (testErr.webhook.create) {
                throw new Error(testErr.webhook.create)
            }
            return testRes.webhook.create
        })
    })
    afterEach(() => {
        github.call.restore()
        github.callGraphql.restore()
        org.getMultiple.restore()
        org.create.restore()
        org.get.restore()
        logger.warn.restore()
        webhook.create.restore()
    })

    describe('create', () => {
        it('should create new org via org service and create org webhook', async () => {
            await org_api.create(req)
            assert(org.get.calledWith({
                orgId: 1,
                org: 'myOrg'
            }))
            assert(org.create.calledWith({
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl',
                token: 'abc'
            }))
            assert(webhook.create.called)
        })

        it('should send validation error if orgId, org, gist, token is absent when create org entry', async () => {
            req = {
                args: {},
                user: {}
            }
            try {
                await org_api.create(req)
                assert(false, 'should have thrown an error')
            } catch (error) {
                assert(!org.get.called)
                assert(!org.create.called)
                assert(!webhook.create.called)
            }
        })

        it('should send duplicate org error if org already linked when create org entry', async () => {
            testErr.org.get = null
            testRes.org.get = {
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl'
            }
            try {
                await org_api.create(req)
                assert(false, 'should have thrown an error')
            } catch (error) {
                assert(error.message === 'This org is already linked.')
                assert(org.get.called)
                assert(!org.create.called)
                assert(!webhook.create.called)
            }
        })

        it('should not create hook when create org entry fail', async () => {
            testErr.org.create = 'Create org error'
            try {
                await org_api.create(req)
                assert(false, 'should have thrown an error')
            } catch (error) {
                assert(org.get.called)
                assert(org.create.called)
                assert(!webhook.create.called)
            }
        })
    })

    describe('orgApi:getForUser', () => {
        it('should collect github orgs and search for linked orgs', async () => {
            let req = {
                args: {},
                user: {
                    token: 'abc',
                    login: 'test_user'
                }
            }

            const orgs = await org_api.getForUser(req)
            sinon.assert.calledOnce(github.callGraphql)
            sinon.assert.calledWithMatch(org.getMultiple, { orgId: ['2', '3'] })
            assert.equal(orgs.length, 2)
        })

        it('should handle github error', async () => {
            testErr.githubCall = 'any github error'
            let req = {
                args: {},
                user: {
                    token: 'abc',
                    login: 'test_user'
                }
            }

            try {
                await org_api.getForUser(req)
                assert(false, 'should have thrown an error')
            } catch (error) {
                assert(error)
            }
        })
    })

    describe('remove', () => {
        beforeEach(function () {
            req = {
                args: {
                    orgId: 1
                }
            }
            testRes.org.remove = {
                orgId: 1,
                org: 'myOrg',
            }
            sinon.stub(org, 'remove').callsFake(async () => {
                if (testErr.org.remove) {
                    throw new Error(testErr.org.remove)
                }
                return testRes.org.remove
            })
            sinon.stub(webhook, 'remove').callsFake(async () => {
                if (testErr.webhook.remove) {
                    throw new Error(testErr.webhook.remove)
                }
                return testRes.webhook.remove
            })
        })

        afterEach(() => {
            org.remove.restore()
            webhook.remove.restore()
        })

        it('should remove org entry and remove org webhook', async () => {
            await org_api.remove(req)
            assert(org.remove.calledWith({
                orgId: 1,
                org: 'myOrg'
            }))
            assert(req.args.org)
            assert(webhook.remove.called)
        })

        it('should send error when remove org fail', async () => {
            testErr.org.remove = 'Remove org error'
            try {
                await org_api.remove(req)
                assert(false, 'should have thrown an error')
            } catch (error) {
                assert(org.remove.called)
                assert(!webhook.remove.called)
            }
        })

        it('should send validation error when org or orgId is absent', async () => {
            req = {
                args: {}
            }
            try {
                await org_api.remove(req)
                assert(false, 'should have thrown an error')
            } catch (error) {
                assert(!org.remove.called)
                assert(!webhook.remove.called)
            }
        })

        it('should throw error when org is not found', async () => {
            req = {
                args: {
                    org: 'org',
                    orgId: 1
                }
            }
            testRes.org.remove = undefined
            try {
                await org_api.remove(req)
                assert(false, 'should have thrown an error')
            } catch (error) {
                assert(org.remove.called)
                assert(!webhook.remove.called)
            }
        })
    })
})
