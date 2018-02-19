let assert = require('assert');
let Org = require('../../../server/documents/org').Org;

// test data
let testData = require('../testData').data;

describe('org document', function () {
  it('should properly work with legacy organisations without excludePattern', function(it_done) {
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
});
