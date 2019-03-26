/*global describe, it, beforeEach, afterEach*/

// unit test
let assert = require('assert');
let sinon = require('sinon');

// module
let github = require('../../../server/services/github');
let url = require('../../../server/services/url');

//model
let Repo = require('../../../server/documents/repo').Repo;

// api
let webhook_api = require('../../../server/api/webhook');

let testData = require('../testData').data;

describe('webhookApi', function () {
    let hook;
    let repo;
    let resGetRepoHooks;
    let resGetOrgHooks;
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
                if (args.obj === 'repos') {
                    done(null, resGetRepoHooks);
                } else {
                    done(null, resGetOrgHooks);
                }
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
            let expArgs = {
                obj: 'repos',
                fun: 'createHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    name: 'web',
                    config: {
                        url: url.webhook('login', 'myRepo'),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            };

            let req = {
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
            let expArgs = {
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

            let req = {
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
            let expArgs = {
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

            let req = {
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
            let expArgs = {
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

            let req = {
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
            let expArgs = {
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

            let req = {
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
            let expArgs = {
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

            let req = {
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
            let expArgs = {
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

            let req = {
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
                assert.ifError(err);
                assert(hooks);
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });

        it('should call github service with user token for org hooks when repo hook does NOT exist', function (it_done) {
            resGetRepoHooks = [];
            let expArgs = {
                obj: 'orgs',
                fun: 'getHooks',
                arg: {
                    org: 'owner'
                },
                token: 'abc'
            };

            let req = {
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

            webhook_api.get(req, function () {
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });

        it('should call github service with user token for org hooks', function (it_done) {
            let expArgs = {
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

            let req = {
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
                assert.ifError(err);
                assert(hooks);
                assert(github.call.calledWithMatch(expArgs));
                it_done();
            });
        });
    });

    describe('webhook:remove', function () {
        it('should remove repo hook when it exists', function (it_done) {
            hook.type = 'Repository';
            let expArgs = {
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    id: 123
                },
                token: 'abc'
            };

            let req = {
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
            let expArgs = {
                obj: 'orgs',
                fun: 'deleteHook',
                arg: {
                    org: 'octocat',
                    id: 123
                },
                token: 'abc'
            };

            let req = {
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
            let expArgs = {
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

            let req = {
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

            let req = {
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
                assert.equal(error, 'No webhook found with base url ' + url.webhook(req.args.owner, req.args.repo));
                it_done();
            });
        });
    });
});
