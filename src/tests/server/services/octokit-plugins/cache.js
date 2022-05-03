// unit test
// const rewire = require('rewire')
// const assert = require('assert')
const sinon = require('sinon')

//plugin
// const cachePlugin = rewire('../../../../server/src/services/octokit-plugins/cache').cache

//model
const Cache = require('../../../../server/src/documents/cache').Cache

let testRes = {}
let testErr = {}

const stub = () => {
    testErr.cacheFindOne = 'error'
    testErr.cacheCreate = 'error'

    testRes.cacheFindOne = {
        cache_key: 'cacheKey',
        cache_value: {
            headers: {
                etag: 'W/"abcxyz"'
            },
            data: {}
        },
        save: sinon.stub().resolves(),
    }
    testRes.cacheCreate = 'success'

    sinon.stub(Cache, 'findOne').callsFake(async () => {
        if (testErr.cacheFindOne === null) {
            throw testErr.cacheFindOne
        }
        return testRes.cacheFindOne
    })
    sinon.stub(Cache, 'create').callsFake(async () => {
        if (testErr.cacheCreate === null) {
            throw testErr.cacheCreate
        }
        return testRes.cacheCreate
    })

    sinon.stub(Cache, 'exists').callsFake(async () => {
        return false
    })
}

describe('octokit-plugin:cache', () => {
    beforeEach(() => {
        stub()
    })

    afterEach(() => {
        Cache.findOne.restore()
        Cache.create.restore()
        Cache.exists.restore()
    })

    // it('should check cache for github call results if isUseETag is provided', async () => {
    //     testErr.cacheFindOne = null
    //     const mockInput = {
    //         obj: 'obj',
    //         fun: 'fun',
    //         arg: { isUseETag: true }
    //     }
    //     await github.call(mockInput)
    //     assert(Cache.findOne.called)
    // })
    // it('should use cache for github call results if isUseETag is provided and github returns 304', async () => {
    //     callStub.rejects({ status: 304 })
    //     const mockInput = {
    //         obj: 'obj',
    //         fun: 'fun',
    //         arg: { isUseETag: true }
    //     }
    //     const res = await github.call(mockInput)
    //     assert.equal(res, testRes.cacheFindOne.cache_value)
    // })
    // it('should create cache if isUseETag is provided and the response header contains etag', async () => {
    //     callStub.resolves(testRes.cacheFindOne.cache_value)
    //     testErr.cacheFindOne = null
    //     const mockInput = {
    //         obj: 'obj',
    //         fun: 'fun',
    //         arg: { isUseETag: true }
    //     }
    //     await github.call(mockInput)
    //     assert(Cache.create.called)
    // })
})