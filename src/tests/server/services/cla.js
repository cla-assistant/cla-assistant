/*global describe, it, beforeEach, afterEach*/
// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var CLA = require('../../../server/documents/cla').CLA;
// var User = require('../../../server/documents/user').User;

var https = require('https');

//services
var org_service = require('../../../server/services/org');
var repo_service = require('../../../server/services/repo');
var github = require('../../../server/services/github');
var statusService = require('../../../server/services/status');
var logger = require('../../../server/services/logger');

var config = require('../../../config');
// test data
var testData = require('../testData').data;

// service under test
var cla = require('../../../server/services/cla');

// var callbacks = {};
// var req = {
//     end: function () { },
//     error: function (err) {
//         callbacks.error(err);
//     },
//     on: function (fun, cb) {
//         callbacks[fun] = cb;
//     }
// };
// var res = {
//     on: function (fun, callback) {
//         callbacks[fun] = callback;
//     }
// };

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
        token: 'abc',
        sharedGist: false
    };
    testRes.repoServiceGetCommitters = [{
        name: 'login2'
    }, {
        name: 'login'
    }];

    sinon.stub(CLA, 'findOne').callsFake(function (args, selector, options, done) {
        if (!options && !done) {
            done = selector;
        }
        done(testErr.claFindOne, testRes.claFindOne);
    });

    sinon.stub(org_service, 'get').callsFake(function (args, done) {
        done(testErr.orgServiceGet, testRes.orgServiceGet);
    });

    sinon.stub(repo_service, 'get').callsFake(function (args, done) {
        done(testErr.repoServiceGet, testRes.repoServiceGet);
    });

    sinon.stub(repo_service, 'getGHRepo').callsFake(function (args, done) {
        done(null, testData.repo);
    });

    sinon.stub(logger, 'error').callsFake(function (msg) {
        assert(msg);
    });
    sinon.stub(logger, 'warn').callsFake(function (msg) {
        assert(msg);
    });
    sinon.stub(logger, 'info').callsFake(function (msg) {
        assert(msg);
    });

    sinon.stub(github, 'call').callsFake(function (args, done) {
        if (args.obj === 'pullRequests' && args.fun === 'get') {
            return done(testErr.getPR, testRes.getPR);
        } else if (args.obj === 'gists' && args.fun === 'get') {
            if (testErr.gistData) {
                return Promise.reject(testErr.gistData);
            } else {
                return Promise.resolve(testRes.gistData);
            }
        } else if (args.obj === 'pullRequests' && args.fun === 'getFiles') {
            assert(args.arg.noCache);
            return Promise.resolve(testRes.pullRequestFiles);
        }
    });
}

function restore() {
    testRes = {};
    testErr = {};

    CLA.findOne.restore();
    org_service.get.restore();
    repo_service.get.restore();
    repo_service.getGHRepo.restore();
    logger.error.restore();
    logger.warn.restore();
    logger.info.restore();
    github.call.restore();
}

