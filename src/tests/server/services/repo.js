/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var Repo = require('../../../server/documents/repo').Repo;

//services
var github = require('../../../server/services/github');
var orgService = require('../../../server/services/org');
var logger = require('../../../server/services/logger');

// service under test
var repo = require('../../../server/services/repo');

// test data
var testData = require('../testData').data;

describe('repo:create', function () {
    afterEach(function () {
        Repo.create.restore();
    });

    it('should create repo entry ', function (it_done) {
        sinon.stub(Repo, 'create', function (args, done) {
            assert(args);
            assert(args.gist);
            assert(args.owner);
            assert(args.repoId);
            done(null, {
                repo: args.repo
            });
        });

        var arg = {
            repo: 'myRepo',
            user: 'login',
            owner: 'owner',
            repoId: '123',
            gist: 'url/gistId',
            token: 'abc'
        };
        repo.create(arg, function (err) {
            assert.ifError(err);
            it_done();
        });
    });
});

describe('repo:check', function () {
    afterEach(function () {
        Repo.findOne.restore();
    });

    it('should check repo entry with repo name and owner', function (it_done) {
        sinon.stub(Repo, 'findOne', function (args, done) {
            assert(args);
            assert(args.repo);
            assert(args.owner);
            done(null, {});
        });

        var arg = {
            repo: 'myRepo',
            owner: 'owner'
        };
        repo.check(arg, function (err, obj) {
            assert.ifError(err);
            assert(obj);
            it_done();
        });
    });

    it('should check repo entry only with repo id if given', function (it_done) {
        sinon.stub(Repo, 'findOne', function (args, done) {
            assert(args);
            assert(args.repoId);
            assert(!args.repo);
            assert(!args.owner);
            done(null, {});
        });

        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            repoId: 123
        };
        repo.check(arg, function (err, obj) {
            assert.ifError(err);
            assert(obj);
            it_done();
        });
    });
});

describe('repo:get', function () {
    var response = {};
    afterEach(function () {
        Repo.findOne.restore();
    });
    it('should find the cla repo', function (it_done) {
        sinon.stub(Repo, 'findOne', function (args, done) {
            done(null, response);
        });
        repo.get({
            repoId: 123
        }, function (err, obj) {
            assert(err == null);
            assert(obj === response);
            it_done();
        });
    });
    it('should raise an error, if the cla repo was not found', function (it_done) {
        sinon.stub(Repo, 'findOne', function (args, done) {
            done(null, null);
        });
        repo.get({
            repoId: 123
        }, function (err, obj) {
            assert(err === 'Repository not found in Database');
            assert(obj == null);
            it_done();
        });
    });
});

describe('repo:getAll', function () {
    var arg;
    var response;
    beforeEach(function () {
        sinon.stub(Repo, 'find', function (args, done) {
            assert(args.$or[0].repoId);
            assert(!args.$or[0].repo);
            assert(!args.$or[0].owner);
            done(null, response || [{
                save: function () {}
            }]);
        });

        arg = {
            set: [{
                repo: 'myRepo',
                owner: 'owner',
                repoId: 123
            }]
        };
    });
    afterEach(function () {
        Repo.find.restore();
    });

    it('should find cla repos from set of github repos', function (it_done) {
        repo.getAll(arg, function (err, obj) {
            assert.ifError(err);
            assert.equal(obj.length, 1);
            it_done();
        });
    });

    it('should use only repoIds for db selection', function (it_done) {
        repo.getAll(arg, function (err, obj) {
            assert.ifError(err);
            assert.equal(obj.length, 1);
            it_done();
        });
    });

    it('should use only repoIds for db selection', function (it_done) {
        repo.getAll(arg, function (err, obj) {
            assert.ifError(err);
            assert.equal(obj.length, 1);
            it_done();
        });
    });
});

