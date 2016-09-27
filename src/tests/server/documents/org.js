var assert = require('assert');
var Org = require('../../../server/documents/org').Org;

// test data
var testData = require('../testData').data;

describe('org document', function () {
  it('should properly work with legacy organisations without excludePattern', function(it_done) {
    var testOrg = testData.org_from_db;
    var org = new Org(testOrg);

    assert.equal(org.isRepoExcluded('foo'), false);
    assert.equal(org.isRepoExcluded('qux'), false);
    it_done();
  });
  it('should properly parse excluded repositories', function (it_done) {
    var testOrg = testData.org_from_db_with_excluded_patterns;
    var org = new Org(testOrg);

    assert.equal(org.isRepoExcluded('foo'), true);
    assert.equal(org.isRepoExcluded('qux'), false);
    it_done();
  });
  it('should properly parse empty exclusion pattern', function (it_done) {
    var testOrg = testData.org_from_db_with_empty_excluded_patterns;
    var org = new Org(testOrg);

    assert.equal(org.isRepoExcluded('foo'), false);
    assert.equal(org.isRepoExcluded('qux'), false);
    it_done();
  });
});