describe('cla:getLastSignature', function () {
    var now = new Date();
    var clock = null;

    beforeEach(function () {
        stub();
        testRes.gistData = {
            data: {
                history: [{
                    version: "xyz"
                }]
            }
        };
        clock = sinon.useFakeTimers(now.getTime());
    });

    afterEach(function () {
        restore();
        clock.restore();
    });

    it('should get cla entry for equal repo, userId or user and gist url', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            userId: 'userId',
            user: 'user'
        };
        testRes.repoServiceGet.sharedGist = true;
        cla.getLastSignature(args, function () {
            assert.equal(CLA.findOne.calledWithMatch({
                $or: [{
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }, {
                    user: 'user',
                    userId: { $exists: false },
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    user: 'user',
                    userId: { $exists: false },
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }, {
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    owner: undefined,
                    repo: undefined,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    owner: undefined,
                    repo: undefined,
                    created_at: { $lte: now },
                    end_at: undefined
                }]
            }), true);
            it_done();
        });
    });

    it('should get cla entry for equal repo, user and gist url', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'user'
        };

        cla.getLastSignature(args, function () {
            assert.equal(CLA.findOne.calledWithMatch({
                $or: [{
                    user: 'user',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    user: 'user',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }]
            }), true);
            it_done();
        });
    });

    it('should update user name if github username is changed', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'changedUserName',
            userId: 'userId'
        };

        testRes.claFindOne = {
            user: 'user',
            userId: 'userId',
            repoId: 'repoId',
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz',
            save: function () {
                return Promise.resolve({
                    user: 'changedUserName',
                    userId: 'userId',
                    repoId: 'repoId',
                    gist_url: 'url/gistId',
                    created_at: '2012-06-20T11:34:15Z',
                    gist_version: 'xyz',
                });
            }
        };

        cla.getLastSignature(args, function (err, cla) {
            assert.ifError(err);
            assert.equal(CLA.findOne.calledWithMatch({
                $or: [{
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }, {
                    user: 'changedUserName',
                    userId: { $exists: false },
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    user: 'changedUserName',
                    userId: { $exists: false },
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }]
            }), true);
            assert(cla.user === args.user);
            it_done();
        });
    });

    it('should send error when update user name failed when github username is changed', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'changedUserName',
            userId: 'userId'
        };

        testRes.claFindOne = {
            user: 'user',
            userId: 'userId',
            repoId: 'repoId',
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz',
            save: function () {
                return Promise.reject('Update error.');
            }
        };

        cla.getLastSignature(args, function (err, cla) {
            assert(err === 'Update error.');
            assert.equal(CLA.findOne.calledWithMatch({
                $or: [{
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    userId: 'userId',
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }, {
                    user: 'changedUserName',
                    userId: { $exists: false },
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    user: 'changedUserName',
                    userId: { $exists: false },
                    gist_url: 'url/gistId',
                    gist_version: 'xyz',
                    repoId: 123,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }]
            }), true);
            it_done();
        });
    });

    it('should get cla for repos or orgs with shared gist', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };
        testRes.repoServiceGet.sharedGist = true;
        cla.getLastSignature(args, function () {
            assert(CLA.findOne.calledWith({
                $or: [{
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    repoId: testRes.repoServiceGet.repoId,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    repoId: testRes.repoServiceGet.repoId,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }, {
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    owner: undefined,
                    repo: undefined,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    owner: undefined,
                    repo: undefined,
                    created_at: { $lte: now },
                    end_at: undefined
                }]
            }));
            it_done();
        });
    });

    it('should search a cla on current date and a pull request date when PR number is provided', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1',
            user: 'login'
        };
        var prCreateDateString = '1970-01-01T00:00:00.000Z';
        var prCreateDate = new Date(prCreateDateString);
        testErr.getPR = null;
        testRes.getPR = {
            created_at: prCreateDate
        };
        cla.getLastSignature(args, function () {
            assert(CLA.findOne.calledWith({
                $or: [{
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    repoId: testRes.repoServiceGet.repoId,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: { $gt: now }
                }, {
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    repoId: testRes.repoServiceGet.repoId,
                    org_cla: false,
                    created_at: { $lte: now },
                    end_at: undefined
                }, {
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    repoId: testRes.repoServiceGet.repoId,
                    org_cla: false,
                    created_at: { $lte: prCreateDate },
                    end_at: { $gt: prCreateDate }
                }, {
                    user: args.user,
                    gist_url: testRes.repoServiceGet.gist,
                    gist_version: 'xyz',
                    repoId: testRes.repoServiceGet.repoId,
                    org_cla: false,
                    created_at: { $lte: prCreateDate },
                    end_at: undefined
                }]
            }));
            it_done();
        });
    });

    it('should positive check if an repo has a null CLA', function (it_done) {
        testRes.repoServiceGet.gist = undefined;
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };
        cla.getLastSignature(args, function (err, cla) {
            assert(!err);
            assert(cla);
            it_done();
        });
    });

    it('should send error if there is no linked repo or org', function (it_done) {
        testErr.repoServiceGet = 'Repository not found in Database';
        testErr.orgServiceGet = 'Organization not found in Database';
        testRes.repoServiceGet = null;
        testRes.orgServiceGet = null;
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };
        cla.getLastSignature(args, function (err, cla) {
            assert(err);
            assert(!cla);
            it_done();
        });
    });

    it('should send error if getGist has an error', function (it_done) {
        testErr.gistData = 'Error';
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login'
        };
        cla.getLastSignature(args, function (err, cla) {
            assert(err);
            assert(!cla);
            it_done();
        });
    });

    it('should send error if get pull request failed when pull request number is given', function (it_done) {
        testErr.getPR = 'Error';
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            number: '1'
        };
        cla.getLastSignature(args, function (err, cla) {
            assert(err);
            assert(!cla);
            it_done();
        });
    });

    it('should send error if user is not given', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner'
        };
        cla.getLastSignature(args, function (err, cla) {
            assert(err);
            assert(!cla);
            it_done();
        });
    });
});

