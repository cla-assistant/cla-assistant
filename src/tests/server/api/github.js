/*global describe, it, beforeEach, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')

// api
const github_api = require('../../../server/api/github')

// module
const github = require('../../../server/services/github')

describe('github:call', () => {
    beforeEach(() => sinon.stub(github, 'call').callsFake(async args => {
        assert.deepEqual(args, { obj: 'gists', fun: 'list', token: 'abc' })
        return { data: '', headers: '' }
    }))

    afterEach(() => github.call.restore())

    it('should call github service with user token', async () => {
        const req = { user: { id: 1, login: 'login', token: 'abc' }, args: { obj: 'gists', fun: 'list' } }

        await github_api.call(req)
    })
})
