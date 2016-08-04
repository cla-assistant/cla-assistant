/*global describe, it, beforeEach, afterEach*/
// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var CLA = require('../../../server/documents/cla').CLA;
// var User = require('../../../server/documents/user').User;

var https = require('https');

//services
var github = require('../../../server/services/github');
var org_service = require('../../../server/services/org');
var repo_service = require('../../../server/services/repo');
var statusService = require('../../../server/services/status');
var url = require('../../../server/services/url');

var config = require('../../../config');
// test data
var testData = require('../testData').data;

// service under test
var cla = require('../../../server/services/cla');

var callbacks = {};
var req = {
    end: function () { },
    error: function (err) {
        callbacks.error(err);
    },
    on: function (fun, cb) {
        callbacks[fun] = cb;
    }
};
var res = {
    on: function (fun, callback) {
        callbacks[fun] = callback;
    }
};

var expArgs = {};
var testRes = {};
var testErr = {};

function stub() {
    expArgs.claFindOne = {
        repoId: 1296269,
        user: 'login',
        gist_url: 'gistUrl',
        gist_version: 'xyz',
        org_cla: false
    };
    testErr.claFindOne = null;
    testErr.orgServiceGet = null;
    testErr.repoServiceGet = null;
    testErr.repoServiceGetCommitters = null;

    testRes.claFindOne = {};
    testRes.repoServiceGet = {
        repoId: 123,
        gist: 'url/gistId',
        token: 'abc'
    };
    testRes.repoServiceGetCommitters = [{
        name: 'login2'
    }, {
            name: 'login'
        }];

    sinon.stub(CLA, 'findOne', function (args, done) {
        done(testErr.claFindOne, testRes.claFindOne);
    });

    sinon.stub(org_service, 'get', function (args, done) {
        done(testErr.orgServiceGet, testRes.orgServiceGet);
    });

    sinon.stub(repo_service, 'get', function (args, done) {
        done(testErr.repoServiceGet, testRes.repoServiceGet);
    });

    sinon.stub(repo_service, 'getGHRepo', function (args, done) {
        done(null, testData.repo);
    });
}

function restore() {
    testRes = {};
    testErr = {};

    CLA.findOne.restore();
    org_service.get.restore();
    repo_service.get.restore();
    repo_service.getGHRepo.restore();
}

describe('cla:get', function () {
    var expClaFindOneArgs;

    beforeEach(function () {
        expClaFindOneArgs = {
            repoId: 1296269,
            user: 'login',
            gist_url: 'gistUrl',
            gist_version: 'xyz',
            org_cla: false
        };
        sinon.stub(repo_service, 'get', function (args, done) {
            done(null, testData.repo_from_db);
        });
        sinon.stub(CLA, 'findOne', function (arg, done) {
            done(null, true);
        });
    });
    afterEach(function () {
        CLA.findOne.restore();
        repo_service.get.restore();
    });

    it('should find repoId if not given and get cla entry for the repo', function (it_done) {
        var args = {
            repo: 'Hello-World',
            owner: 'octocat',
            user: 'login',
            gist: 'gistUrl',
            gist_version: 'xyz'
        };
        cla.get(args, function () {
            assert(repo_service.get.calledWithMatch({
                owner: 'octocat',
                repo: 'Hello-World'
            }));
            assert(CLA.findOne.calledWith(expClaFindOneArgs));
            it_done();
        });
    });

    it('should find cla with given repoId', function (it_done) {
        var args = expClaFindOneArgs;
        cla.get(args, function () {
            assert(!repo_service.get.called);
            it_done();
        });
    });

    it('should find cla with orgId if it is an org_cla regardless of repoId', function (it_done) {
        var args = {
            orgId: 1,
            repoId: 1296269,
            user: 'login',
            gist: 'gistUrl',
            gist_version: 'xyz'
        };
        expClaFindOneArgs.ownerId = 1;
        expClaFindOneArgs.org_cla = true;
        delete expClaFindOneArgs.repoId;

        cla.get(args, function () {
            assert(CLA.findOne.calledWith(expClaFindOneArgs));
            it_done();
        });
    });
});

