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
        testErr.githubCallGraphql = null;
        testRes.githubCallGraphql = { res: '', body: JSON.stringify(testData.graphqlUserOrgs) };
        testErr.githubGetMembership = null;
        testRes.githubGetMembership = { data: { role: 'admin' } };

        sinon.stub(github, 'callGraphql').callsFake(function (query, token, done) {
            assert(token);
            done(testErr.githubCallGraphql, testRes.githubCallGraphql.res, testRes.githubCallGraphql.body);
        });
        sinon.stub(github, 'call').callsFake(function (args, done) {
            if (args.fun === 'getOrgs') {
                done(testErr.githubCall, testRes.githubCall);
            }
            if (args.fun === 'getOrgMembership') {
                var deferred = q.defer();
                deferred.resolve(testRes.githubGetMembership);
                return deferred.promise;
            }
        });
        sinon.stub(org, 'getMultiple').callsFake(function (args, done) {
            done(null, [{}, {}]);
        });
        sinon.stub(org, 'create').callsFake(function (args, done) {
            done();
        });
        sinon.stub(logger, 'warn').callsFake(function (msg) {
            assert(msg);
        });
    });
    afterEach(function () {
        github.call.restore();
        github.callGraphql.restore();
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
                sinon.assert.calledOnce(github.callGraphql);
                sinon.assert.calledWithMatch(org.getMultiple, { orgId: ['2', '3'], login: ['org2', 'org3'] });
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
