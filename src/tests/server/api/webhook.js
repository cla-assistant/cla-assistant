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
    var hook;
    var repo;
    var resGetRepoHooks;
    var resGetOrgHooks;
    beforeEach(function () {
        hook = {
            id: 123,
            active: true,
            config: {
                url: url.baseWebhook
            }
        };
        repo = {
            id: 123,
            repo: 'myRepo',
            owner: 'login',
            gist: 'https://gist.github.com/myRepo/gistId'
        };
        resGetRepoHooks = [hook];
        resGetOrgHooks = [hook];
        sinon.stub(github, 'call').callsFake(function (args, done) {
            if (args.fun === 'getHooks') {
                args.obj === 'repos' ? done(null, resGetRepoHooks) :  done(null, resGetOrgHooks);
            } else if (args.fun === 'deleteHook') {
                done(null, hook);
            } else if (args.fun === 'createHook') {
                done(null, hook);
            } else {
                done();
            }
        });
        sinon.stub(Repo, 'find').callsFake(function (args, done) {
            done(null, [repo]);
        });
    });
    afterEach(function () {
        github.call.restore();
        Repo.find.restore();
    });
    describe('webhook:create', function () {
        it('should create a repo webhook when both repo and org webhook does NOT exist', function (it_done) {
            resGetRepoHooks = [];
            resGetOrgHooks = [];
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

        it('should NOT create a repo webhook when repo webhook exists', function (it_done) {
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
                assert(github.call.calledWithMatch(expArgs) === false);
                it_done();
            });
        });

        it('should NOT create a repo webhook when corresponding org webhook exists', function (it_done) {
            resGetRepoHooks = [];
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
                assert(github.call.calledWithMatch(expArgs) === false);
                it_done();
            });
        });

        it('should create a webhook for an organization when org webhook does NOT exist', function (it_done) {
            resGetOrgHooks = [];
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

        it('should remove repo webhook after creating an org webhook', function (it_done) {
            resGetOrgHooks = [];
            hook.type = 'Repository';
            var expArgs = {
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    id: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    noCache: true
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

        it('should NOT remove a webhook for a repo with NULL CLA after creating an org webhook', function (it_done) {
            repo.gist = null;
            var expArgs = {
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    id: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    noCache: true
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
                assert(!github.call.calledWithMatch(expArgs));
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
                    owner: 'owner',
                    repo: 'myRepo'
                },
                token: 'abc'
            };
            resGetRepoHooks = [{
                active: true,
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
                    owner: 'owner'
                }
            };

            webhook_api.get(req, function (err, hooks) {
                assert(hooks);
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });

        it('should call github service with user token for org hooks when repo hook does NOT exist', function (it_done) {
            resGetRepoHooks = [];
            var expArgs = {
                obj: 'orgs',
                fun: 'getHooks',
                arg: {
                    org: 'owner'
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
                    owner: 'owner'
                }
            };

            webhook_api.get(req, function (err, hooks) {
                assert(github.call.calledWithMatch(expArgs));
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
            resGetOrgHooks = [{
                active: true,
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
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });
    });

    describe('webhook:remove', function () {
        it('should remove repo hook when it exists', function (it_done) {
            hook.type = 'Repository';
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

        it('should remove org hook when it exists', function (it_done) {
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

        it('should NOT create hook for repo with NULL CLA after removing org hook', function (it_done) {
            resGetRepoHooks = [];
            repo.gist = null;
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
                    org: 'octocat'
                }
            };

            webhook_api.remove(req, function () {
                assert(github.call.calledWithMatch(expArgs) === false);
                it_done();
            });
        });

        it('should report error if could not delete repo hook', function (it_done) {
            resGetRepoHooks = [{
                id: 123,
                active: true,
                config: {
                    url: 'any other url'
                }
            }];
            resGetOrgHooks = [{
                id: 321,
                active: true,
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
