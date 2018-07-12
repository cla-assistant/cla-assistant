/*eslint no-unused-expressions: "off", no-empty-function: "off"*/
/*global describe, it, beforeEach, afterEach*/

// unit test
let assert = require('assert');
let sinon = require('sinon');

//model
let Repo = require('../../../server/documents/repo').Repo;

//services
let github = require('../../../server/services/github');
let orgService = require('../../../server/services/org');
let logger = require('../../../server/services/logger');
let queries = require('../../../server/graphQueries/github');

// service under test
let repo = require('../../../server/services/repo');

// test data
let testData = require('../testData').data;

describe('repo:create', function () {
    afterEach(function () {
        Repo.create.restore();
    });

    it('should create repo entry ', function (it_done) {
        sinon.stub(Repo, 'create').callsFake(function (args, done) {
            assert(args);
            assert(args.gist);
            assert(args.owner);
            assert(args.repoId);
            done(null, {
                repo: args.repo
            });
        });

        let arg = {
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
        sinon.stub(Repo, 'findOne').callsFake(function (args, done) {
            assert(args);
            assert(args.repo);
            assert(args.owner);
            done(null, {});
        });

        let arg = {
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
        sinon.stub(Repo, 'findOne').callsFake(function (args, done) {
            assert(args);
            assert(args.repoId);
            assert(!args.repo);
            assert(!args.owner);
            done(null, {});
        });

        let arg = {
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
    let response = {};
    afterEach(function () {
        Repo.findOne.restore();
    });
    it('should find the cla repo', function (it_done) {
        sinon.stub(Repo, 'findOne').callsFake(function (args, done) {
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
        sinon.stub(Repo, 'findOne').callsFake(function (args, done) {
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
    let arg;
    let response;
    beforeEach(function () {
        sinon.stub(Repo, 'find').callsFake(function (args, done) {
            assert(args.$or[0].repoId);
            assert(!args.$or[0].repo);
            assert(!args.$or[0].owner);
            done(null, response || [{
                save: function () { }
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
    let test_repo, test_org, githubCallGraphqlRes, pagesNumber = 1;

    beforeEach(function () {
        test_repo = {
            repo: 'myRepo',
            owner: 'myOwner',
            repoId: '1',
            token: 'abc',
            save: function () { }
        };
        test_org = null;
        githubCallGraphqlRes = {
            getPRCommitters: {
                err: null,
                res: {},
                body: JSON.parse(JSON.stringify(testData.graphqlPRCommitters))
            }
        };

        sinon.stub(github, 'callGraphql').callsFake(function (query, token, done) {
            assert(query);
            assert(token);
            if (pagesNumber > 1) {
                githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.pageInfo.hasNextPage = true;
                pagesNumber--;
            } else if (githubCallGraphqlRes.getPRCommitters.body && githubCallGraphqlRes.getPRCommitters.body.data) {
                githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.pageInfo.hasNextPage = false;
            }

            done(
                githubCallGraphqlRes.getPRCommitters.err,
                githubCallGraphqlRes.getPRCommitters.res,
                JSON.stringify(githubCallGraphqlRes.getPRCommitters.body)
            );
        });

        sinon.stub(orgService, 'get').callsFake(function (args, done) {
            done(null, test_org);
        });

        sinon.stub(Repo, 'findOne').callsFake(function (args, done) {
            done(null, test_repo);
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
    });

    afterEach(function () {
        github.callGraphql.restore();
        orgService.get.restore();
        Repo.findOne.restore();
        logger.error.restore();
        logger.warn.restore();
        logger.info.restore();
    });

    it('should get committer for a pull request', function (it_done) {
        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);

            it_done();
        });

    });

    it('should get all committers of a pull request with more than 250 commits from the forked repo', function (it_done) {
        pagesNumber = 2;
        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            sinon.assert.calledTwice(github.callGraphql);

            it_done();
        });
    });

    // it('should call pull request api if could not find/load base commit', function (it_done) {
    //     testData.pull_request.commits = 554;
    //     githubCallRes.getCommit.err = 'Any Error';
    //     githubCallRes.getCommit.data = null;
    //     var arg = {
    //         repo: 'myRepo',
    //         owner: 'owner',
    //         number: '1'
    //     };
    //     githubCallRes.getPRCommits.data = testData.commit;

    //     repo.getPRCommitters(arg, function (err, data) {
    //         assert.ifError(err);
    //         assert.equal(data.length, 1);
    //         assert.equal(data[0].name, 'octocat');
    //         assert(Repo.findOne.called);
    //         assert(github.call.calledWithMatch({
    //             obj: 'pullRequests',
    //             fun: 'getCommits'
    //         }));

    //         testData.pull_request.commits = 3;
    //         it_done();
    //     });
    // });

    it('should get author of commit if committer is a github bot', function (it_done) {
        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.user.login = 'web-flow';

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            sinon.assert.called(github.callGraphql);

            it_done();
        });

    });

    it('should get author of commit if committer is another github bot', function (it_done) {
        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.user = null;
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.name = 'GitHub';

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'octocat');
            assert(Repo.findOne.called);
            sinon.assert.called(github.callGraphql);

            it_done();
        });

    });

    it('should get list of committers for a pull request', function (it_done) {
        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[1].name, 'testUser');
            assert(Repo.findOne.called);
            sinon.assert.called(github.callGraphql);

            it_done();
        });

    });

    it('should handle committers who has no github user', function (it_done) {
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.user = null;
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.name = 'Unknown User';
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.author.user = null;
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.author.name = 'Unknown User';

        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, data) {
            assert.ifError(err);
            assert.equal(data.length, 2);
            assert.equal(data[0].name, 'Unknown User');
            sinon.assert.called(github.callGraphql);

        });
        it_done();
    });

    it('should handle github error', function (it_done) {
        githubCallGraphqlRes.getPRCommitters.res = {
            message: 'Any Error message'
        };

        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };
        this.timeout(4000);

        repo.getPRCommitters(arg, function (err) {
            assert(err);
            assert(Repo.findOne.called);
            sinon.assert.called(github.callGraphql);
            it_done();
        });
    });

    it('should handle query error', function (it_done) {
        githubCallGraphqlRes.getPRCommitters.res = {};
        githubCallGraphqlRes.getPRCommitters.body = {
            data: null,
            errors: [
                {
                    message: `Field 'names' doesn't exist on type 'Organization'`, // eslint-disable-line quotes
                }
            ]
        };

        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, committers) {
            assert(err);
            assert(!committers);
            assert(Repo.findOne.called);
            sinon.assert.called(logger.info);
            sinon.assert.called(github.callGraphql);
            it_done();
        });
    });

    it('should handle call error', function (it_done) {
        githubCallGraphqlRes.getPRCommitters.err = 'Any error';

        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err, committers) {
            assert(err);
            assert(!committers);
            assert(Repo.findOne.called);
            sinon.assert.called(logger.info);
            sinon.assert.called(github.callGraphql);
            it_done();
        });

    });

    it('should retry api call if gitHub returns "Not Found"', function (it_done) {
        github.callGraphql.restore();
        sinon.stub(github, 'callGraphql').callsFake(function (query, token, done) {
            done(
                githubCallGraphqlRes.getPRCommitters.err,
                { message: 'Not Found' },
                'null'
            );
        });
        this.timeout(4000);
        repo.timesToRetryGitHubCall = 2;
        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function () {
            // assert(err);
            assert(Repo.findOne.called);
            sinon.assert.calledThrice(github.callGraphql);

            it_done();
        });
    });


    it('should get list of committers for a pull request using linked org', function (it_done) {
        test_repo = null;
        test_org = {
            token: 'abc'
        };
        let arg = {
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
            assert(Repo.findOne.called);
            sinon.assert.called(github.callGraphql);

            it_done();
        });

    });

    it('should handle request for not linked repos and orgs', function (it_done) {
        test_repo = null;

        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            assert(err);
            assert(Repo.findOne.called);
            sinon.assert.notCalled(github.callGraphql);
            it_done();
        });

    });

    it('should update db entry if repo was transferred', function (it_done) {
        this.timeout(3000);

        github.callGraphql.restore();
        sinon.stub(github, 'callGraphql');
        github.callGraphql.onFirstCall().callsArgWith(2, null, {
            message: 'Moved Permanently'
        }, 'null');
        github.callGraphql.onSecondCall().callsArgWith(2, null, {}, JSON.stringify(githubCallGraphqlRes.getPRCommitters.body));

        sinon.stub(repo, 'getGHRepo').callsFake(function (args, done) {
            done(null, {
                name: 'test_repo',
                owner: {
                    login: 'test_owner'
                },
                id: 1
            });
        });
        let arg = {
            repo: 'myRepo',
            owner: 'owner',
            repoId: 1,
            number: '1'
        };

        repo.getPRCommitters(arg, function (err) {
            assert.ifError(err);
            assert(Repo.findOne.called);
            assert(repo.getGHRepo.called);
            sinon.assert.calledWithMatch(github.callGraphql, queries.getPRCommitters('test_owner', 'test_repo', '1', ''));
            assert(github.callGraphql.calledTwice);

            it_done();
            repo.getGHRepo.restore();
        });
    });
});

describe('repo:getUserRepos', function () {
    let githubCallRes, repoFindRes, assertFunction;

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
                save: function () { }
            }]
        };
        sinon.stub(github, 'call').callsFake(function (args, done) {
            if (args.obj == 'repos' && args.fun == 'getAll') {
                done(githubCallRes.err, githubCallRes.data);
            }
        });

        sinon.stub(Repo, 'find').callsFake(function (args, done) {
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
        sinon.stub(github, 'call').callsFake(function (args, done) {
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
        sinon.stub(github, 'call').callsFake(function (args, done) {
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
            save: function () { }
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
    let githubCallRes;

    beforeEach(function () {
        githubCallRes = {
            err: null,
            data: testData.repo
        };

        sinon.stub(github, 'call').callsFake(function (args, done) {
            done(githubCallRes.err, githubCallRes.data);
        });

    });
    afterEach(function () {
        github.call.restore();
    });

    it('should return gitHub repo data', function (it_done) {
        let args = {
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