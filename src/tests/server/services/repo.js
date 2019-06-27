/*eslint no-unused-expressions: "off", no-empty-function: "off"*/
/*global describe, it, beforeEach, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')

//model
const Repo = require('../../../server/documents/repo').Repo

//services
const github = require('../../../server/services/github')
const orgService = require('../../../server/services/org')
const logger = require('../../../server/services/logger')
const queries = require('../../../server/graphQueries/github')

// service under test
const repo = require('../../../server/services/repo')

// test data
const testData = require('../testData').data

describe('repo:create', () => {
    afterEach(() => Repo.create.restore())

    it('should create repo entry ', async () => {
        sinon.stub(Repo, 'create').callsFake(async (args) => {
            assert(args)
            assert(args.gist)
            assert(args.owner)
            assert(args.repoId)
            return { repo: args.repo }
        })

        const arg = {
            repo: 'myRepo',
            user: 'login',
            owner: 'owner',
            repoId: '123',
            gist: 'url/gistId',
            token: 'abc'
        }

        await repo.create(arg)
    })
})

describe('repo:check', () => {
    afterEach(() => Repo.findOne.restore())

    it('should check repo entry with repo name and owner', async () => {
        sinon.stub(Repo, 'findOne').callsFake(async (args) => {
            assert(args)
            assert(args.repo)
            assert(args.owner)
            return {}
        })

        const arg = {
            repo: 'myRepo',
            owner: 'owner'
        }

        const obj = await repo.check(arg)
        assert(obj)
    })

    it('should check repo entry only with repo id if given', async () => {
        sinon.stub(Repo, 'findOne').callsFake(async (args) => {
            assert(args)
            assert(args.repoId)
            assert(!args.repo)
            assert(!args.owner)
            return {}
        })

        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            repoId: 123
        }

        const obj = await repo.check(arg)
        assert(obj)
    })
})

describe('repo:get', () => {
    const response = {}
    afterEach(() => Repo.findOne.restore())

    it('should find the cla repo', async () => {
        sinon.stub(Repo, 'findOne').callsFake(async () => response)

        const obj = await repo.get({ repoId: 123 })
        assert(obj === response)
    })

    // it('should raise an error, if the cla repo was not found', async () => {
    //     sinon.stub(Repo, 'findOne').callsFake(async () => null)

    //     try {
    //         await repo.get({ repoId: 123 })
    //         assert(false, 'should have thrown an error')
    //     } catch (error) {
    //         assert(error.message === 'Repository not found in Database')
    //     }
    // })
})

describe('repo:getAll', () => {
    let arg
    let response

    beforeEach(() => {
        sinon.stub(Repo, 'find').callsFake(async (args) => {
            assert(args.$or[0].repoId)
            assert(!args.$or[0].repo)
            assert(!args.$or[0].owner)
            return response || [{
                save: () => { }
            }]
        })

        arg = {
            set: [{
                repo: 'myRepo',
                owner: 'owner',
                repoId: 123
            }]
        }
    })

    afterEach(() => Repo.find.restore())

    it('should find cla repos from set of github repos', async () => {
        const obj = await repo.getAll(arg)
        assert.equal(obj.length, 1)
    })

    it('should use only repoIds for db selection', async () => {
        const obj = await repo.getAll(arg)
        assert.equal(obj.length, 1)
    })

    // it('should get all repos for user', async () => {
    //     Repo.find.restore()
    //     sinon.stub(Repo, 'find').callsFake(async (args) => {
    //         if (args.$or && args.$or[0].repoId === 123) {
    //             return {
    //                 owner: 'login',
    //                 gist: 1234,
    //                 repoId: 123,
    //                 save: async () => { }
    //             }
    //         }
    //         throw 'no repo found'
    //     })

    //     const req = {
    //         user: {
    //             login: 'login'
    //         },
    //         args: {
    //             set: [{
    //                 owner: 'login',
    //                 repo: 'repo',
    //                 repoId: 123
    //             }]
    //         }
    //     }

    //     const res = await repo.getAll(req)
    //     assert.equal(res.length, 1)
    // })
})

describe('repo:getPRCommitters', () => {
    let testRepo, testOrg, githubCallGraphqlRes
    let pagesNumber = 1

    beforeEach(() => {
        testRepo = {
            repo: 'myRepo',
            owner: 'myOwner',
            repoId: '1',
            token: 'abc',
            save: () => { }
        }
        testOrg = null
        githubCallGraphqlRes = {
            getPRCommitters: {
                err: null,
                res: {},
                body: JSON.parse(JSON.stringify(testData.graphqlPRCommitters))
            }
        }

        sinon.stub(github, 'callGraphql').callsFake(async (query, token) => {
            assert(query)
            assert(token)
            if (pagesNumber > 1) {
                githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.pageInfo.hasNextPage = true
                pagesNumber--
            } else if (githubCallGraphqlRes.getPRCommitters.body && githubCallGraphqlRes.getPRCommitters.body.data) {
                githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.pageInfo.hasNextPage = false
            }

            if (githubCallGraphqlRes.getPRCommitters.err) {
                throw new Error(githubCallGraphqlRes.getPRCommitters.err)
            }
            return JSON.stringify(githubCallGraphqlRes.getPRCommitters.body)
        })

        sinon.stub(orgService, 'get').callsFake(async () => testOrg)
        sinon.stub(Repo, 'findOne').callsFake(async () => testRepo)
        sinon.stub(logger, 'error').callsFake((msg) => assert(msg))
        sinon.stub(logger, 'warn').callsFake((msg) => assert(msg))
        sinon.stub(logger, 'info').callsFake((msg) => assert(msg))
    })

    afterEach(() => {
        github.callGraphql.restore()
        orgService.get.restore()
        Repo.findOne.restore()
        logger.error.restore()
        logger.warn.restore()
        logger.info.restore()
    })

    it('should get committer for a pull request', async () => {
        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const data = await repo.getPRCommitters(arg)
        assert.equal(data.length, 2)
        assert.equal(data[0].name, 'octocat')
        assert(Repo.findOne.called)
    })

    it('should get all committers of a pull request with more than 250 commits from the forked repo', async () => {
        pagesNumber = 2
        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const data = await repo.getPRCommitters(arg)
        assert.equal(data.length, 2)
        assert.equal(data[0].name, 'octocat')
        assert(Repo.findOne.called)
        sinon.assert.calledTwice(github.callGraphql)
    })

    // it('should call pull request api if could not find/load base commit', async () => {
    //     testData.pull_request.commits = 554
    //     githubCallRes.getCommit.err = 'Any Error'
    //     githubCallRes.getCommit.data = null
    //     var arg = {
    //         repo: 'myRepo',
    //         owner: 'owner',
    //         number: '1'
    //     }
    //     githubCallRes.getPRCommits.data = testData.commit

    //     repo.getPRCommitters(arg, function (err, data) {
    //         assert.ifError(err)
    //         assert.equal(data.length, 1)
    //         assert.equal(data[0].name, 'octocat')
    //         assert(Repo.findOne.called)
    //         assert(github.call.calledWithMatch({
    //             obj: 'pullRequests',
    //             fun: 'getCommits'
    //         }))

    //         testData.pull_request.commits = 3
    //         it_done()
    //     })
    // })

    it('should get author of commit if committer is a github bot', async () => {
        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.user.login = 'web-flow'

        const data = await repo.getPRCommitters(arg)
        assert.equal(data.length, 2)
        assert.equal(data[0].name, 'octocat')
        assert(Repo.findOne.called)
        sinon.assert.called(github.callGraphql)
    })

    it('should get author of commit if committer is another github bot', async () => {
        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.user = null
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.name = 'GitHub'

        const data = await repo.getPRCommitters(arg)
        assert.equal(data.length, 2)
        assert.equal(data[0].name, 'octocat')
        assert(Repo.findOne.called)
        sinon.assert.called(github.callGraphql)
    })

    it('should get list of committers for a pull request', async () => {
        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const data = await repo.getPRCommitters(arg)
        assert.equal(data.length, 2)
        assert.equal(data[1].name, 'testUser')
        assert(Repo.findOne.called)
        sinon.assert.called(github.callGraphql)
    })

    it('should handle committers who has no github user', async () => {
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.user = null
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.committer.name = 'Unknown User'
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.author.user = null
        githubCallGraphqlRes.getPRCommitters.body.data.repository.pullRequest.commits.edges[0].node.commit.author.name = 'Unknown User'

        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const data = await repo.getPRCommitters(arg)
        assert.equal(data.length, 2)
        assert.equal(data[0].name, 'Unknown User')
        sinon.assert.called(github.callGraphql)
    })

    it('should handle github error', async () => {
        githubCallGraphqlRes.getPRCommitters.res = {
            message: 'Any Error message'
        }
        repo.timesToRetryGitHubCall = 0

        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }
        try {
            await repo.getPRCommitters(arg)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(Repo.findOne.called)
            sinon.assert.called(github.callGraphql)
        }
    })

    it('should handle query error', async () => {
        githubCallGraphqlRes.getPRCommitters.res = {}
        githubCallGraphqlRes.getPRCommitters.body = {
            data: null,
            errors: [
                {
                    message: `Field 'names' doesn't exist on type 'Organization'`, // eslint-disable-line quotes
                }
            ]
        }
        repo.timesToRetryGitHubCall = 0

        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            await repo.getPRCommitters(arg)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(Repo.findOne.called)
            sinon.assert.called(logger.info)
            sinon.assert.called(github.callGraphql)
        }
    })

    it('should handle call error', async () => {
        githubCallGraphqlRes.getPRCommitters.err = 'Any error'
        repo.timesToRetryGitHubCall = 0

        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }
        try {
            await repo.getPRCommitters(arg)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(Repo.findOne.called)
            sinon.assert.called(logger.info)
            sinon.assert.called(github.callGraphql)
        }
    })

    // no arrow function here, see https://github.com/mochajs/mocha/issues/2018
    it('should retry api call if gitHub returns "Not Found"', async function () {
        githubCallGraphqlRes.getPRCommitters.err = 'Not Found'
        repo.timesToRetryGitHubCall = 2

        var arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }
        this.timeout(4000)

        try {
            await repo.getPRCommitters(arg)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(Repo.findOne.called)
            sinon.assert.calledThrice(github.callGraphql)
        }
    })


    it('should get list of committers for a pull request using linked org', async () => {
        testRepo = null
        testOrg = {
            token: 'abc'
        }
        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1',
            orgId: 1
        }

        const data = await repo.getPRCommitters(arg)
        assert.equal(data.length, 2)
        assert.equal(data[0].name, 'octocat')
        assert.equal(orgService.get.calledWith({
            orgId: 1
        }), true)
        assert(Repo.findOne.called)
        sinon.assert.called(github.callGraphql)
    })

    it('should handle request for not linked repos and orgs', async () => {
        testRepo = null

        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            await repo.getPRCommitters(arg)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(Repo.findOne.called)
            sinon.assert.notCalled(github.callGraphql)
        }
    })

    it('should update db entry if repo was transferred', async function () {
        this.timeout(3000)

        github.callGraphql.restore()
        sinon.stub(github, 'callGraphql')
        github.callGraphql.onFirstCall().rejects({
            message: 'Moved Permanently'
        })
        github.callGraphql.onSecondCall().resolves(JSON.stringify(githubCallGraphqlRes.getPRCommitters.body))

        sinon.stub(repo, 'getGHRepo').callsFake(async () => {
            return {
                name: 'test_repo',
                owner: {
                    login: 'test_owner'
                },
                id: 1
            }
        })
        const arg = {
            repo: 'myRepo',
            owner: 'owner',
            repoId: 1,
            number: '1'
        }

        try {
            await repo.getPRCommitters(arg)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(Repo.findOne.called)
            assert(repo.getGHRepo.called)
            sinon.assert.calledWithMatch(github.callGraphql, queries.getPRCommitters('test_owner', 'test_repo', '1', ''))
            assert(github.callGraphql.calledTwice)
            repo.getGHRepo.restore()
        }
    })
})

describe('repo:getUserRepos', () => {
    let githubCallRes, repoFindRes, assertFunction

    beforeEach(() => {
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
        }

        repoFindRes = {
            err: null,
            data: [{
                owner: 'login',
                repo: 'repo1',
                repoId: 123,
                save: () => { }
            }]
        }
        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.obj == 'repos' && args.fun == 'list') {
                if (githubCallRes.err) {
                    throw new Error(githubCallRes.err)
                }
                return githubCallRes
            }
        })

        sinon.stub(Repo, 'find').callsFake(async (args) => {
            if (assertFunction) {
                assertFunction(args)
            }
            if (repoFindRes.err) {
                throw new Error(repoFindRes.err)
            }
            return repoFindRes.data
        })
    })

    afterEach(() => {
        assertFunction = undefined
        github.call.restore()
        Repo.find.restore()
    })

    it('should return all linked repositories of the logged user', async () => {
        assertFunction = (args) => assert.equal(args.$or.length, 2)

        const res = await repo.getUserRepos({ token: 'test_token' })
        assert(res[0].repo, 'repo1')
        assert(Repo.find.called)
    })

    it('should handle github error', async () => {
        githubCallRes.err = 'Bad credentials'

        try {
            await repo.getUserRepos({})
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert.equal(error.message, 'Bad credentials')
            assert(!Repo.find.called)
        }
    })

    it('should handle mogodb error', async () => {
        repoFindRes.err = 'DB error'
        repoFindRes.data = undefined

        try {
            await repo.getUserRepos({})
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(Repo.find.called)
        }
    })

    it('should handle affiliation attribute', async () => {
        github.call.restore()
        sinon.stub(github, 'call').callsFake(async (args) => {
            assert(args.arg.affiliation === 'x,y')
            assert(args.token)
            return githubCallRes
        })

        await repo.getUserRepos({ token: 'test_token', affiliation: 'x,y' })
        assert(github.call.called)
    })

    it('should handle affiliation if not provided', async () => {
        github.call.restore()
        sinon.stub(github, 'call').callsFake(async (args) => {
            assert(args.arg.affiliation === 'owner,organization_member')
            assert(args.token)
            return githubCallRes
        })

        repo.getUserRepos({ token: 'test_token' })
        assert(github.call.called)
    })

    it('should provide only repos with push rights', async () => {
        githubCallRes.data = testData.repos
        repoFindRes.data = [{
            owner: 'login',
            repo: 'test_repo'
        }]
        assertFunction = (args) => assert.equal(args.$or.length, 1)

        const res = await repo.getUserRepos({ token: 'test_token' })
        assert(res.length === 1)
        assert(Repo.find.called)
    })

    it('should update repo name and owner on db if github repo was transferred', async () => {
        githubCallRes.data = [{
            name: 'newRepoName',
            owner: {
                login: 'newOwner'
            },
            id: '123',
            permissions: {
                push: true
            }
        }]
        repoFindRes.data = [{
            repo: 'myRepo',
            owner: 'owner',
            repoId: 123,
            save: () => { }
        }]

        sinon.spy(repoFindRes.data[0], 'save')
        const obj = await repo.getUserRepos({ token: 'test_token' })
        assert.equal(obj[0].repoId, 123)
        assert.equal(obj[0].repo, githubCallRes.data[0].name)
        assert.equal(obj[0].owner, githubCallRes.data[0].owner.login)
        assert(repoFindRes.data[0].save.called)
    })
})

describe('repo:getGHRepo', () => {
    let githubCallRes

    beforeEach(() => {
        githubCallRes = {
            err: null,
            data: testData.repo
        }

        sinon.stub(github, 'call').callsFake(async () => {
            if (githubCallRes.err) {
                throw new Error(githubCallRes.err)
            }
            return githubCallRes
        })

    })
    afterEach(() => github.call.restore())

    it('should return gitHub repo data', async () => {
        let args = {
            owner: 'octocat',
            repo: 'Hello-World',
            token: '123'
        }
        const res = await repo.getGHRepo(args)
        assert.equal(res.name, 'Hello-World')
        assert.equal(res.id, 1296269)
    })
})

describe('repo:update', () => {
    let response

    beforeEach(() => {
        response = {
            findOne: {}
        }
        sinon.stub(Repo, 'findOne').callsFake(async () => {
            if (response.findOne.error) {
                throw new Error(response.findOne.error)
            }

            return response.findOne.repo
        })
    })

    afterEach(() => {
        Repo.findOne.restore()
    })

    it('should return error when query db throw error', async () => {
        response.findOne.error = new Error('Find one in database error')
        try {
            await repo.update({ repo: 'repo', owner: 'owner' })
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert.equal(error.message, response.findOne.error)
        }
    })

    it('should update existing linked repo', async () => {
        const linkedRepo = {
            repoId: 'repoId',
            repo: 'repo',
            owner: 'owner',
            token: 'link token'
        }
        response.findOne = {
            repo: Object.assign({}, linkedRepo, {
                save: sinon.spy(async function () { return this })
            })
        }
        const args = Object.assign({}, linkedRepo, {
            gist: 'updated gist',
            minFileChanges: 1,
            minCodeChanges: 20,
            whiteListPattern: 'whitelist-user',
            privacyPolicy: 'http://privacy-policy',
        })
        const updatedRepo = await repo.update(args)
        assert.equal(updatedRepo.gist, args.gist)
        assert.equal(updatedRepo.minFileChanges, args.minFileChanges)
        assert.equal(updatedRepo.minCodeChanges, args.minCodeChanges)
        assert.equal(updatedRepo.whiteListPattern, args.whiteListPattern)
        assert.equal(updatedRepo.privacyPolicy, args.privacyPolicy)
        assert(response.findOne.repo.save.calledOnce)
    })
})
