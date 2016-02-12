/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// config
global.config = require('../../../config');

// models
var Repo = require('../../../server/documents/repo').Repo;

//services
var github = require('../../../server/services/github');
var url = require('../../../server/services/url');
var cla = require('../../../server/services/cla');
var repo_service = require('../../../server/services/repo');
var statusService = require('../../../server/services/status');
var prService = require('../../../server/services/pullRequest');
var log = require('../../../server/services/logger');

// Test data
var testData = require('../testData').data;

// api
var cla_api = require('../../../server/api/cla');

describe('', function() {
    var reqArgs;
    var resp;
    var error;
    beforeEach(function() {
        reqArgs = {
            cla: {
                getRepo: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                },
                getGist: {
                    gist: testData.repo_from_db.gist
                }
            }
        };
        resp = {
            cla: {
                getRepo: JSON.parse(JSON.stringify(testData.repo_from_db)), //clone object
                getGist: JSON.parse(JSON.stringify(testData.gist)) //clone object
            },
            github: {
                directCall: {
                    data: [{
                        number: 1
                    }, {
                        number: 2
                    }]
                }
            }
        };
        error = {
            cla: {
                getRepo: null,
                getGist: null
            }
        };

        sinon.stub(cla, 'getRepo', function(args, cb) {
            assert.deepEqual(args, reqArgs.cla.getRepo);
            cb(error.cla.getRepo, resp.cla.getRepo);
        });

        sinon.stub(cla, 'getGist', function(args, cb) {
            if (args.gist && args.gist.gist_url) {
                assert.equal(args.gist.gist_url, reqArgs.cla.getGist.gist);
            } else {
                assert.equal(args.gist, reqArgs.cla.getGist.gist);
            }
            cb(error.cla.getGist, resp.cla.getGist);
        });

        sinon.stub(github, 'direct_call', function(args, cb) {
            assert(args.url);
            assert(args.token);
            assert.equal(args.url, url.githubPullRequests('octocat', 'Hello-World', 'open'));

            cb(null, resp.github.directCall);
        });
    });
    afterEach(function() {
        cla.getRepo.restore();
        cla.getGist.restore();
        github.direct_call.restore();
    });
    describe('cla:get', function() {
        it('should get gist and render it with user token', function(it_done) {
            var githubStub = sinon.stub(github, 'call', function(args, cb) {
                var res;
                assert.equal(args.obj, 'markdown');
                assert.equal(args.fun, 'render');
                assert.equal(args.token, 'user_token');
                res = {
                    statusCode: 200,
                    data: {}
                };
                cb(null, res);
            });

            var req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                },
                user: {
                    token: 'user_token'
                }
            };

            cla_api.get(req, function() {
                assert(cla.getRepo.called);

                githubStub.restore();
                it_done();
            });
        });

        it('should get gist and render it with repo token', function(it_done) {
            var githubStub = sinon.stub(github, 'call', function(args, cb) {
                var res;
                assert.equal(args.obj, 'markdown');
                assert.equal(args.fun, 'render');
                assert.equal(args.token, testData.repo_from_db.token);
                res = {
                    statusCode: 200
                };
                cb(null, res);
            });

            var req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            };

            cla_api.get(req, function() {
                assert(cla.getRepo.called);

                githubStub.restore();
                it_done();
            });
        });

        it('should get gist and render it without user token', function(it_done) {
            resp.cla.getRepo.token = undefined;

            var githubStub = sinon.stub(github, 'call', function(args, cb) {
                var res;
                assert.equal(args.obj, 'markdown');
                assert.equal(args.fun, 'render');
                assert.ifError(args.token);
                res = {
                    statusCode: 200
                };
                cb(null, res);
            });

            var req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            };

            cla_api.get(req, function() {
                assert(cla.getRepo.called);

                githubStub.restore();
                it_done();
            });
        });

        it('should handle wrong gist url', function(it_done) {

            var repoStub = sinon.stub(Repo, 'findOne', function(args, cb) {
                var repo = {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    gist: '123',
                    token: 'abc'
                };
                cb(null, repo);
            });

            resp.cla.getGist = undefined;
            error.cla.getGist = 'error';

            var githubStub = sinon.stub(github, 'call', function() {
                assert();
            });

            var req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            };

            cla_api.get(req, function(err) {
                assert.equal(!!err, true);
                githubStub.restore();
                repoStub.restore();
                it_done();
            });

        });

        it('should handle result with no files', function(it_done) {
            resp.cla.getGist.files = undefined;

            var req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            };

            cla_api.get(req, function() {
                assert(cla.getRepo.called);

                it_done();
            });

        });

        describe('in case of failing github api', function() {
            var githubError;
            var githubResponse;
            var req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                },
                user: {
                    token: 'abc'
                }
            };

            beforeEach(function() {
                sinon.stub(github, 'call', function(args, cb) {
                    cb(githubError, githubResponse);
                });
                sinon.stub(log, 'error', function(err) {
                    assert(err);
                });
            });

            afterEach(function() {
                log.error.restore();
                github.call.restore();
            });

            it('should handle github error', function(it_done) {
                githubError = 'any error';
                cla_api.get(req, function(err) {

                    assert(err);
                    it_done();
                });
            });

            it('should handle error stored in response message', function(it_done) {
                githubResponse = {
                    statusCode: 500,
                    message: 'somthing went wrong, e.g. user revoked access rights'
                };
                githubError = null;
                cla_api.get(req, function(err) {
                    assert.equal(err, githubResponse.message);
                    it_done();
                });
            });

            it('should handle error only if status unequal 200 or there is no response', function(it_done) {
                githubResponse = {
                    statusCode: 200,
                    data: {}
                };
                githubError = 'any error';

                log.error.restore();
                sinon.stub(log, 'error', function() {
                    assert();
                });

                cla_api.get(req, function(err, res) {

                    assert(res);
                    assert(!err);
                    it_done();
                });
            });
        });


    });

    describe('cla api', function() {
        var req;
        beforeEach(function() {
            req = {
                user: {
                    id: 3,
                    login: 'user'
                },
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    gist: testData.repo_from_db.gist
                }
            };

            sinon.stub(repo_service, 'get', function(args, cb) {
                assert(args);
                cb(null, {
                    gist: testData.repo_from_db.gist,
                    token: 'abc.cla.getAll'
                });
            });

            sinon.stub(statusService, 'update', function(args) {
                assert(args.signed);
            });
            sinon.stub(cla, 'sign', function(args, cb) {
                assert.deepEqual(args, {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    user: 'user',
                    user_id: 3
                });
                cb(null, 'done');
            });
            sinon.stub(cla, 'check', function(args, cb) {
                cb(null, true);
            });
            sinon.stub(prService, 'editComment', function() {});
        });

        afterEach(function() {
            statusService.update.restore();
            repo_service.get.restore();
            cla.check.restore();
            cla.sign.restore();
            prService.editComment.restore();
        });

        it('should call cla service on sign', function(it_done) {

            cla_api.sign(req, function(err) {
                assert.ifError(err);
                assert(cla.sign.called);

                it_done();
            });
        });

        it('should update status of pull request created by user, who signed', function(it_done) {
            cla_api.sign(req, function(err, res) {
                assert.ifError(err);
                assert.ok(res);
                assert(statusService.update.called);

                it_done();
            });
        });

        it('should update status of all open pull requests for the repo', function(it_done) {
            cla_api.sign(req, function(err, res) {
                assert.ifError(err);
                assert.ok(res);
                assert.equal(statusService.update.callCount, 2);
                assert(github.direct_call.called);
                assert(prService.editComment.called);

                it_done();
            });
        });

        it('should comment with user_map if it is given', function(it_done) {
            cla.check.restore();
            prService.editComment.restore();

            sinon.stub(cla, 'check', function(args, cb) {
                cb(null, true, {
                    signed: [],
                    not_signed: []
                });
            });
            sinon.stub(prService, 'editComment', function(args) {
                assert(args.user_map.signed);
            });

            cla_api.sign(req, function(err, res) {
                assert.ifError(err);
                assert.ok(res);
                assert(github.direct_call.called);
                assert(statusService.update.called);
                assert(prService.editComment.called);
                it_done();
            });
        });

        it('should handle repos without open pull requests', function(it_done) {
            resp.github.directCall = {};

            cla_api.sign(req, function(err, res) {
                assert.ifError(err);
                assert.ok(res);
                assert(github.direct_call.called);
                assert(!statusService.update.called);

                it_done();
            });
        });
    });

    describe('cla api', function() {
        var req;
        beforeEach(function() {
            req = {
                user: {
                    id: 3,
                    login: 'user'
                },
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            };
        });

        it('should call cla service on getLastSignature', function(it_done) {
            sinon.stub(cla, 'getLastSignature', function(args, cb) {
                assert.deepEqual(args, {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    user: 'user',
                    gist_url: testData.repo_from_db.gist
                });
                cb(null, {});
            });

            req.args = {
                repo: 'Hello-World',
                owner: 'octocat'
            };
            console.log(req);

            cla_api.getLastSignature(req, function(err) {
                assert.ifError(err);
                assert(cla.getLastSignature.called);

                cla.getLastSignature.restore();
                it_done();
            });
        });

        it('should call cla service on getSignedCLA', function(it_done) {
            sinon.stub(cla, 'getSignedCLA', function(args, cb) {
                assert.deepEqual(args, {
                    user: 'user'
                });
                cb(null, {});
            });

            req.args = {
                user: 'user'
            };

            cla_api.getSignedCLA(req, function(err) {
                assert.ifError(err);
                assert(cla.getSignedCLA.called);

                cla.getSignedCLA.restore();
                it_done();
            });
        });

        it('should call cla service on check', function(it_done) {
            sinon.stub(cla, 'check', function(args, cb) {
                assert.deepEqual(args, {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    user: 'user'
                });
                cb(null, true);
            });

            cla_api.check(req, function(err) {
                assert.ifError(err);
                assert(cla.check.called);

                cla.check.restore();
                it_done();
            });
        });

        it('should call cla service on getAll', function(it_done) {
            req.args.gist = testData.repo_from_db.gist;
            sinon.stub(cla, 'getAll', function(args, cb) {
                assert.deepEqual(args, {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    gist: testData.repo_from_db.gist
                });
                cb(null, []);
            });

            cla_api.getAll(req, function(err) {
                assert.ifError(err);
                assert(cla.getAll.called);

                cla.getAll.restore();
                it_done();
            });
        });

        it('should call cla service on getGist', function(it_done) {
            cla_api.getGist(req, function(err) {
                assert.ifError(err);
                assert(cla.getGist.called);

                it_done();
            });
        });

        it('should call cla service using user token, not repo token', function(it_done) {
            req.args.gist = testData.repo_from_db.gist;
            req.user.token = 'user_token';

            cla_api.getGist(req, function(err) {
                assert.ifError(err);
                assert(cla.getGist.calledWith({
                    token: 'user_token',
                    gist: testData.repo_from_db.gist
                }));

                it_done();
            });
        });

        it('should call cla service getGist with user token even if repo is not linked anymore', function(it_done) {
            req.args.gist = {
                gist_url: testData.repo_from_db.gist
            };
            req.user.token = 'user_token';

            resp.cla.getRepo = null;
            error.cla.getRepo = 'There is no repo.';

            cla_api.getGist(req, function(err) {
                assert.ifError(err);
                assert(cla.getGist.called);

                it_done();
            });
        });

        it('should fail calling cla service getGist with user token even if repo is not linked anymore when no gist is provided', function(it_done) {
            req.user.token = 'user_token';

            resp.cla.getRepo = null;
            error.cla.getRepo = 'There is no repo.';

            cla_api.getGist(req, function(err) {
                assert(err);
                assert(!cla.getGist.called);

                it_done();
            });
        });
    });

    describe('cla:countCLA', function() {
        var req = {};
        beforeEach(function() {
            req.args = {
                repo: 'Hello-World',
                owner: 'octocat'
            };
            resp.cla.getAll = [{}];
            sinon.stub(cla, 'getAll', function(args, cb) {
                assert(args.gist.gist_url);
                assert(args.gist.gist_version);

                cb(error.cla.getAll, resp.cla.getAll);
            });
        });
        afterEach(function() {
            cla.getAll.restore();
        });

        it('should call getAll on countCLA', function(it_done) {
            reqArgs.cla.getRepo.gist = {
                gist_url: testData.repo_from_db.gist,
                gist_version: testData.gist.history[0].version
            };
            req.args.gist = {
                gist_url: testData.repo_from_db.gist,
                gist_version: testData.gist.history[0].version
            };


            cla_api.countCLA(req, function(err, number) {
                assert.ifError(err);
                assert(cla.getAll.called);
                assert.equal(number, 1);

                it_done();
            });
        });
        it('should get gist version if not provided', function(it_done) {
            reqArgs.cla.getRepo.gist = {
                gist_url: testData.repo_from_db.gist
            };
            req.args.gist = {
                gist_url: testData.repo_from_db.gist
            };
            resp.cla.getAll = [{}, {}];


            cla_api.countCLA(req, function(err, number) {
                assert.ifError(err);
                assert(cla.getAll.called);
                assert.equal(number, resp.cla.getAll.length);

                it_done();
            });
        });
        it('should get gist url and version if not provided', function(it_done) {
            resp.cla.getAll = [{}, {}];

            cla_api.countCLA(req, function(err, number) {
                assert.ifError(err);
                assert(cla.getAll.called);
                assert.equal(number, resp.cla.getAll.length);

                it_done();
            });
        });
    });

    describe('cla:upload', function() {
        var req;

        beforeEach(function() {
            error.github = {
                call: null
            };
            reqArgs.github = {
                call: {
                    id: 1,
                    login: 'one'
                }
            };
            reqArgs.cla.sign = {};
            req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    users: ['one']
                },
                user: {
                    token: 'user_token'
                }
            };

            sinon.stub(github, 'call', function(args, cb) {
                assert.equal(args.obj, 'user');
                assert.equal(args.fun, 'getFrom');
                assert.equal(args.token, 'user_token');
                cb(error.github.call, reqArgs.github.call);
            });

            sinon.stub(cla, 'sign', function(args, cb) {
                cb(error.cla.sign, reqArgs.cla.sign);
            });
        });

        afterEach(function() {
            github.call.restore();
            cla.sign.restore();
        });

        it('should silenty exit when no users provided', function(it_done) {
            req.args.users = undefined;

            cla_api.upload(req, function(err, res) {
                assert.equal(err, undefined);
                assert.equal(res, undefined);
                it_done();
            });
        });

        it('should not "sign" cla when github user not found', function(it_done) {
            error.github.call = 'not found';
            reqArgs.github.call = undefined;

            cla_api.upload(req, function() {
                assert(github.call.calledWith({
                    obj: 'user',
                    fun: 'getFrom',
                    arg: {
                        user: 'one'
                    },
                    token: 'user_token'
                }));
                assert(!cla.sign.called);
                it_done();
            });
        });

        it('should "sign" cla for two users', function(it_done) {
            req.args.users = ['one', 'two'];
            cla_api.upload(req, function() {
                assert(github.call.called);
                assert(cla.sign.calledWith({
                    repo: 'Hello-World',
                    owner: 'octocat',
                    user: 'one',
                    user_id: 1
                }));
                assert(cla.sign.calledTwice);
                it_done();
            });
        });
    });

    describe('cla: validatePullRequests', function() {
        var req;
        beforeEach(function() {
            req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    token: 'test_token'
                }
            };
            sinon.stub(statusService, 'update', function(args) {
                assert(args.signed);
            });
            sinon.stub(cla, 'check', function(args, cb) {
                cb(null, true);
            });
            sinon.stub(prService, 'editComment', function() {});
        });

        afterEach(function() {
            cla.check.restore();
            statusService.update.restore();
            prService.editComment.restore();
        });
        it('should update all open pull requests', function(it_done) {

            cla_api.validatePullRequests(req, function(err) {
                assert.ifError(err);
                assert.equal(statusService.update.callCount, 2);
                assert(github.direct_call.called);
                assert(prService.editComment.called);

                it_done();
            });
        });

        it('should update all PRs with users token', function(it_done) {
            req.args.token = undefined;
            req.user = {
                token: 'user_token'
            };
            cla_api.validatePullRequests(req, function(err) {
                assert.ifError(err);
                assert.equal(statusService.update.callCount, 2);
                assert(github.direct_call.called);
                assert(prService.editComment.called);

                it_done();
            });
        });
    });
});