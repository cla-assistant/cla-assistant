/*global describe, it, beforeEach, afterEach*/

// unit test
let assert = require('assert');
let sinon = require('sinon');

// service
let org = require('../../../server/services/org');
let github = require('../../../server/services/github');
let logger = require('../../../server/services/logger');
let webhook = require('../../../server/api/webhook');
let q = require('q');

// test data
let testData = require('../testData').data;

// api
let org_api = require('../../../server/api/org');


describe('org api', function () {
    let testErr = {};
    let testRes = {};
    let req = null;
    beforeEach(function () {
        req = {
            args: {
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl'
            },
            user: {
                token: 'abc'
            }
        };
        testErr.githubCall = null;
        testRes.githubCall = testData.orgs;
        testErr.githubCallGraphql = null;
        testRes.githubCallGraphql = { res: '', body: JSON.stringify(testData.graphqlUserOrgs) };
        testErr.githubGetMembership = null;
        testRes.githubGetMembership = { data: { role: 'admin' } };
        testErr.webhook = {};
        testRes.webhook = {};
        testErr.org = {};
        testRes.org = {};

        sinon.stub(github, 'callGraphql').callsFake(function (query, token, done) {
            assert(token);
            done(testErr.githubCallGraphql, testRes.githubCallGraphql.res, testRes.githubCallGraphql.body);
        });
        sinon.stub(github, 'call').callsFake(function (args, done) {
            if (args.fun === 'getOrgs') {
                done(testErr.githubCall, testRes.githubCall);
            }
            if (args.fun === 'getOrgMembership') {
                let deferred = q.defer();
                deferred.resolve(testRes.githubGetMembership);

return deferred.promise;
            }
        });
        sinon.stub(org, 'getMultiple').callsFake(function (args, done) {
            done(null, [{}, {}]);
        });
        sinon.stub(org, 'create').callsFake(function (args, done) {
            done(testErr.org.create, testRes.org.create);
        });
        sinon.stub(org, 'get').callsFake(function (args, done) {
            done(testErr.org.get, testRes.org.get);
        });
        sinon.stub(logger, 'warn').callsFake(function (msg) {
            assert(msg);
        });
        sinon.stub(webhook, 'create').callsFake(function (args, done) {
            done(testErr.webhook.create, testRes.webhook.create);
        });
    });
    afterEach(function () {
        github.call.restore();
        github.callGraphql.restore();
        org.getMultiple.restore();
        org.create.restore();
        org.get.restore();
        logger.warn.restore();
        webhook.create.restore();
    });

    describe('create', function () {
        it('should create new org via org service and create org webhook', function (it_done) {
            org_api.create(req, function () {
                assert(org.get.calledWith({
                    orgId: 1,
                    org: 'myOrg'
                }));
                assert(org.create.calledWith({
                    orgId: 1,
                    org: 'myOrg',
                    gist: 'gistUrl',
                    token: 'abc'
                }));
                assert(webhook.create.called);
                it_done();
            });
        });

        it('should send validation error if orgId, org, gist, token is absent when create org entry', function (it_done) {
            req = {
                args: {},
                user: {}
            };
            org_api.create(req, function (err) {
                assert(err);
                assert(!org.get.called);
                assert(!org.create.called);
                assert(!webhook.create.called);
                it_done();
            });
        });

        it('should send duplicate org error if org already linked when create org entry', function (it_done) {
            testErr.org.get = null;
            testRes.org.get = {
                orgId: 1,
                org: 'myOrg',
                gist: 'gistUrl'
            };
            org_api.create(req, function (err) {
                assert(err === 'This org is already linked.');
                assert(org.get.called);
                assert(!org.create.called);
                assert(!webhook.create.called);
                it_done();
            });
        });

        it('should not create hook when create org entry fail', function (it_done) {
            testErr.org.create = 'Create org error';
            org_api.create(req, function (err) {
                assert(err);
                assert(org.get.called);
                assert(org.create.called);
                assert(!webhook.create.called);
                it_done();
            });
        });
    });

    describe('orgApi:getForUser', function () {
        it('should collect github orgs and search for linked orgs', function (it_done) {
            let req = {
                args: {},
                user: {
                    token: 'abc',
                    login: 'test_user'
                }
            };

            org_api.getForUser(req, function (err, orgs) {
                assert.ifError(err);
                sinon.assert.calledOnce(github.callGraphql);
                sinon.assert.calledWithMatch(org.getMultiple, { orgId: ['2', '3'] });
                assert.equal(orgs.length, 2);
                it_done();
            });
        });

        it('should handle github error', function (it_done) {
            testErr.githubCall = 'any github error';
            let req = {
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

    describe('remove', function () {
        beforeEach(function () {
            req = {
                args: {
                    orgId: 1
                }
            };
            testRes.org.remove = {
                orgId: 1,
                org: 'myOrg',
            };
            sinon.stub(org, 'remove').callsFake(function (args, done) {
                done(testErr.org.remove, testRes.org.remove);
            });
            sinon.stub(webhook, 'remove').callsFake(function (args, done) {
                done(testErr.webhook.remove, testRes.webhook.remove);
            });
        });

        afterEach(function () {
            org.remove.restore();
            webhook.remove.restore();
        });

        it('should remove org entry and remove org webhook', function (it_done) {
            org_api.remove(req, function () {
                assert(org.remove.calledWith({
                    orgId: 1,
                    org: 'myOrg'
                }));
                assert(req.args.org);
                assert(webhook.remove.called);
                it_done();
            });
        });

        it('should send error when remove org fail', function (it_done) {
            testErr.org.remove = 'Remove org error';
            org_api.remove(req, function (err) {
                assert(err);
                assert(org.remove.called);
                assert(!webhook.remove.called);
                it_done();
            });
        });

        it('should send validation error when org or orgId is absent', function (it_done) {
            req = {
                args: {}
            };
            org_api.remove(req, function (err) {
                assert(err);
                assert(!org.remove.called);
                assert(!webhook.remove.called);
                it_done();
            });
        });

        it('should return message when org is not found', function (it_done) {
            req = {
                args: {
                    org: 'org',
                    orgId: 1
                }
            };
            testRes.org.remove = undefined;
            org_api.remove(req, (err, msg) => {
                assert.ifError(err);
                assert(msg);
                it_done();
            });
        });
    });
});
