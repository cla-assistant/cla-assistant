/*global describe, it, beforeEach, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')

//model
const Org = require('../../../server/documents/org').Org

// service under test
const org = require('../../../server/services/org')

// test data
const testData = require('../testData').data

describe('org:create', async function () {
    afterEach(function () {
        Org.create.restore()
    })

    it('should create org entry ', async () => {
        sinon.stub(Org, 'create').callsFake(async (args) => {
            assert(args.orgId)
            assert(args.org)
            assert(args.gist)
            return { org: args.org }
        })

        const arg = {
            org: testData.orgs[0].login,
            orgId: testData.orgs[0].id,
            gist: 'url/gistId',
            token: 'abc'
        }
        await org.create(arg)
    })

})
describe('org:update', () => {
    afterEach(() => Org.findOne.restore())

    it('should create org entry ', async () => {
        sinon.stub(Org, 'findOne').callsFake(async (args) => {
            assert(args.orgId)
            const org_entry = {
                org: args.org,
                save: () => { /*do nothing*/ }
            }
            sinon.stub(org_entry, 'save').callsFake(async () => {
                assert.equal(org_entry.token, 'abc')
            })
            return org_entry
        })

        const arg = {
            org: testData.orgs[0].login,
            orgId: testData.orgs[0].id,
            gist: 'url/gistId',
            token: 'abc'
        }
        await org.update(arg)
    })
})
describe('org:get', () => {
    afterEach(() => Org.findOne.restore())

    it('should find org entry ', async () => {
        sinon.stub(Org, 'findOne').callsFake(async (args) => {
            assert(args.orgId)
            return { org: args.org }
        })

        let args = {
            orgId: testData.orgs[0].id,
            org: testData.orgs[0].login,
        }

        const org_entry = await org.get(args)
        assert(org_entry)
    })
})
describe('org:getMultiple', () => {
    it('should find multiple entries', async () => {
        sinon.stub(Org, 'find').callsFake(async (args) => {
            assert(args.orgId.$in.length > 0)
            // assert(args.orgId.$in.length > 0)
            return [{}, {}]
        })

        let args = {
            orgId: [1, 2]
        }

        const res = await org.getMultiple(args)
        assert.equal(res.length, 2)
        Org.find.restore()
    })
})
describe('org:remove', () => {
    beforeEach(() => {
        sinon.stub(Org, 'findOneAndRemove').callsFake(async (args) => {
            assert(args.orgId);
            return {}
        })
    })

    afterEach(() => Org.findOneAndRemove.restore())

    it('should find org entry ', async () => {
        let args = {
            orgId: testData.orgs[0].id,
            org: testData.orgs[0].login,
        }
        const org_entry = await org.remove(args)
        assert(org_entry)
    })
})
