/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

// module
var repo = require('../../../server/services/repo');

//model
var Repo = require('../../../server/documents/repo').Repo;


// api
var repo_api = require('../../../server/api/repo');


describe('repo', function () {
    describe('on repo:create', function() {
        var req, res;
        beforeEach(function () {
            req = {
                args: {
                    repoId: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    gist: 1234
                },
                user: {
                    token: 'abc'
                }
            };
            res = {
                repoGet: {
                    err: null,
                    data: null
                },
                repoGetGHRepo: {
                    err: null,
                    data: null
                },
                repoUpdate: {
                    err: null,
                    data: null
                }
            };
            sinon.stub(repo, 'get', function (args, done) {
                done(res.repoGet.err, res.repoGet.data);
            });
            sinon.stub(repo, 'getGHRepo', function (args, done) {
                done(res.repoGetGHRepo.err, res.repoGetGHRepo.data);
            });
            sinon.stub(repo, 'create', function (args, done) {
                done();
            });
            sinon.stub(repo, 'update', function (args, done) {
                done(res.repoUpdate.err, res.repoUpdate.data);
            });
        });
        afterEach(function () {
            repo.create.restore();
            repo.get.restore();
            repo.getGHRepo.restore();
            repo.update.restore();
        });

        it('should create repo via service', function (it_done) {
            repo_api.create(req, function () {
                assert(repo.get.called);
                assert.equal(repo.create.calledWith({
                    repoId: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    gist: 1234,
                    token: 'abc'
                }), true);

                it_done();
            });
        });

        it('should update repo if there is one and it is not valid any more', function (it_done) {
            res.repoGet.data = {
                repoId: 321,
                repo: 'myRepo',
                owner: 'login'
            };
            res.repoGetGHRepo.err = 'Repo is not valid anymore';
            repo_api.create(req, function () {
                assert(repo.get.called);
                assert(repo.getGHRepo.called);
                assert.equal(repo.update.calledWith({
                    repoId: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    gist: 1234,
                    token: 'abc'
                }), true);

                it_done();
            });
        });

        it('should update repo if there is one and it is not valid any more', function (it_done) {
            res.repoGet.data = {
                repoId: 321,
                repo: 'myRepo',
                owner: 'login'
            };
            res.repoGetGHRepo.data = {
                id: 123
            };
            repo_api.create(req, function () {
                assert(repo.get.called);
                assert(repo.getGHRepo.called);
                assert.equal(repo.update.calledWith({
                    repoId: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    gist: 1234,
                    token: 'abc'
                }), true);

                it_done();
            });
        });

        it('should fail to create if there is a valid one already', function (it_done) {
            res.repoGet.data = {
                repoId: 123,
                repo: 'myRepo',
                owner: 'login'
            };
            res.repoGetGHRepo.data = {
                id: 123
            };
            repo_api.create(req, function (err) {
                assert(err);
                assert(repo.getGHRepo.called);

                it_done();
            });
        });
    });

    it('should check via repo service', function (it_done) {
        var repoStub = sinon.stub(repo, 'check', function (args, done) {
            assert.deepEqual(args, {
                repo: 'myRepo',
                owner: 'login'
            });
            done();
        });

        var req = {
            args: {
                repo: 'myRepo',
                owner: 'login'
            }
        };

        repo_api.check(req, function () {
            repoStub.restore();
            it_done();
        });
    });

    it('should update via repo service', function (it_done) {
        var repoStub = sinon.stub(Repo, 'findOne', function (args, done) {
            var r = {
                owner: 'login',
                gist: 1234,
                save: function (cb) {
                    assert.equal(this.gist, 'url');
                    cb(null, this);
                }
            };
            done(null, r);
        });

        var req = {
            args: {
                repo: 'myRepo',
                owner: 'login',
                gist: 'url'
            }
        };

        repo_api.update(req, function () {
            repoStub.restore();
            it_done();
        });
    });

    it('should remove via repo service', function (it_done) {
        var repoStub = sinon.stub(Repo, 'remove', function () {
            var r = {
                exec: function (cb) {
                    cb(null);
                }
            };
            return r;
        });

        var req = {
            args: {
                repo: 'myRepo',
                owner: 'login',
                gist: 'url'
            }
        };

        repo_api.remove(req, function () {
            assert.equal(repoStub.called, 1);
            repoStub.restore();

            it_done();
        });
    });

    it('should get all repos for user', function () {
        sinon.stub(Repo, 'find', function (args, cb) {
            if (args.$or && args.$or[0].repoId === 123) {
                var r = {
                    owner: 'login',
                    gist: 1234,
                    repoId: 123,
                    save: function () {}
                };
                cb(null, [r]);
                return;
            }
            cb('no repo found');
        });

        var req = {
            user: {
                login: 'login'
            },
            args: {
                set: [{
                    owner: 'login',
                    repo: 'repo',
                    repoId: 123
                }]
            }
        };

        repo_api.getAll(req, function (error, res) {
            Repo.find.restore();
            assert.equal(res.length, 1);
        });
    });
});