describe('repo:getPRCommitters', function () {
    var test_repo, test_org, githubCallRes;

    beforeEach(function () {
        test_repo = {
            repo: 'myRepo',
            owner: 'myOwner',
            repoId: '1',
            token: 'abc',
            save: function () {}
        };
        test_org = null;
        githubCallRes = {
            getCommit: {
                err: null,
                data: testData.commit[0]
            },
            getCommits: {
                err: null,
                data: testData.commit
            },
            getPR: {
                err: null,
                data: testData.pull_request
            },
            getPRCommits: {
                err: null,
                data: testData.commits
            }
        };

        sinon.stub(github, 'call', function (args, done) {
            if (args.obj == 'pullRequests' && args.fun == 'get') {
                done(githubCallRes.getPR.err, githubCallRes.getPR.data);
            }
            if (args.obj == 'pullRequests' && args.fun == 'getCommits') {
                done(githubCallRes.getPRCommits.err, githubCallRes.getPRCommits.data);
            }
            if (args.obj == 'repos' && args.fun == 'getCommit') {
                done(githubCallRes.getCommit.err, githubCallRes.getCommit.data);
            }
            if (args.obj == 'repos' && args.fun == 'getCommits') {
                done(githubCallRes.getCommits.err, githubCallRes.getCommits.data);
            }
        });

        sinon.stub(orgService, 'get', function (args, done) {
            done(null, test_org);
        });

        sinon.stub(Repo, 'findOne', function (args, done) {
            done(null, test_repo);
        });

        sinon.stub(logger, 'error', function (msg) {
            assert(msg);
        });
        sinon.stub(logger, 'warn', function (msg) {
            assert(msg);
        });
        sinon.stub(logger, 'info', function (msg) {
            assert(msg);
        });
    });

    afterEach(function () {
        github.call.restore();
        orgService.get.restore();
        Repo.findOne.restore();
        logger.error.restore();
        logger.warn.restore();
        logger.info.restore();
    });

    it('should get committer for a pull request', function (it_done) {
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };
        githubCallRes.getPRCommits.data = testData.commit;

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));

            it_done();
        });

    });

    it('should get all committers of a pull request with more than 250 commits from the forked repo', function (it_done) {
        testData.pull_request.commits = 554;
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            assert(github.call.calledWithMatch({
                obj: 'repos',
                fun: 'getCommits'
            }));

            testData.pull_request.commits = 3;
            it_done();
        });
    });

    it('should call pull request api if could not find/load base commit', function (it_done) {
        testData.pull_request.commits = 554;
        githubCallRes.getCommit.err = 'Any Error';
        githubCallRes.getCommit.data = null;
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };
        githubCallRes.getPRCommits.data = testData.commit;

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));

            testData.pull_request.commits = 3;
            it_done();
        });
    });

    it('should get author of commit if committer is a github bot', function (it_done) {
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        githubCallRes.getPRCommits.data = testData.commit_done_by_bot;

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));

            it_done();
        });

    });

    it('should get list of committers for a pull request', function (it_done) {
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));

            it_done();
        });

    });

    it('should handle committers who has no github user', function (it_done) {
        githubCallRes.getPRCommits.data = testData.commit_with_no_user;

        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 1);
            // assert.equal(data[0].name, 'octocat');
            // assert(Repo.findOne.called);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));
        });
        it_done();
    });

    it('should handle error', function (it_done) {
        githubCallRes.getPRCommits.data = {
            message: 'Any Error message'
        };

        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            assert(err);
            assert(Repo.findOne.called);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));
        });

        it_done();
    });

    it('should retry api call if gitHub returns "Not Found"', function (it_done) {
        // githubCallRes.getPRCommits.data = {
        //     message: 'Not Found'
        // };
        this.timeout(4000);
        repo.timesToRetryGitHubCall = 1;
        githubCallRes.getPR.err = 'Not Found';
        githubCallRes.getPR.data = null;
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            // assert(err);
            assert(Repo.findOne.called);
            assert(github.call.calledThrice);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));
            it_done();
        });
    });

    it('should retry api call if gitHub returns "Not Found"', function (it_done) {
        githubCallRes.getPRCommits.data = {
            message: 'Not Found'
        };
        this.timeout(4000);
        repo.timesToRetryGitHubCall = 1;
        githubCallRes.getPR.err = null;
        githubCallRes.getPR.data = {
            message: 'Not Found'
        };
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            // assert(err);
            assert(Repo.findOne.called);
            assert.equal(github.call.callCount, 4);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));
            it_done();
        });
    });


    it('should get list of committers for a pull request using linked org', function (it_done) {
        test_repo = null;
        test_org = {
            token: 'abc'
        };
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1',
            orgId: 1
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'octocat');
            assert.equal(orgService.get.calledWith({
                orgId: 1
            }), true);
            assert.equal(Repo.findOne.called, false);
            assert(github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));

            it_done();
        });

    });

    it('should handle request for not linked repos and orgs', function (it_done) {
        test_repo = null;

        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            assert(err);
            assert(Repo.findOne.called);
            assert(!github.call.calledWithMatch({
                obj: 'pullRequests',
                fun: 'getCommits'
            }));
        });

        it_done();
    });

    it('should update db entry if repo was transferred', function (it_done) {
        this.timeout(3000);

        github.call.restore();
        sinon.stub(github, 'call');
        github.call.onFirstCall().callsArgWith(1, githubCallRes.getPR.err, githubCallRes.getPR.data);
        github.call.withArgs({
                obj: 'pullRequests',
                fun: 'getCommits',
                token: 'abc',
                arg: {
                    number: '1',
                    owner: 'owner',
                    per_page: 100,
                    repo: 'myRepo'
                }
            })
            .onFirstCall().callsArgWith(1, null, {
                message: 'Moved Permanently'
            });
        github.call.onThirdCall().callsArgWith(1, null, testData.commits);

        sinon.stub(repo, 'getGHRepo', function (args, done) {
            done(null, {
                name: 'test_repo',
                owner: {
                    login: 'test_owner'
                },
                id: 1
            });
        });
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            repoId: 1,
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            assert.ifError(err);
            assert(Repo.findOne.called);
            assert(github.call.calledThrice);

            it_done();
            repo.getGHRepo.restore();
        });
    });
});