describe('cla:checkUserSignature', function () {
    beforeEach(function () {
        sinon.stub(cla, 'getLastSignature').callsFake(function (args, done) {
            return done(null, {});
        });
    });

    afterEach(function () {
        cla.getLastSignature.restore();
    });

    it('should call get last signature for the user', function (it_done) {
        var args = {
            repo: 'repo',
            owner: 'owner',
            user: 'user'
        };
        cla.checkUserSignature(args, function (error, result) {
            assert.ifError(error);
            assert(result.signed);
            assert(cla.getLastSignature.called);
            it_done();
        });
    });
});

describe('cla:checkPullRequestSignatures', function () {
    var now = new Date();
    var clock = null;
    beforeEach(function () {
        stub();
        testRes.gistData = {
            data: {
                url: 'url',
                files: { xyFile: { content: 'some content' } },
                updated_at: '2011-06-20T11:34:15Z',
                history: [{ version: 'xyz' }]
            }
        };
        testRes.repoServiceGet = {
            repoId: '123',
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc'
        };
        clock = sinon.useFakeTimers(now.getTime());
        var prCreateDateString = '1970-01-01T00:00:00.000Z';
        var prCreateDate = new Date(prCreateDateString);
        testErr.getPR = null;
        testRes.getPR = {
            user: {
                login: 'login0',
                id: '0'
            },
            created_at: prCreateDate
        };
        sinon.stub(repo_service, 'getPRCommitters').callsFake(function (arg, done) {
            done(testErr.repoServiceGetCommitters, testRes.repoServiceGetCommitters);
        });
    });

    afterEach(function () {
        restore();
        repo_service.getPRCommitters.restore();
        clock.restore();
    });

    it('should send error if there is no linked repo or org', function (it_done) {
        testErr.repoServiceGet = 'Repository not found in Database';
        testErr.orgServiceGet = 'Organization not found in Database';
        testRes.repoServiceGet = null;
        testRes.orgServiceGet = null;
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };
        cla.checkPullRequestSignatures(args, function (err, result) {
            assert(err);
            assert(!result);
            it_done();
        });
    });

    it('should send error if getGist has an error', function (it_done) {
        testErr.gistData = 'Error';
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };
        cla.checkPullRequestSignatures(args, function (err, result) {
            assert(err);
            assert(!result);
            it_done();
        });

    });

    it('should send error if get pull request failed', function (it_done) {
        testErr.getPR = 'Error';
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };
        cla.checkPullRequestSignatures(args, function (err, result) {
            assert(err);
            assert(!result);
            it_done();
        });
    });

    it('should send error if committers list is empty', function (it_done) {
        testErr.repoServiceGetCommitters = 'err';
        testRes.repoServiceGetCommitters = undefined;

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        cla.checkPullRequestSignatures(args, function (err) {
            assert(err);
            it_done();
        });
    });

    it('should positive check if an repo has a null CLA', function (it_done) {
        testRes.repoServiceGet.gist = undefined;
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };
        cla.checkPullRequestSignatures(args, function (err, result) {
            assert(!err);
            assert(result.signed);
            it_done();
        });
    });

    it('should return map of committers who has signed, who has not signed and who has no github account', function (it_done) {
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }, {
            name: 'login3',
            id: ''
        }];
        CLA.findOne.restore();
        sinon.stub(CLA, 'findOne').callsFake(function (arg, selector, options, done) {
            if (!options && !done) {
                done = selector;
            }
            if (arg.$or[0].userId === '123') {
                done(null, {
                    id: 123,
                    user: 'login1',
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
            number: '1'
        };

        cla.checkPullRequestSignatures(args, function (err, result) {
            assert.ifError(err);
            assert(!result.signed);
            assert.equal(result.user_map.signed[0], 'login1');
            assert.equal(result.user_map.not_signed[0], 'login2');
            assert.equal(result.user_map.not_signed[1], 'login3');
            assert.equal(result.user_map.unknown[0], 'login3');
            it_done();
        });
    });

    it('should return map of committers also for old linked repos without sharedGist flag', function (it_done) {
        delete testRes.repoServiceGet.sharedGist;
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }];
        CLA.findOne.restore();
        sinon.stub(CLA, 'findOne').callsFake(function (arg, selector, options, done) {
            if (arg.$or[0].userId === '123') {
                done(null, {
                    id: 123,
                    user: 'login1',
                    gist_url: 'url/gistId',
                    created_at: '2012-06-20T11:34:15Z',
                    gist_version: 'xyz'
                });
            }
        });

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        cla.checkPullRequestSignatures(args, function (err, result) {
            assert.ifError(err);
            assert(result.signed);
            assert.equal(result.user_map.signed[0], 'login1');
            it_done();
        });
    });

    it('should only check submitter when using submitter mode', function (it_done) {
        config.server.feature_flag.required_signees = 'submitter';
        testRes.claFindOne = null;
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }];

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        cla.checkPullRequestSignatures(args, function (err, result) {
            config.server.feature_flag.required_signees = '';
            assert.ifError(err);
            assert.equal(result.user_map.not_signed.length, 1);
            it_done();
        });
    });

    it('should check submitter and committer when using submitter+committer mode', function (it_done) {
        config.server.feature_flag.required_signees = 'submitter, committer';
        testRes.claFindOne = null;
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }];

        var args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        cla.checkPullRequestSignatures(args, function (err, result) {
            config.server.feature_flag.required_signees = '';
            assert.ifError(err);
            assert.equal(result.user_map.not_signed.length, 3);
            it_done();
        });
    });
});

