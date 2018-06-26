let assert = require('assert');
let Org = require('../../../server/documents/org').Org;

// test data
let testData = require('../testData').data;

describe('org document', function () {
    it('should properly work with legacy organisations without excludePattern', function (it_done) {
        let testOrg = testData.org_from_db;
        let org = new Org(testOrg);

        assert.equal(org.isRepoExcluded('foo'), false);
        assert.equal(org.isRepoExcluded('qux'), false);
        it_done();
    });
    it('should properly parse excluded repositories', function (it_done) {
        let testOrg = testData.org_from_db_with_excluded_patterns;
        let org = new Org(testOrg);

        assert.equal(org.isRepoExcluded('foo'), true);
        assert.equal(org.isRepoExcluded('qux'), false);
        it_done();
    });
    it('should properly parse empty exclusion pattern', function (it_done) {
        let testOrg = testData.org_from_db_with_empty_excluded_patterns;
        let org = new Org(testOrg);

        assert.equal(org.isRepoExcluded('foo'), false);
        assert.equal(org.isRepoExcluded('qux'), false);
        it_done();
    });
    it('should properly parse whitelisted users', function (it_done) {
        let testOrg = testData.org_from_db_with_excluded_patterns;
        testOrg.whiteListPattern = 'login0,*1,*[bot]';
        let org = new Org(testOrg);

        assert.equal(org.isUserWhitelisted('login0'), true);
        assert.equal(org.isUserWhitelisted('login1'), true);
        assert.equal(org.isUserWhitelisted('user[bot]'), true);
        assert.equal(org.isUserWhitelisted('login2'), false);
        it_done();
    });
    it('should properly parse empty whitelist pattern', function (it_done) {
        let testOrg = testData.org_from_db_with_empty_excluded_patterns;
        let org = new Org(testOrg);

        assert.equal(org.isUserWhitelisted('login0'), false);
        assert.equal(org.isUserWhitelisted('login1'), false);
        it_done();
    });
});
