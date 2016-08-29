/*global describe, it, beforeEach, afterEach*/

// unit test
var assert = require('assert');
var sinon = require('sinon');

//model
var Repo = require('../../../server/documents/repo').Repo;

//services
var github = require('../../../server/services/github');
var orgService = require('../../../server/services/org');
var url = require('../../../server/services/url');

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
    it('should find the cla repo', function(it_done){
        sinon.stub(Repo, 'findOne', function (args, done) {
            done(null, response);
        });
        repo.get({ repoId: 123 }, function(err, obj){
            assert(err == null);
            assert(obj === response);
            it_done();
        });
    });
    it('should raise an error, if the cla repo was not found', function(it_done){
        sinon.stub(Repo, 'findOne', function (args, done) {
            done(null, null);
        });
        repo.get({ repoId: 123 }, function(err, obj){
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
                save: function(){}
            }]);
        });

        arg = { set: [{
            repo: 'myRepo',
            owner: 'owner',
            repoId: 123
        }]};
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

    it('should use only repoIds for db selection', function(it_done){
        repo.getAll(arg, function (err, obj) {
            assert.ifError(err);
            assert.equal(obj.length, 1);
            it_done();
        });
    });

    it('should use only repoIds for db selection', function(it_done){
        repo.getAll(arg, function (err, obj) {
            assert.ifError(err);
            assert.equal(obj.length, 1);
            it_done();
        });
    });
});

describe('repo:getPRCommitters', function () {
    var test_repo;
    var test_org;

    beforeEach(function () {
        test_repo = {
            repo: 'myRepo',
            owner: 'myOwner',
            repoId: '1',
            token: 'abc',
            save: function () {}
        };
        test_org = null;

        sinon.stub(github, 'direct_call', function (args, done) {
            assert(args.token);
            assert.equal(args.url, url.githubPullRequestCommits('owner', 'myRepo', 1));
            done(null, {
                data: testData.commits
            });
        });
        sinon.stub(orgService, 'get', function (args, done) {
            done(null, test_org);
        });

        sinon.stub(Repo, 'findOne', function (args, done) {
            done(null, test_repo);
        });
    });

    afterEach(function () {
        github.direct_call.restore();
        orgService.get.restore();
        Repo.findOne.restore();
    });

    it('should get committer for a pull request', function (it_done) {
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        github.direct_call.restore();
        sinon.stub(github, 'direct_call', function (argums, done) {
            assert(argums.token);
            assert.equal(argums.url, url.githubPullRequestCommits('owner', 'myRepo', 1));
            done(null, {
                data: testData.commit
            });
        });

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            assert(github.direct_call.called);

            it_done();
        });

    });

    it('should get author of commit if committer is a github bot', function (it_done) {
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        github.direct_call.restore();
        sinon.stub(github, 'direct_call', function (argums, done) {
            assert(argums.token);
            assert.equal(argums.url, url.githubPullRequestCommits('owner', 'myRepo', 1));
            done(null, {
                data: testData.commit_done_by_bot
            });
        });

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 1);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            assert(github.direct_call.called);
        });

        it_done();
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
            assert(github.direct_call.called);
        });

        it_done();
    });

    it('should handle committers who has no github user', function (it_done) {
        github.direct_call.restore();
        sinon.stub(github, 'direct_call', function (argums, done) {
            done(null, {
                data: testData.commit_with_no_user
            });
        });
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
            assert(github.direct_call.called);
        });
        it_done();
    });

    it('should handle error', function (it_done) {
        github.direct_call.restore();
        sinon.stub(github, 'direct_call', function (args, done) {
            done(null, {
                data: {
                    message: 'Any Error message'
                }
            });
        });
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            assert(err);
            assert(Repo.findOne.called);
            assert(github.direct_call.calledOnce);
        });

        it_done();
    });

    it('should retry api call if gitHub returns "Not Found"', function (it_done) {
        this.timeout(4000);
        repo.timesToRetryGitHubCall = 3;
        github.direct_call.restore();
        sinon.stub(github, 'direct_call', function (args, done) {
            done(null, {
                data: {
                    message: 'Not Found'
                }
            });
        });
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            assert(err);
            assert(Repo.findOne.called);
            assert(github.direct_call.calledThrice);
        });
        setTimeout(it_done, 3500);
    });


    it('should get list of committers for a pull request using linked org', function (it_done) {
        test_repo = null;
        test_org = { token: 'abc' };
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
            assert.equal(orgService.get.calledWith({ orgId: 1 }), true);
            assert.equal(Repo.findOne.called, false);
            assert.equal(github.direct_call.called, true);

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
            assert(!github.direct_call.called);
        });

        it_done();
    });

    it('should update db entry if repo was transferred', function (it_done) {
        this.timeout(3000);
        github.direct_call.restore();
        sinon.stub(github, 'direct_call', function (args, done) {
            var res;
            if (args.url.indexOf('commits') > -1){
                res = args.url.indexOf('myRepo') > -1 ?
                    { data: { message: 'Moved Permanently' } } :
                    { data: testData.commits };
            } else {
                res = test_repo;
            }
            done(null, res);
        });
        sinon.stub(repo, 'getGHRepo', function (args, done) {
            done(null, { name: 'test_repo', owner: { login: 'test_owner' }, id: 1 });
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
            assert(github.direct_call.calledTwice);

            it_done();
            repo.getGHRepo.restore();
        });
        setTimeout(it_done, 2500);
    });
});