describe('cla:getLastSignature', function () {
    beforeEach(function () {
        stub();
    });
    afterEach(function () {
        restore();
    });

    it('should search for org clas if org is linked', function (it_done) {
        testRes.repoServiceGet = null;
        testRes.claFindOne = {
            ownerId: 123,
            user: 'login',
            org_cla: true
        };
        testRes.orgServiceGet = { orgId: 1, org: 'org' };
        var args = {
            repo: undefined,
            owner: 'org'
        };

        cla.getLastSignature(args, function () {
            assert.equal(CLA.findOne.calledWithMatch({ '$query': { ownerId: 1, org_cla: true } }), true);
            it_done();
        });
    });

    it('should get cla entry for equal repo, user and gist url', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner'
        };

        cla.getLastSignature(args, function () {
            assert.equal(CLA.findOne.calledWithMatch({ '$query': { repoId: 123, gist_url: 'url/gistId' } }), true);
            it_done();
        });
    });
});

describe('cla:check', function () {
    var testGistData = '{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}';
    var triggerHttpsResponse;

    beforeEach(function () {
        triggerHttpsResponse = function () {
            callbacks.data(testGistData);
            callbacks.end();
        };

        stub();

        sinon.stub(repo_service, 'getPRCommitters', function (arg, done) {
            assert(arg.number ? arg.number : arg.user);
            done(testErr.repoServiceGetCommitters, testRes.repoServiceGetCommitters);
        });

        sinon.stub(https, 'request', function (options, done) {
            assert.equal(options.hostname, 'api.github.com');
            assert(options.headers.Authorization);

            done(res);
            triggerHttpsResponse();
            return req;
        });
        // sinon.stub(https, 'request', function (options, done) {
        //     assert.deepEqual(options, {
        //         hostname: 'api.github.com',
        //         port: 443,
        //         path: '/gists/gistId',
        //         method: 'GET',
        //         headers: {
        //             'Authorization': 'token abc',
        //             'User-Agent': 'cla-assistant'
        //         }
        //     });
        //     done(res);
        //     return req;
        // });
    });

    afterEach(function () {
        restore();

        repo_service.getPRCommitters.restore();
        https.request.restore();
    });

    it('should check for linked org as well as for repo', function (it_done) {
        expArgs.claFindOne = {
            ownerId: 123,
            user: 'login',
            gist_url: 'url/gistId',
            gist_version: 'xyz',
            org_cla: true
        };
        testRes.orgServiceGet = {
            orgId: 123,
            gist: 'url/gistId',
            token: 'abc'
        };
        testRes.claFindOne = {
            id: 456,
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz'
        };

        var args = {
            orgId: 1,
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };

        cla.check(args, function (err, result) {
            assert(org_service.get.called);
            assert(CLA.findOne.calledWith(expArgs.claFindOne));
            assert.ifError(err);
            assert(result);
            it_done();
        });
    });

    it('should negative check if repo has no gist', function (it_done) {
        testRes.repoServiceGet.gist = undefined;

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };

        cla.check(args, function (err, result) {
            assert(err);
            assert(!result);

            it_done();
        });
    });

    it('should send error if getGist has an error', function (it_done) {
        triggerHttpsResponse = function () {
            callbacks.error('Error');
            callbacks.end();
        };
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };

        cla.check(args, function (err, result) {
            assert(err);
            assert(!result);

            it_done();
        });

    });

    it('should positive check whether user has already signed', function (it_done) {
        expArgs.claFindOne = {
            repoId: 123,
            user: 'login',
            gist_url: 'url/gistId',
            gist_version: 'xyz',
            org_cla: false
        };
        testRes.claFindOne = {
            id: 456,
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz'
        };

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };

        cla.check(args, function (err, result) {
            assert(CLA.findOne.calledWith(expArgs.claFindOne));
            assert.ifError(err);
            assert(result);
            it_done();
        });
    });

    it('should negative check whether user has already signed', function (it_done) {
        expArgs.claFindOne = {
            repoId: 123,
            user: 'login',
            gist_url: 'url/gistId',
            gist_version: 'xyz',
            org_cla: false
        };
        testRes.claFindOne = null;

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };

        cla.check(args, function (err, result) {
            assert(CLA.findOne.calledWith(expArgs.claFindOne));
            assert.ifError(err);
            assert(!result);
            it_done();
        });
    });

    it('should positive check for pull request if pull request number given', function (it_done) {
        testRes.claFindOne = {
            id: 123,
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz'
        };

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        };

        cla.check(args, function (err, result) {
            assert.ifError(err);
            assert(CLA.findOne.calledTwice);
            assert(result);
            it_done();
        });
    });

    it('should negative check for pull request if pull request number given', function (it_done) {
        CLA.findOne.restore();
        sinon.stub(CLA, 'findOne', function (arg, done) {
            if (arg.user === 'login') {
                done(null, {
                    id: 123,
                    gist_url: 'url/gistId',
                    created_at: '2012-06-20T11:34:15Z',
                    gist_version: 'xyz'
                });
            } else {
                done(null, null);
            }
        });

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        };

        cla.check(args, function (err, result) {
            assert.ifError(err);
            assert(!result);
            it_done();
        });
    });

    it('should return map of committers who has signed and who has not signed cla', function (it_done) {
        CLA.findOne.restore();
        sinon.stub(CLA, 'findOne', function (arg, done) {
            if (arg.user === 'login') {
                done(null, {
                    id: 123,
                    user: 'login',
                    gist_url: 'url/gistId',
                    created_at: '2012-06-20T11:34:15Z',
                    gist_version: 'xyz'
                });
            } else {
                done(null, null);
            }
        });

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        };

        cla.check(args, function (err, signed, map) {
            assert.ifError(err);
            assert(!signed);
            assert.equal(map.not_signed[0], 'login2');
            assert.equal(map.signed[0], 'login');
            it_done();
        });
    });

    it('should return map of committers containing list of users without github account', function (it_done) {
        testRes.repoServiceGetCommitters = [{
            name: 'login',
            id: '123'
        }, {
                name: 'login2',
                id: ''
            }, {
                name: 'login3',
                id: ''
            }];

        CLA.findOne.restore();
        sinon.stub(CLA, 'findOne', function (arg, done) {
            if (arg.user === 'login') {
                done(null, {
                    id: 123,
                    user: 'login',
                    gist_url: 'url/gistId',
                    created_at: '2012-06-20T11:34:15Z',
                    gist_version: 'xyz'
                });
            } else {
                done(null, null);
            }
        });

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        };

        cla.check(args, function (err, signed, map) {
            assert.ifError(err);
            assert(!signed);
            assert.equal(map.unknown.length, 2);
            assert.equal(map.unknown[0], 'login2');
            assert.equal(map.not_signed[0], 'login2');
            assert.equal(map.signed[0], 'login');
            it_done();
        });
    });

    it('should not fail if committers list is empty', function (it_done) {
        testErr.repoServiceGetCommitters = 'err';
        testRes.repoServiceGetCommitters = undefined;

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: 1
        };

        cla.check(args, function (err) {
            assert(err);
            it_done();
        });
    });
});

