/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');

//model
var Repo = require('../../../server/documents/repo').Repo;
var Org = require('../../../server/documents/org').Org;

// api
var webhook_api = require('../../../server/api/webhook');

var testData = require('../testData').data;

describe('webhook:create', function () {
    it('should call github service with user token', function (it_done) {
        sinon.stub(Repo, 'findOne', function (args, done) {
            var repo = { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/gistId' };
            done(null, repo);
        });

        sinon.stub(github, 'call', function (args, done) {
            assert.deepEqual(args,
                {
                    obj: 'repos',
                    fun: 'createHook',
                    arg: {
                        user: 'login',
                        repo: 'myRepo',
                        name: 'web',
                        config: { url: url.webhook('myRepo'), content_type: 'json' },
                        events: ['pull_request'],
                        active: true
                    },
                    token: 'abc'
                });
            done();
        });

        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { repo: 'myRepo', owner: 'login' } };

        webhook_api.create(req, function () {
            github.call.restore();
            Repo.findOne.restore();
            it_done();
        });
    });

    it('should create a webhook for an organisation', function (it_done) {
        sinon.stub(github, 'direct_call', function (args, done) {
            assert.deepEqual(args,
                {
                    url: testData.orgs[0].hooks_url,
                    body: {
                        name: 'web',
                        config: { url: url.webhook(testData.orgs[0].login), content_type: 'json' },
                        events: ['pull_request'],
                        active: true
                    },
                    token: 'abc',
                    http_method: 'POST'
                });
            done();
        });

        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { org: testData.orgs[0].login, orgId: testData.orgs[0].id } };

        webhook_api.create(req, function () {
            assert(github.direct_call.called);

            github.direct_call.restore();
            it_done();
        });
    });
});

describe('webhook:get', function () {
    it('should call github service with user token for repo hooks', function (it_done) {
        sinon.stub(github, 'call', function (args, done) {
            assert.deepEqual(args,
                {
                    obj: 'repos',
                    fun: 'getHooks',
                    arg: {
                        user: 'owner',
                        repo: 'myRepo'
                    },
                    token: 'abc'
                });
            done(null, [{ config: { url: url.webhook('myRepo'), content_type: 'json' }, }]);
        });

        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { repo: 'myRepo', user: 'owner' } };

        webhook_api.get(req, function (err, hooks) {
            assert(hooks);
            github.call.restore();
            it_done();
        });
    });

    it('should call github service with user token for org hooks', function (it_done) {
        sinon.stub(github, 'call', function (args, done) {
            assert.deepEqual(args,
                {
                    obj: 'orgs',
                    fun: 'getHooks',
                    arg: {
                        org: 'org'
                    },
                    token: 'abc'
                });
            done(null, [{ config: { url: url.webhook(testData.orgs[0].login), content_type: 'json' } }]);
        });

        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { org: 'org' } };

        webhook_api.get(req, function (err, hooks) {
            assert(hooks);
            github.call.restore();
            it_done();
        });
    });
});

describe('webhook:remove', function () {
    var resGetHooks;
    beforeEach(function () {
        resGetHooks = [{ id: 123, config: { url: url.baseWebhook } }];
        sinon.stub(github, 'call', function (args, done) {
            if (args.fun === 'getHooks') {
                done(null, resGetHooks);
            } else if (args.fun === 'deleteHook') {
                done();
            }
        });
        sinon.stub(Repo, 'findOne', function (args, done) {
            var repo = { repo: 'myRepo', owner: 'login', gist: 'https://gist.github.com/myRepo/gistId' };
            done(null, repo);
        });
    });
    afterEach(function () {
        github.call.restore();
        Repo.findOne.restore();
    });

    it('should call github service with user token for REPO hook', function (it_done) {
        var expArgs = {
            obj: 'repos',
            fun: 'deleteHook',
            arg: {
                user: 'login',
                repo: 'myRepo',
                id: 123
            },
            token: 'abc'
        };

        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { repo: 'myRepo', user: 'login' } };

        webhook_api.remove(req, function () {
            assert(github.call.calledWith(expArgs));
            it_done();
        });
    });

    it('should call github service with user token for ORG hook', function (it_done) {
        var expArgs = {
            obj: 'orgs',
            fun: 'deleteHook',
            arg: {
                org: 'octocat',
                id: 123
            },
            token: 'abc'
        };

        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { org: 'octocat' } };

        webhook_api.remove(req, function () {
            assert(github.call.calledWith(expArgs));
            it_done();
        });
    });

    it('should report error if could not delete hook', function (it_done) {
        resGetHooks = [{ id: 123, config: { url: 'any other url' } }];

        var req = { user: { id: 1, login: 'login', token: 'abc' }, args: { repo: 'myRepo', user: 'login' } };

        webhook_api.remove(req, function (error) {
            assert.equal(error, 'No webhook found with base url ' + url.baseWebhook);

            it_done();
        });
    });
});
