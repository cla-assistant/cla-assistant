/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// service
var org = require('../../../server/services/org');
var github = require('../../../server/services/github');
var logger = require('../../../server/services/logger');
var q = require('q');

// test data
var testData = require('../testData').data;

// api
var org_api = require('../../../server/api/org');


describe('org api', function () {
    var testErr = {};
    var testRes = {};
    beforeEach(function () {
        testErr.githubCall = null;
        testRes.githubCall = testData.orgs;
        testErr.githubGetMembershipp = null;
        testRes.githubGetMembershipp = { data: {role: 'admin'}};

        sinon.stub(github, 'call', function (args, done) {
            if (args.fun === 'getOrgs') {
                done(testErr.githubCall, testRes.githubCall);
            }
            if (args.fun === 'getOrganizationMembership') {
                var deferred = q.defer();
                deferred.resolve(testRes.githubGetMembershipp);
                return deferred.promise;
            }
        });
        sinon.stub(org, 'getMultiple', function (args, done) {
            done(null, [{}, {}]);
        });
        sinon.stub(org, 'create', function (args, done) {
            done();
        });
        sinon.stub(logger, 'warn', function (msg) {
            assert(msg);
        });
    });
    afterEach(function () {
        github.call.restore();
        org.getMultiple.restore();
        org.create.restore();
        logger.warn.restore();
    });

    it('should create new org via org service', function (it_done) {
        var req = {
            args: {
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl'
            },
            user: {
                token: 'abc'
            }
        };

        org_api.create(req, function () {
            org.create.calledWith({
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl',
                token: 'abc'
            });
            it_done();
        });
    });

    describe('orgApi:getForUser', function () {
        it('should collect github orgs and search for linked orgs', function (it_done) {
            var req = {
                args: {},
                user: {
                    token: 'abc',
                    login: 'test_user'
                }
            };

            org_api.getForUser(req, function (err, orgs) {
                assert.equal(github.call.calledWithMatch({
                    obj: 'users',
                    fun: 'getOrganizationMembership',
                    token: 'abc'
                }), true);

                assert.equal(org.getMultiple.calledWithMatch({ orgId: [1, 2] }), true);
                assert.equal(orgs.length, 2);
                it_done();
            });
        });

        it('should handle github error', function (it_done) {
            testErr.githubCall = 'any github error';
            var req = {
                args: {},
                user: {
                    token: 'abc',
                    login: 'test_user'
                }
            };

            org_api.getForUser(req, function (err, orgs) {
                assert(err);
                assert(!orgs);
                it_done();
            });
        });
    });
});