describe('cla:sign', function () {
    var testArgs = {};
    var testGistData = '{"url": "url", "files": {"xyFile": {"content": "some content"}}, "updated_at": "2011-06-20T11:34:15Z", "history": [{"version": "xyz"}]}';
    var triggerHttpsResponse = function () {
        callbacks.data(testGistData);
        callbacks.end();
    };

    beforeEach(function () {
        testArgs.claSign = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 3
        };

        testRes.claGet = {
            id: 123,
            gist_url: 'url/gistId',
            created_at: '2011-06-20T11:34:15Z',
            gist_version: 'xyz'
        };

        testRes.repoServiceGet = {
            repoId: '123',
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            token: 'abc'
        };

        testRes.orgServiceGet = {
            orgId: '1',
            org: 'test_org',
            gist: 'url/gistId',
            token: 'abc'
        };

        sinon.stub(cla, 'get', function (args, done) {
            if (args.user !== 'login') {
                done(null, testRes.claGet);
            } else {
                done(null, undefined);
            }
        });
        sinon.stub(CLA, 'create', function (args, done) {
            assert(args);

            assert(args.repoId ? args.repoId : args.ownerId);
            assert(args.repo ? args.repo : args.org_cla);
            assert(args.owner);
            assert(args.userId);
            assert(args.gist_url);
            assert(args.gist_version);
            done(testErr.claCreate, testRes.claCreate);
        });

        sinon.stub(github, 'direct_call', function (args, done) {
            assert(args.url);
            assert(args.token);
            assert.equal(args.url, url.githubPullRequests('owner', 'myRepo', 'open'));

            done(null, {
                data: [{
                    number: 1
                }, {
                        number: 2
                    }]
            });
        });

        sinon.stub(https, 'request', function (options, done) {
            assert.equal(options.hostname, 'api.github.com');
            assert(options.headers.Authorization);

            done(res);
            triggerHttpsResponse();
            return req;
        });

        sinon.stub(org_service, 'get', function (args, done) {
            assert(args);
            done(null, testRes.orgServiceGet);
        });

        sinon.stub(repo_service, 'get', function (args, done) {
            assert(args);
            done(null, testRes.repoServiceGet);
        });

        sinon.stub(repo_service, 'getGHRepo', function (args, done) {
            done(null, testData.repo);
        });

        sinon.stub(statusService, 'update', function (args) {
            assert(args.signed);
        });
    });

    afterEach(function () {
        cla.get.restore();
        CLA.create.restore();
        github.direct_call.restore();
        https.request.restore();
        org_service.get.restore();
        repo_service.get.restore();
        repo_service.getGHRepo.restore();
        statusService.update.restore();
    });

    it('should store signed cla data for repo if not signed yet', function (it_done) {
        testRes.orgServiceGet = null;

        cla.sign(testArgs.claSign, function () {

            assert(CLA.create.called);
            it_done();
        });
    });

    it('should store signed cla data for org', function (it_done) {
        cla.sign(testArgs.claSign, function () {
            assert(CLA.create.called);

            assert(CLA.create.calledWithMatch({ gist_url: 'url/gistId' }));
            assert(org_service.get.called);

            it_done();
        });
    });

    it('should store signed cla data for org even without repo name', function (it_done) {
        testArgs.claSign.repo = undefined;

        cla.sign(testArgs.claSign, function () {
            assert(CLA.create.called);

            assert(!repo_service.getGHRepo.called);
            assert(CLA.create.calledWithMatch({ gist_url: 'url/gistId' }));
            assert(org_service.get.called);

            it_done();
        });
    });

    it('should do nothing if user has already signed', function (it_done) {
        testArgs.claSign.user = 'signedUser';

        cla.sign(testArgs.claSign, function () {
            assert.equal(CLA.create.called, false);
            it_done();
        });
    });

    it('should report error if error occours on DB', function (it_done) {
        testErr.claCreate = 'any DB error';
        testRes.claCreate = null;

        cla.sign(testArgs.claSign, function (err, result) {
            assert(err);
            assert(!result);
            it_done();
        });
    });
});

