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
describe('org:get', function() {
    afterEach(function() {
        Org.findOne.restore();
    });

    it('should find org entry ', function(it_done) {
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
describe('org:getMultiple', function() {
    it('should find muliple entries', function (it_done) {
        sinon.stub(Org, 'find', function (args, done) {
            assert(args.orgId.$in.length > 0);
            done(null, [{}, {}]);
        });

        var args = {
            orgId: [1, 2]
        };

        org.getMultiple(args, function (err, res) {
            assert.equal(res.length, 2);
            assert.ifError(err);
            Org.find.restore();
            it_done();
        });
    });
});
describe('org:remove', function() {
    afterEach(function() {
        Org.remove.restore();
    });

    it('should find org entry ', function(it_done) {
        sinon.stub(Org, 'remove', function(args, done) {
            assert(args.orgId);
            done(null, {});
        });

        var args = {
            orgId: testData.orgs[0].id,
            org: testData.orgs[0].login,
        };

        org.remove(args, function (err, org) {
            assert.ifError(err);
            assert(org);
            it_done();
        });
    });
});