describe('cla.check', function () {
    beforeEach(function () {
        sinon.stub(cla, 'checkUserSignature').callsFake(function (args, done) {
            return done(null, { signed: true });
        });
        sinon.stub(cla, 'checkPullRequestSignatures').callsFake(function (args, done) {
            return done(null, { signed: true, user_map: {} });
        });
    });

    afterEach(function () {
        cla.checkUserSignature.restore();
        cla.checkPullRequestSignatures.restore();
    });

    it('Should call checkUser when user is given', function (it_done) {
        var args = {
            repo: 'repo',
            owner: 'owner',
            user: 'user'
        };
        cla.check(args, function (error, done) {
            assert(cla.checkUserSignature.called);
            assert(!cla.checkPullRequestSignatures.called);
            it_done();
        });
    });

    it('Should call checkPullRequest when user is NOT given and pull request number is given', function (it_done) {
        var args = {
            repo: 'repo',
            owner: 'owner',
            number: '1'
        };
        cla.check(args, function (error, done) {
            assert(cla.checkPullRequestSignatures.called);
            assert(!cla.checkUserSignature.called);
            it_done();
        });
    });

    it('Should send error if user or pull request number is NOT given', function (it_done) {
        var args = {
            repo: 'repo',
            owner: 'owner'
        };
        cla.check(args, function (error, done) {
            assert(error);
            assert(!cla.checkPullRequestSignatures.called);
            assert(!cla.checkUserSignature.called);
            it_done();
        });
    });
});