describe('cla:create', function () {
    afterEach(function () {
        CLA.create.restore();
    });

    it('should create cla entry for equal repo, user and gist url', function (it_done) {
        sinon.stub(CLA, 'create', function (arg, done) {
            assert(arg);
            assert(arg.gist_url);
            assert(arg.gist_version);
            assert(arg.repo);
            assert(arg.repoId);
            assert(arg.owner);
            assert(arg.created_at);
            done(null, {
                repo: arg.repo,
                owner: arg.owner
            });
        });

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            repoId: '123',
            user: 'login',
            gist: 'url/gistId',
            gist_version: 'xyz'
        };
        cla.create(args, function (err) {
            assert.ifError(err);
            it_done();
        });
    });
});

describe('cla:getSignedCLA', function () {
    it('should get all clas signed by the user but only one per repo (linked or not)', function (it_done) {
        sinon.stub(repo_service, 'all', function (done) {
            done(null, [{
                repo: 'repo1',
                gist_url: 'gist_url'
            }, {
                    repo: 'repo2',
                    gist_url: 'gist_url'
                }]);
        });

        sinon.stub(CLA, 'find', function (arg, selectionCriteria, sortCriteria, done) {
            var listOfAllCla = [{
                repo: 'repo1',
                user: 'login',
                gist_url: 'gist_url',
                gist_version: '1'
            }, {
                    repo: 'repo2',
                    user: 'login',
                    gist_url: 'gist_url',
                    gist_version: '1'
                }, {
                    repo: 'repo2',
                    user: 'login',
                    gist_url: 'gist_url',
                    gist_version: '2'
                }, {
                    repo: 'repo3',
                    user: 'login',
                    gist_url: 'gist_url',
                    gist_version: '1'
                }];
            done(null, listOfAllCla);
        });

        var args = {
            user: 'login'
        };
        cla.getSignedCLA(args, function (err, clas) {
            assert.ifError(err);
            assert.equal(clas.length, 3);
            assert.equal(clas[2].repo, 'repo3');
            CLA.find.restore();
            repo_service.all.restore();
            it_done();
        });
    });

    it('should select cla for the actual linked gist per repo even if it is signed earlier than others', function (it_done) {
        sinon.stub(repo_service, 'all', function (done) {
            done(null, [{
                repo: 'repo1',
                gist_url: 'gist_url2'
            }, {
                    repo: 'repo2',
                    gist_url: 'gist_url'
                }, {
                    repo: 'repo3',
                    gist_url: 'gist_url'
                }]);
        });
        sinon.stub(CLA, 'find', function (arg, selectionCriteria, sortCriteria, done) {
            var listOfAllCla = [{
                repo: 'repo1',
                user: 'login',
                gist_url: 'gist_url1',
                created_at: '2011-06-20T11:34:15Z'
            }, {
                    repo: 'repo1',
                    user: 'login',
                    gist_url: 'gist_url2',
                    created_at: '2011-06-15T11:34:15Z'
                }, {
                    repo: 'repo2',
                    user: 'login',
                    gist_url: 'gist_url',
                    created_at: '2011-06-15T11:34:15Z'
                }];
            if (arg.$or) {
                done(null, [{
                    repo: 'repo1',
                    user: 'login',
                    gist_url: 'gist_url2',
                    created_at: '2011-06-15T11:34:15Z'
                }, {
                        repo: 'repo2',
                        user: 'login',
                        gist_url: 'gist_url',
                        created_at: '2011-06-15T11:34:15Z'
                    }]);
            } else {
                done(null, listOfAllCla);
            }
        });

        var args = {
            user: 'login'
        };
        cla.getSignedCLA(args, function (err, clas) {
            assert.ifError(err);
            assert.equal(clas[0].gist_url, 'gist_url2');
            assert.equal(CLA.find.callCount, 2);
            CLA.find.restore();
            repo_service.all.restore();
            it_done();
        });
    });
});

