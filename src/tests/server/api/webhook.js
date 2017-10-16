/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');

//model
var Repo = require('../../../server/documents/repo').Repo;

// api
var webhook_api = require('../../../server/api/webhook');

var testData = require('../testData').data;

describe('webhookApi', function () {
    var resGetHooks;
    beforeEach(function () {
        resGetHooks = [{
            id: 123,
            config: {
                url: url.baseWebhook
            }
        }];
        sinon.stub(github, 'call').callsFake(function (args, done) {
            if (args.fun === 'getHooks') {
                done(null, resGetHooks);
            } else {
                done();
            }
        });
        sinon.stub(Repo, 'findOne').callsFake(function (args, done) {
            var repo = {
                repo: 'myRepo',
                owner: 'login',
                gist: 'https://gist.github.com/myRepo/gistId'
            };
            done(null, repo);
        });
    });
    afterEach(function () {
        github.call.restore();
        Repo.findOne.restore();
    });
    describe('webhook:create', function () {
        it('should call github service with user token', function (it_done) {
            var expArgs = {
                obj: 'repos',
                fun: 'createHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    name: 'web',
                    config: {
                        url: url.webhook('myRepo'),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            };

            var req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            };

            webhook_api.create(req, function () {
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });

        it('should create a webhook for an organisation', function (it_done) {
            var expArgs = {
                obj: 'orgs',
                fun: 'createHook',
                arg: {
                    org: testData.orgs[0].login,
                    name: 'web',
                    config: {
                        url: url.webhook(testData.orgs[0].login),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            };

            var req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: testData.orgs[0].login,
                    orgId: testData.orgs[0].id
                }
            };

            webhook_api.create(req, function () {
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });
    });

    describe('webhook:get', function () {
        it('should call github service with user token for repo hooks', function (it_done) {
            var expArgs = {
                obj: 'repos',
                fun: 'getHooks',
                arg: {
                    user: 'owner',
                    repo: 'myRepo'
                },
                token: 'abc'
            };
            resGetHooks = [{
                config: {
                    url: url.webhook('myRepo'),
                    content_type: 'json'
                },
            }];

            var req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    user: 'owner'
                }
            };

            webhook_api.get(req, function (err, hooks) {
                assert(hooks);
                github.call.calledWithMatch(expArgs);
                it_done();
            });
        });

        it('should call github service with user token for org hooks', function (it_done) {
            var expArgs = {
                obj: 'orgs',
                fun: 'getHooks',
                arg: {
                    org: 'org'
                },
                token: 'abc'
            };
            resGetHooks = [{
                config: {
                    url: url.webhook(testData.orgs[0].login),
                    content_type: 'json'
                }
            }];

            var req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: 'org'
                }
            };

            webhook_api.get(req, function (err, hooks) {
                assert(hooks);
                github.call.calledWithMatch(expArgs);
                it_done();
            });
        });
    });

    describe('webhook:remove', function () {
        it('should call github service with user token for REPO hook', function (it_done) {
            var expArgs = {
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    id: 123
                },
                token: 'abc'
            };

            var req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            };

            webhook_api.remove(req, function () {
                assert(github.call.calledWithMatch(expArgs));
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

            var req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: 'octocat'
                }
            };

            webhook_api.remove(req, function () {
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });

        it('should report error if could not delete hook', function (it_done) {
            resGetHooks = [{
                id: 123,
                config: {
                    url: 'any other url'
                }
            }];

            var req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            };

            webhook_api.remove(req, function (error) {
                assert.equal(error, 'No webhook found with base url ' + url.baseWebhook);

                it_done();
            });
        });
    });
});
