/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var Org = require('../../../server/documents/org').Org;

// service under test
var org = require('../../../server/services/org');

// test data
var testData = require('../testData').data;

describe('org:create', function () {
    afterEach(function () {
        Org.create.restore();
    });

    it('should create org entry ', function (it_done) {
        sinon.stub(Org, 'create', function (args, done) {
            assert(args.orgId);
            assert(args.org);
            assert(args.gist);
            done(null, {
                org: args.org
            });
        });

        var arg = {
            org: testData.orgs[0].login,
            orgId: testData.orgs[0].id,
            gist: 'url/gistId',
            token: 'abc'
        };
        org.create(arg, function (err) {
            assert.ifError(err);
            it_done();
        });
    });

});
describe('org:create', function() {
    afterEach(function() {
        Org.findOne.restore();
    });

    it('should create org entry ', function(it_done) {
        sinon.stub(Org, 'findOne', function(args, done) {
            assert(args.orgId);
            done(null, {
                org: args.org
            });
        });

        var args = {
            orgId: testData.orgs[0].id,
            org: testData.orgs[0].login,
        };

        org.get(args, function (err, org) {
            assert.ifError(err);
            assert(org);
            it_done();
        });
    });
});