describe('cla:getAll', function () {
    beforeEach(function () {
        sinon.stub(CLA, 'find', function (arg, done) {
            assert(arg);
            assert(arg.gist_url);
            var resp = [{
                id: 2,
                created_at: '2011-06-20T11:34:15Z',
                gist_version: 'xyz'
            }];
            if (!arg.gist_version) {
                resp.push({
                    id: 1,
                    created_at: '2010-06-20T11:34:15Z',
                    gist_version: 'abc'
                });
            }

            done(null, resp);
        });
    });

    afterEach(function () {
        CLA.find.restore();
    });

    it('should get all signed cla with same orgId', function (it_done) {
        var args = {
            orgId: 1,
            gist: {
                gist_url: 'gistUrl'
            }
        };

        cla.getAll(args, function (err, arr) {
            assert.ifError(err);
            assert.equal(CLA.find.calledWithMatch({ ownerId: 1 }), true);
            assert.equal(arr.length, 2);
            assert.equal(arr[0].id, 2);

            it_done();
        });
    });

    it('should get all signed cla with same repoId', function (it_done) {
        var args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl'
            }
        };

        cla.getAll(args, function (err, arr) {
            assert.ifError(err);
            assert.equal(CLA.find.calledWithMatch({ repoId: testData.repo.id }), true);

            assert.equal(arr.length, 2);
            assert.equal(arr[0].id, 2);

            it_done();
        });
    });

    it('should get all cla for a specific gist version', function (it_done) {
        var args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl',
                gist_version: 'xyz'
            }
        };

        cla.getAll(args, function (err, arr) {
            assert.ifError(err);
            assert.equal(arr.length, 1);
            assert.equal(arr[0].id, 2);

            it_done();
        });
    });

    it('should handle undefined clas', function (it_done) {
        CLA.find.restore();
        sinon.stub(CLA, 'find', function (arg, done) {
            assert(arg);
            done('Error!', undefined);
        });

        var args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl'
            }
        };

        cla.getAll(args, function (err) {
            assert(err);

            it_done();
        });
    });

    it('should handle wrong args', function (it_done) {
        var args = {
            repoId: testData.repo.id,
            gist: undefined
        };

        cla.getAll(args, function (err, arr) {
            assert(err);

            it_done();
        });
    });
});

