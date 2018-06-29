/*global describe, it, beforeEach, afterEach*/

// unit test
let assert = require('assert');
let sinon = require('sinon');

//model
let Org = require('../../../server/documents/org').Org;

// service under test
let org = require('../../../server/services/org');

// test data
let testData = require('../testData').data;

describe('org:create', function () {
    afterEach(function () {
        Org.create.restore();
    });

    it('should create org entry ', function (it_done) {
        sinon.stub(Org, 'create').callsFake(function (args, done) {
            assert(args.orgId);
            assert(args.org);
            assert(args.gist);
            done(null, {
                org: args.org
            });
        });

        let arg = {
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
describe('org:update', function () {
    afterEach(function () {
        Org.findOne.restore();
    });

    it('should create org entry ', function (it_done) {
        sinon.stub(Org, 'findOne').callsFake(function (args, done) {
            assert(args.orgId);
            done(null, {
                org: args.org,
                save: function (cb) {
                    assert.equal(this.token, 'abc');
                    cb();
                }
            });
        });

        let arg = {
            org: testData.orgs[0].login,
            orgId: testData.orgs[0].id,
            gist: 'url/gistId',
            token: 'abc'
        };
        org.update(arg, function (err) {
            assert.ifError(err);
            it_done();
        });
    });

});
describe('org:get', function () {
    afterEach(function () {
        Org.findOne.restore();
    });

    it('should find org entry ', function (it_done) {
        sinon.stub(Org, 'findOne').callsFake(function (args, done) {
            assert(args.orgId);
            done(null, {
                org: args.org
            });
        });

        let args = {
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
describe('org:getMultiple', function () {
    it('should find multiple entries', function (it_done) {
        sinon.stub(Org, 'find').callsFake(function (args, done) {
            assert(args.orgId.$in.length > 0);
            // assert(args.orgId.$in.length > 0);
            done(null, [{}, {}]);
        });

        let args = {
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
describe('org:remove', function () {
    beforeEach(function () {
        sinon.stub(Org, 'findOneAndRemove').callsFake(function (args, done) {
            assert(args.orgId);
            done(null, {});
        });
    });

    afterEach(function () {
        Org.findOneAndRemove.restore();
    });

    it('should find org entry ', function (it_done) {
        let args = {
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
