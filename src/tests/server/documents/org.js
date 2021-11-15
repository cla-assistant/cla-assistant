const assert = require('assert')
const Org = require('../../../server/src/documents/org').Org

// test data
const testData = require('../testData').data

describe('org document', () => {
    it('should properly work with legacy organisations without excludePattern', async () => {
        const testOrg = testData.org_from_db
        const org = new Org(testOrg)

        assert.equal(org.isRepoExcluded('foo'), false)
        assert.equal(org.isRepoExcluded('qux'), false)
    })

    it('should properly parse excluded repositories', async () => {
        const testOrg = testData.org_from_db_with_excluded_patterns
        const org = new Org(testOrg)

        assert.equal(org.isRepoExcluded('foo'), true)
        assert.equal(org.isRepoExcluded('qux'), false)
    })

    it('should properly parse empty exclusion pattern', async () => {
        const testOrg = testData.org_from_db_with_empty_excluded_patterns
        const org = new Org(testOrg)

        assert.equal(org.isRepoExcluded('foo'), false)
        assert.equal(org.isRepoExcluded('qux'), false)
    })

    it('should properly parse allowlist', async () => {
        const testOrg = testData.org_from_db_with_excluded_patterns
        testOrg.allowListPattern = 'login0,*1,*[bot]'
        const org = new Org(testOrg)

        assert.equal(org.isUserOnAllowlist('login0'), true)
        assert.equal(org.isUserOnAllowlist('login1'), true)
        assert.equal(org.isUserOnAllowlist('user[bot]'), true)
        assert.equal(org.isUserOnAllowlist('login2'), false)
    })

    it('should properly parse empty allowlist', async () => {
        const testOrg = testData.org_from_db_with_empty_excluded_patterns
        const org = new Org(testOrg)

        assert.equal(org.isUserOnAllowlist('login0'), false)
        assert.equal(org.isUserOnAllowlist('login1'), false)
    })
})