describe('cla:getGist', function () {
    it('should extract valid gist ID', function (it_done) {
        sinon.stub(https, 'request', function (options, done) {
            assert.equal(options.path, '/gists/gistId/versionId');
            done(res);
            return req;
        });

        var repo = {
            gist: {
                gist_url: 'url/gists/gistId',
                gist_version: 'versionId'
            }
        };

        cla.getGist(repo, function () {
            https.request.restore();
            it_done();
        });
        callbacks.data('{}');
        callbacks.end();
    });

    it('should handle repo without gist', function (it_done) {
        // var repo = {gist: 'wronGistUrl'};
        var repo = {};

        cla.getGist(repo, function (err) {
            assert.equal(err, 'The gist url "undefined" seems to be invalid');
            it_done();
        });
    });
});

describe('cla:getLinkedItem', function () {
    it('should find linked item using reponame and owner parameters', function (it_done) {
        config.server.github.token = 'test_token';

        sinon.stub(repo_service, 'get', function (args, done) {
            done(null, testRes.repoServiceGet);
        });
        sinon.stub(org_service, 'get', function (args, done) {
            done(null, testRes.orgServiceGet);
        });
        sinon.stub(repo_service, 'getGHRepo', function (args, done) {
            assert(args.token);
            done(null, testData.repo);
        });

        var args = {
            repo: 'Hello-World',
            owner: 'octocat'
        };

        cla.getLinkedItem(args, function () {
            assert(repo_service.getGHRepo.called);

            it_done();
            org_service.get.restore();
            repo_service.get.restore();
            repo_service.getGHRepo.restore();
        });
    });
    it('should return an error, if the GH Repo does not exist', function (it_done) {
        var testArgs = {
            repo: 'DoesNotExist',
            owner: 'NoOne'
        };
        sinon.stub(repo_service, 'getGHRepo', function (args, done) {
            assert(testArgs.repo === args.repo);
            assert(testArgs.owner === args.owner);
            done('GH Repo not found', null);
        });

        cla.getLinkedItem(testArgs, function(err, obj){
            assert(err == 'GH Repo not found');
            repo_service.getGHRepo.restore();
            it_done();
        });
    });
});