describe('repo:getUserRepos', function () {
    var githubCallRes, repoFindRes, assertFunction;

    beforeEach(function () {
        githubCallRes = {
            err: null,
            data: [{
                id: 123,
                owner: {
                    login: 'login'
                },
                name: 'repo1',
                permissions: {
                    admin: false,
                    push: true,
                    pull: true
                }
            }, {
                id: 456,
                owner: {
                    login: 'login'
                },
                name: 'repo2',
                permissions: {
                    admin: false,
                    push: true,
                    pull: true
                }
            }]
        };

        repoFindRes = {
            err: null,
            data: [{
                owner: 'login',
                repo: 'repo1',
                repoId: 123,
                save: function () {}
            }]
        };
        sinon.stub(github, 'call', function (args, done) {
            if (args.obj == 'repos' && args.fun == 'getAll') {
                done(githubCallRes.err, githubCallRes.data);
            }
        });

        sinon.stub(Repo, 'find', function (args, done) {
            if (assertFunction) {
                assertFunction(args);
            }
            done(repoFindRes.err, repoFindRes.data);
        });
    });

    afterEach(function () {
        assertFunction = undefined;
        github.call.restore();
        Repo.find.restore();
    });

    it('should return all linked repositories of the logged user', function (it_done) {
        assertFunction = function (args) {
            assert.equal(args.$or.length, 2);
        };

        repo.getUserRepos({
            token: 'test_token'
        }, function (err, res) {
            assert.ifError(err);
            assert(res[0].repo, 'repo1');
            assert(Repo.find.called);

            it_done();
        });
    });

    it('should handle github error', function (it_done) {
        githubCallRes.data = {
            message: 'Bad credentials'
        };

        repo.getUserRepos({}, function (err) {
            assert.equal(err, 'Bad credentials');
            assert(!Repo.find.called);

            it_done();
        });
    });

    it('should handle mogodb error', function (it_done) {
        repoFindRes.err = 'DB error';
        repoFindRes.data = undefined;

        repo.getUserRepos({}, function (err) {
            assert(err);
            assert(Repo.find.called);

            it_done();
        });
    });

    it('should handle affiliation attribute', function (it_done) {
        github.call.restore();
        sinon.stub(github, 'call', function (args, done) {
            assert(args.arg.affiliation === 'x,y');
            assert(args.token);
            done(githubCallRes.err, githubCallRes.data);
        });

        repo.getUserRepos({
            token: 'test_token',
            affiliation: 'x,y'
        }, function (err) {
            assert.ifError(err);
            assert(github.call.called);

            it_done();
        });
    });

    it('should handle affiliation if not provided', function (it_done) {
        github.call.restore();
        sinon.stub(github, 'call', function (args, done) {
            assert(args.arg.affiliation === 'owner,organization_member');
            assert(args.token);
            done(githubCallRes.err, githubCallRes.data);
        });

        repo.getUserRepos({
            token: 'test_token'
        }, function (err) {
            assert.ifError(err);
            assert(github.call.called);

            it_done();
        });
    });

    it('should provide only repos with push rights', function (it_done) {
        githubCallRes.data = testData.repos;
        repoFindRes.data = [{
            owner: 'login',
            repo: 'test_repo'
        }];
        assertFunction = function (args) {
            assert.equal(args.$or.length, 1);
        };

        repo.getUserRepos({
            token: 'test_token'
        }, function (err, res) {
            assert.ifError(err);
            assert(res.length === 1);
            assert(Repo.find.called);

            it_done();
        });
    });

    it('should update repo name and owner on db if github repo was transferred', function (it_done) {
        githubCallRes.data = [{
            name: 'newRepoName',
            owner: {
                login: 'newOwner'
            },
            id: '123',
            permissions: {
                push: true
            }
        }];
        repoFindRes.data = [{
            repo: 'myRepo',
            owner: 'owner',
            repoId: 123,
            save: function () {}
        }];

        sinon.spy(repoFindRes.data[0], 'save');
        repo.getUserRepos({
            token: 'test_token'
        }, function (err, obj) {
            assert.ifError(err);
            assert.equal(obj[0].repoId, 123);
            assert.equal(obj[0].repo, githubCallRes.data[0].name);
            assert.equal(obj[0].owner, githubCallRes.data[0].owner.login);
            assert(repoFindRes.data[0].save.called);
            it_done();
        });
    });
});

describe('repo:getGHRepo', function () {
    var githubCallRes;

    beforeEach(function () {
        githubCallRes = {
            err: null,
            data: testData.repo
        };

        sinon.stub(github, 'call', function (args, done) {
            done(githubCallRes.err, githubCallRes.data);
        });

    });
    afterEach(function () {
        github.call.restore();
    });

    it('should return gitHub repo data', function (it_done) {
        var args = {
            owner: 'octocat',
            repo: 'Hello-World',
            token: '123'
        };
        repo.getGHRepo(args, function (err, res) {
            assert.ifError(err);
            assert.equal(res.name, 'Hello-World');
            assert.equal(res.id, 1296269);

            it_done();
        });
    });
});