describe('cla:sign', function () {
    var testArgs = {};

    beforeEach(function () {
        stub();
        testArgs.claSign = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 3
        };

        testRes.repoServiceGet = {
            repoId: '123',
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc'
        };

        testRes.orgServiceGet = {
            orgId: '1',
            org: 'test_org',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc'
        };

        testRes.claFindOne = null;
        testRes.gistData = {
            data: {
                url: 'url',
                files: { xyFile: { content: 'some content' } },
                updated_at: '2011-06-20T11:34:15Z',
                history: [{ version: 'xyz' }]
            }
        };
        testErr.orgServiceGet = null;
        testErr.repoServiceGet = null;
        testErr.repoServiceGet = null;

        sinon.stub(CLA, 'create').callsFake(function (args, done) {
            assert(args);

            assert(args.repoId ? args.repoId : args.ownerId);
            assert(args.repo ? args.repo : args.org_cla);
            assert(args.owner);
            assert(args.userId);
            assert(args.gist_url);
            assert(args.gist_version);
            done(testErr.claCreate, testRes.claCreate);
        });
    });

    afterEach(function () {
        restore();
        CLA.create.restore();
    });

    it('should store signed cla data for repo if not signed yet', function (it_done) {
        cla.sign(testArgs.claSign, function () {
            assert(CLA.create.called);
            assert(CLA.findOne.called);
            assert(!org_service.get.called);
            it_done();
        });
    });

    it('should store signed cla data for org', function (it_done) {
        testRes.repoServiceGet = null;
        cla.sign(testArgs.claSign, function () {
            assert(CLA.create.called);

            assert(CLA.create.calledWithMatch({
                gist_url: 'url/gistId'
            }));
            assert(org_service.get.called);

            it_done();
        });
    });

    it('should store signed cla data for org even without repo name', function (it_done) {
        testArgs.claSign.repo = undefined;

        cla.sign(testArgs.claSign, function () {
            assert(CLA.create.called);

            assert(!repo_service.getGHRepo.called);
            assert(CLA.create.calledWithMatch({
                gist_url: 'url/gistId'
            }));
            assert(org_service.get.called);

            it_done();
        });
    });

    it('should do nothing if user has already signed', function (it_done) {
        testArgs.claSign.user = 'signedUser';
        testRes.claFindOne = {
            user: 'signedUser'
        };

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

    it('should send error message when a repo linked with an Null CLA', function (it_done) {
        testErr.claCreate = 'any DB error';
        testRes.claCreate = null;
        testRes.repoServiceGet.gist = null;

        cla.sign(testArgs.claSign, function (err, result) {
            assert(err);
            assert(err.code === 200);
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
        sinon.stub(CLA, 'create').callsFake(function (arg, done) {
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
        sinon.stub(repo_service, 'all').callsFake(function (done) {
            done(null, [{
                repo: 'repo1',
                gist_url: 'gist_url'
            }, {
                repo: 'repo2',
                gist_url: 'gist_url'
            }]);
        });

        sinon.stub(CLA, 'find').callsFake(function (arg, selectionCriteria, sortCriteria, done) {
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
        sinon.stub(repo_service, 'all').callsFake(function (done) {
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
        sinon.stub(CLA, 'find').callsFake(function (arg, selectionCriteria, sortCriteria, done) {
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
        sinon.stub(CLA, 'find').callsFake(function (arg, prop, options, done) {
            assert(arg);
            var resp = [{
                id: 2,
                created_at: '2011-06-20T11:34:15Z',
                gist_version: 'xyz'
            }];
            if (!arg.$or[0].gist_version) {
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
            assert.equal(CLA.find.calledWith({
                $or: [{
                    ownerId: 1,
                    gist_url: 'gistUrl'
                }]
            }), true);
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
            assert.equal(CLA.find.calledWithMatch({
                $or: [{
                    repoId: testData.repo.id,
                    gist_url: 'gistUrl'
                }]
            }), true);

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
        sinon.stub(CLA, 'find').callsFake(function (arg, prop, options, done) {
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

        cla.getAll(args, function (err) {
            assert(err);

            it_done();
        });
    });

    it('should get all clas for shared gist repo/org', function (it_done) {
        CLA.find.restore();
        sinon.stub(CLA, 'find').callsFake(function (arg, prop, options, done) {
            assert(arg);
            done();
        });
        var args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl',
                gist_version: 'xyz'
            },
            sharedGist: true
        };

        cla.getAll(args, function (err) {
            assert(CLA.find.calledWith({
                $or: [{
                    gist_url: args.gist.gist_url,
                    gist_version: args.gist.gist_version,
                    repoId: args.repoId
                }, {
                    repo: undefined,
                    owner: undefined,
                    gist_url: args.gist.gist_url,
                    gist_version: args.gist.gist_version
                }]
            }));
            it_done();
        });
    });

    it('should get only one newest cla per user if gist_version provided', function (it_done) {
        CLA.find.restore();
        sinon.stub(CLA, 'find').callsFake(function (arg, prop, options, done) {
            assert(arg);
            assert(options.sort);
            done(null, [{
                id: 1,
                created_at: '2011-06-20T11:34:15Z',
                repo: 'abc',
                userId: 1,
                gist_version: 'xyz'
            }, {
                id: 2,
                repo: undefined,
                userId: 1,
                created_at: '2017-06-20T11:34:15Z',
                gist_version: 'xyz'
            }]);
        });
        var args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl',
                gist_version: 'xyz'
            },
            sharedGist: true
        };

        cla.getAll(args, function (err, arr) {
            assert.equal(arr.length, 1);

            it_done();
        });
    });
});

describe('cla:getGist', function () {
    beforeEach(function () {
        sinon.stub(github, 'call').callsFake(function (args, done) {
            assert.equal(args.arg.id, 'gistId');
            done(null, {});
        });
    });

    afterEach(function () {
        github.call.restore();
    });

    it('should extract valid gist ID', function (it_done) {
        var repo = {
            gist: {
                gist_url: 'url/gists/gistId',
                gist_version: 'versionId'
            }
        };

        cla.getGist(repo, function () {
            it_done();
        });
    });

    it('should extract valid gist ID considering file names in the url', function (it_done) {
        var repo = {
            gist: {
                gist_url: 'url/gists/gistId#fileName',
                gist_version: 'versionId'
            }
        };

        cla.getGist(repo, function () {
            it_done();
        });
    });

    it('should handle repo without gist', function (it_done) {
        var repo = {};

        cla.getGist(repo, function (err) {
            assert.equal(err, 'The gist url "undefined" seems to be invalid');
            it_done();
        });
    });
});

describe('cla:getLinkedItem', function () {
    beforeEach(function () {
        testRes.repoServiceGet = {
            repoId: '1',
            repo: 'Hello-World',
            owner: 'octocat',
            gist: 'url/gistId',
            token: 'abc'
        };
        testRes.orgServiceGet = {
            orgId: '1',
            org: 'octocat',
            gist: 'url/gistId',
            token: 'abc'
        };
        testErr.repoServiceGetGHRepo = null;
        config.server.github.token = 'token';
        sinon.stub(repo_service, 'getGHRepo').callsFake(function (args, done) {
            assert(args.token);
            done(testErr.repoServiceGetGHRepo, testData.repo);
        });
        sinon.stub(repo_service, 'get').callsFake(function (args, done) {
            done(null, testRes.repoServiceGet);
        });
        sinon.stub(org_service, 'get').callsFake(function (args, done) {
            done(null, testRes.orgServiceGet);
        });
    });

    afterEach(function () {
        repo_service.getGHRepo.restore();
        repo_service.get.restore();
        org_service.get.restore();
    });

    it('should find linked item using reponame and owner parameters', function (it_done) {
        config.server.github.token = 'test_token';

        var args = {
            repo: 'Hello-World',
            owner: 'octocat'
        };

        cla.getLinkedItem(args, function () {
            assert(repo_service.getGHRepo.called);

            it_done();
        });
    });
    it('should return an error, if the GH Repo does not exist', function (it_done) {
        var testArgs = {
            repo: 'DoesNotExist',
            owner: 'NoOne'
        };
        testErr.repoServiceGetGHRepo = 'GH Repo not found';

        cla.getLinkedItem(testArgs, function (err) {
            assert(err == 'GH Repo not found');
            it_done();
        });
    });

    it('should return linked repo even corresponding org is also linked', function (it_done) {
        var args = {
            repo: 'Hello-World',
            owner: 'octocat',
            token: 'test_token'
        };
        cla.getLinkedItem(args, function () {
            assert(repo_service.getGHRepo.called);
            assert(repo_service.get.called);
            assert(!org_service.get.called);
            it_done();
        });
    });

    it('should return linked org when repo is not linked', function (it_done) {
        var args = {
            repo: 'Hello-World',
            owner: 'octocat',
            token: 'test_token'
        };
        testRes.repoServiceGet = null;
        cla.getLinkedItem(args, function () {
            assert(repo_service.getGHRepo.called);
            assert(repo_service.get.called);
            assert(org_service.get.called);
            it_done();
        });
    });

    it('should only check linked org if repo name is not provided', function (it_done) {
        var args = {
            owner: 'octocat'
        };

        cla.getLinkedItem(args, function () {
            assert(org_service.get.called);
            assert(!repo_service.get.called);
            assert(!repo_service.getGHRepo.called);
            it_done();
        });
    });
});

describe('cla:terminate', function () {
    var testArgs = {};

    beforeEach(function () {
        stub();
        testRes.repoServiceGet = {
            repoId: '123',
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc'
        };
        testErr.orgServiceGet = null;
        testErr.repoServiceGet = null;
        testErr.repoServiceGet = null;
        testRes.gistData = {
            data: {
                history: [{
                    version: "xyz"
                }]
            }
        };
    });

    afterEach(function () {
        restore();
    });

    it('should send error when terminate a null cla', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            token: 'test_token'
        };
        testRes.repoServiceGet.gist = undefined;
        cla.terminate(args, function (error, dbCla) {
            assert(error);
            assert(!dbCla);
            it_done();
        });
    });

    it('should send error when cannot find a signed cla to terminate', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            token: 'test_token'
        };
        testRes.claFindOne = null;
        cla.terminate(args, function (error, dbCla) {
            assert(error);
            assert(!dbCla);
            it_done();
        });
    });

    it('should successfully update the end_at when terminate a cla', function (it_done) {
        var args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'user',
            token: 'test_token'
        };
        testRes.claFindOne = {
            user: 'user',
            repoId: 'repoId',
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz',
            save: function () {
                return Promise.resolve('Success');
            }
        };
        cla.terminate(args, function (error, dbCla) {
            assert.ifError(error);
            assert(dbCla);
            it_done();
        });
    });
});

describe('cla:isClaRequired', function () {
    var args = null;
    beforeEach(function () {
        stub();
        args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'user',
            number: 1,
            token: 'userToken'
        };
        testRes.repoServiceGet = {
            repoId: 123,
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            token: 'abc'
        };
        testRes.pullRequestFiles = [
            {
                filename: 'test1',
                changes: 4,
            },
            {
                filename: 'test2',
                changes: 10,
            }
        ];
    });

    afterEach(function () {
        restore();
    });

    it('should require a CLA when minimum changes don\'t set up', function (it_done) {
        cla.isClaRequired(args, function (err, isClaRequired) {
            assert.ifError(err);
            assert(isClaRequired);
            it_done();
        });
    });

    it('should require a CLA when pull request exceed minimum file changes', function (it_done) {
        testRes.repoServiceGet.minFileChanges = 2;
        testRes.pullRequestFiles = {
            data: [{
                filename: 'test1'
            }, {
                filename: 'test2'
            }]
        };
        cla.isClaRequired(args, function (err, isClaRequired) {
            assert.ifError(err);
            assert(isClaRequired);
            it_done();
        });
    });

    it('should require a CLA when pull request exceed minimum code changes', function (it_done) {
        testRes.repoServiceGet.minCodeChanges = 15;
        testRes.pullRequestFiles = {
            data: [{
                filename: 'test1',
                changes: 5
            }, {
                filename: 'test2',
                changes: 10
            }]
        };
        cla.isClaRequired(args, function (err, isClaRequired) {
            assert.ifError(err);
            assert(isClaRequired);
            it_done();
        });
    });

    it('should NOT require a CLA when pull request NOT exceed minimum file and code changes', function (it_done) {
        testRes.repoServiceGet.minFileChanges = 2;
        testRes.repoServiceGet.minCodeChanges = 15;
        testRes.pullRequestFiles = {
            data: [{
                filename: 'test1',
                changes: 14,
            }]
        };
        cla.isClaRequired(args, function (err, isClaRequired) {
            assert.ifError(err);
            assert(!isClaRequired);
            it_done();
        });
    });

    it('should send error if repo, owner, number is not provided', function (it_done) {
        args = {};
        cla.isClaRequired(args, function (err, isClaRequired) {
            assert(err);
            it_done();
        });
    });

    it('should NOT send error if token is not provided but use linked item\'s token', function (it_done) {
        delete args.token;
        testRes.repoServiceGet.minCodeChanges = 15;
        testRes.pullRequestFiles = {
            data: [{
                filename: 'test1',
                changes: 15
            }]
        };
        cla.isClaRequired(args, function (err, isClaRequired) {
            assert.ifError(err);
            sinon.assert.calledWithMatch(github.call, { token: 'abc' });
            assert(isClaRequired);
            it_done();
        });
    });
});