describe('repo:getUserRepos', function () {
    afterEach(function () {
        github.direct_call.restore();
        Repo.find.restore();
    });

    it('should return all linked repositories of the logged user', function (it_done) {
        sinon.stub(github, 'direct_call', function (args, done) {
            assert.equal(args.url.indexOf('https://api.github.com/user/repos?per_page=100'), 0);
            assert(args.token);
            done(null, {
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
            });
        });
        sinon.stub(Repo, 'find', function (args, done) {
            assert.equal(args.$or.length, 2);
            done(null, [{
                owner: 'login',
                repo: 'repo1',
                repoId: 123,
                save: function(){}
            }]);
        });

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
        sinon.stub(github, 'direct_call', function (args, done) {
            done(null, {
                data: {
                    message: 'Bad credentials'
                }
            });
        });
        sinon.stub(Repo, 'find', function (args, done) {
            done();
        });

        repo.getUserRepos({}, function (err) {
            assert.equal(err, 'Bad credentials');
            assert(!Repo.find.called);

            it_done();
        });
    });

    it('should handle mogodb error', function (it_done) {
        sinon.stub(github, 'direct_call', function (args, done) {
            done(null, {
                data: [{
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
            });
        });
        sinon.stub(Repo, 'find', function (args, done) {
            done('DB error');
        });

        repo.getUserRepos({}, function (err) {
            assert(err);
            assert(Repo.find.called);

            it_done();
        });
    });

    it('should handle affiliation attribute', function (it_done) {
        sinon.stub(github, 'direct_call', function (args, done) {
            assert(args.url.indexOf('affiliation=x,y') > -1);
            assert(args.token);
            done(null, {});
        });
        sinon.stub(Repo, 'find', function (args, done) {
            done();
        });
        repo.getUserRepos({
            token: 'test_token',
            affiliation: 'x,y'
        }, function (err) {
            assert.ifError(err);
            assert(github.direct_call.called);

            it_done();
        });
    });

    it('should handle affiliation if not provided', function (it_done) {
        sinon.stub(github, 'direct_call', function (args, done) {
            assert(args.url.indexOf('affiliation=owner') > -1);
            assert(args.token);
            done(null, {});
        });
        sinon.stub(Repo, 'find', function (args, done) {
            done();
        });
        repo.getUserRepos({
            token: 'test_token'
        }, function (err) {
            assert.ifError(err);
            assert(github.direct_call.called);

            it_done();
        });
    });

    it('should provide only repos with push rights', function(it_done){
        sinon.stub(github, 'direct_call', function (args, done) {
            assert(args.token);
            done(null, {data: testData.repos});
        });
        sinon.stub(Repo, 'find', function (args, done) {
            assert.equal(args.$or.length, 1);
            done(null, [{
                owner: 'login',
                repo: 'test_repo'
            }]);
        });

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
        var ghResponse = [{
            name: 'newRepoName',
            owner: { login: 'newOwner' },
            id: '123',
            permissions: { push: true }
        }];
        sinon.stub(github, 'direct_call', function (args, done) {
            assert(args.token);
            done(null, {
                data: ghResponse
            });
        });
        var dbResponse = [{
            repo: 'myRepo',
            owner: 'owner',
            repoId: 123,
            save: function(){}
        }];
        sinon.stub(Repo, 'find', function (args, done) {
            assert.equal(args.$or.length, 1);
            done(null, dbResponse);
        });
        sinon.spy(dbResponse[0], 'save');
        repo.getUserRepos({
            token: 'test_token'
        }, function (err, obj) {
            assert.equal(obj[0].repoId, 123);
            assert.equal(obj[0].repo, ghResponse[0].name);
            assert.equal(obj[0].owner, ghResponse[0].owner.login);
            assert(dbResponse[0].save.called);
            it_done();
        });
    });
});

describe('repo:getGHRepo', function () {
    afterEach(function () {
        github.direct_call.restore();
    });

    it('should return gitHub repo data', function (it_done) {
        var resData;
        sinon.stub(github, 'direct_call', function (args, done) {
            resData = {data: testData.repo};
            done(null, resData);
        });
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

    it('should recall github if repo is transferred and new url is provided', function(it_done){
        var resData;
        sinon.stub(github, 'direct_call', function (args, done) {
            if (args.url.indexOf('https://api.github.com/repos/octopus/Hello-World') >= 0 ) {
                resData = {data: {
                    url: 'https://api.github.com/repos/octocat/Hello-World',
                    message: 'Repo transferred'
                }};
            } else {
                resData = {data: testData.repo};
            }
            done(null, resData);
        });
        var args = {
            owner: 'octopus',
            repo: 'Hello-World',
            token: '123'
        };
        repo.getGHRepo(args, function (err, res) {
            assert.ifError(err);
            assert.equal(github.direct_call.calledTwice, true);
            assert.equal(res.owner.login, 'octocat');
            assert.equal(res.name, 'Hello-World');
            assert.equal(res.id, 1296269);

            it_done();
        });
    });
});
