/*eslint no-empty-function: "off"*/
/*global describe, it, beforeEach, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')

// config
global.config = require('../../../server/src/config')

// models
const Repo = require('../../../server/src/documents/repo').Repo
const User = require('../../../server/src/documents/user').User

//services
const github = require('../../../server/src/services/github')
const cla = require('../../../server/src/services/cla')
const repo_service = require('../../../server/src/services/repo')
const org_service = require('../../../server/src/services/org')
const statusService = require('../../../server/src/services/status')
const prService = require('../../../server/src/services/pullRequest')
const log = require('../../../server/src/services/logger')

// Test data
const testData = require('../testData').data

// api
const cla_api = require('../../../server/src/api/cla')

describe('', () => {
    let reqArgs
    let resp
    let expError

    beforeEach(() => {
        reqArgs = {
            cla: {
                getGist: {
                    gist: testData.repo_from_db.gist
                }
            },
            repoService: {
                get: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            },
            orgService: {
                get: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    gist: 'https://gist.github.com/aa5a315d61ae9438b18d',
                    token: 'testToken',
                    org: 'octocat'
                }
            }
        }
        resp = {
            cla: {
                getGist: JSON.parse(JSON.stringify(testData.gist)) //clone object
            },
            github: {
                callPullRequest: [{
                    number: 1,
                    head: {
                        sha: 'sha1'
                    }
                }, {
                    number: 2,
                    head: {
                        sha: 'sha2'
                    }
                }],
                callMarkdown: {
                    statusCode: 200,
                    data: {}
                },
                callUser: {
                    one: {
                        id: 1,
                        login: 'one'
                    },
                    two: {
                        id: 2,
                        login: 'two'
                    }
                },
                callRepos: testData.orgRepos.concat(
                    {
                        id: 2,
                        name: 'testRepo',
                        owner: {
                            login: 'org'
                        },
                    },
                    {
                        id: 3,
                        name: 'testArchivedRepo',
                        owner: {
                            login: 'org'
                        },
                        archived: true,
                    }
                )
            },
            repoService: {
                get: JSON.parse(JSON.stringify(testData.repo_from_db)), //clone object
                getByOwner: [JSON.parse(JSON.stringify(testData.repo_from_db))]
            },
            orgService: {
                get: JSON.parse(JSON.stringify(testData.org_from_db)), //clone object
            }
        }
        expError = {
            cla: {
                getGist: null,
            },
            github: {
                pullRequest: null,
                markdown: null,
                user: null
            },
            repoService: {
                get: null,
                getByOwner: null
            },
            orgService: {
                get: null
            }
        }


        sinon.stub(cla, 'getGist').callsFake((args) => {
            if (args.gist && args.gist.gist_url) {
                assert.equal(args.gist.gist_url, reqArgs.cla.getGist.gist)
            } else {
                assert.equal(args.gist, reqArgs.cla.getGist.gist)
            }

            return expError.cla.getGist ? Promise.reject(expError.cla.getGist) : Promise.resolve(resp.cla.getGist)
        })

        sinon.stub(cla, 'getLinkedItem').callsFake((args) => {
            resp.cla.getLinkedItem.repo = args.repo
            resp.cla.getLinkedItem.owner = args.owner
            const objectcopy = JSON.parse(JSON.stringify(resp.cla.getLinkedItem))

            return expError.cla.getLinkedItem ? Promise.reject(expError.cla.getLinkedItem) : Promise.resolve(objectcopy)
        })

        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.obj === 'pulls') {
                assert(args.token)
                if (expError.github.pullRequest) {
                    throw expError.github.pullRequest
                }

                return {
                    data: resp.github.callPullRequest
                }
            } else if (args.obj === 'markdown') {
                if (expError.github.markdown) {
                    throw expError.github.markdown
                }

                return {
                    data: resp.github.callMarkdown
                }
            } else if (args.obj === 'users') {
                if (expError.github.user) {
                    throw expError.github.user
                }
                if (args.arg.username === 'one') {
                    return {
                        data: resp.github.callUser.one
                    }
                } else if (args.arg.username === 'two') {
                    return {
                        data: resp.github.callUser.two
                    }
                } else if (args.fun === 'getAuthenticated') {
                    return {
                        data: resp.github.callUser.one
                    }
                } else if (args.arg.username === 'undefined') {
                    throw 'there is no user with username undefined'
                }
            } else if (args.obj === 'repos' && args.fun === 'listForOrg') {
                if (expError.github.repos) {
                    throw expError.github.repos
                }

                return {
                    data: resp.github.callRepos
                }
            }
        })
        sinon.stub(repo_service, 'get').callsFake(async (args) => {
            assert.deepEqual(args, reqArgs.repoService.get)
            if (expError.repoService.get) {
                throw expError.repoService.get
            }

            return resp.repoService.get
        })
        sinon.stub(org_service, 'get').callsFake(async () => {
            sinon.assert.calledWithMatch(org_service.get, reqArgs.orgService.get)
            // assert.deepEqual(args, reqArgs.orgService.get)
            if (expError.orgService.get) {
                throw expError.orgService.get
            }

            return resp.orgService.get
        })

        sinon.stub(log, 'error').callsFake((msg) => assert(msg))
        sinon.stub(log, 'warn').callsFake((msg) => assert(msg))
        sinon.stub(log, 'info').callsFake((msg) => assert(msg))
    })

    afterEach(() => {
        cla.getGist.restore()
        cla.getLinkedItem.restore()
        github.call.restore()
        org_service.get.restore()
        repo_service.get.restore()
        global.config.server.github.timeToWait = 0
        log.error.restore()
        log.warn.restore()
        log.info.restore()
    })

    describe('cla:get', () => {
        it('should get gist and render it with repo token', async () => {
            let req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            }

            await cla_api.get(req)
            assert(repo_service.get.called)
            assert(github.call.calledWithMatch({
                obj: 'markdown',
                fun: 'render',
                token: testData.repo_from_db.token
            }))

        })

        it('should get gist and render it without user and repo token', async () => {
            resp.repoService.get.token = undefined

            let req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            }

            await cla_api.get(req)
            assert(repo_service.get.called)
            assert(github.call.calledWithMatch({
                obj: 'markdown',
                fun: 'render',
                token: undefined
            }))

        })

        it('should get gist and render it with user token if there is no repo token', async () => {
            reqArgs.repoService.get = {
                repoId: 1
            }
            resp.repoService.get.token = undefined

            let req = {
                args: {
                    repoId: 1
                },
                user: {
                    token: 'user_token'
                }
            }

            await cla_api.get(req)
            assert(repo_service.get.called)
            assert(github.call.calledWithMatch({
                obj: 'markdown',
                fun: 'render',
                token: 'user_token'
            }))
        })

        it('should handle wrong gist url', async () => {

            let repoStub = sinon.stub(Repo, 'findOne').callsFake(async () => {
                return {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    gist: '123',
                    token: 'abc'
                }
            })

            resp.cla.getGist = undefined
            expError.cla.getGist = 'error'

            let req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            }

            try {
                await cla_api.get(req)
                assert(false, 'an error should be thrown')
            } catch (error) {
                assert.equal(!!error, true)
                assert(!github.call.called)
            }
            repoStub.restore()
        })

        it('should throw an error if result has no files', async () => {
            resp.cla.getGist.files = undefined

            let req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            }

            try {
                await cla_api.get(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error)
                assert(repo_service.get.called)
            }
        })

        it('should render metadata-file with custom fields if provided', async () => {
            let req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            }
            const gistContent = await cla_api.get(req)
            assert(github.call.calledTwice)
            assert(gistContent.raw)
            assert(gistContent.meta)
            assert(gistContent.updatedAt)
        })

        describe('in case of failing github api', () => {
            let req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                },
                user: {
                    token: 'abc'
                }
            }

            it('should handle github error', async () => {
                resp.github.callMarkdown = {}
                expError.github.markdown = 'any error'

                try {
                    await cla_api.get(req)
                    assert(false, 'an error should be thrown')
                } catch (error) {
                    assert(error)
                }
            })
        })
    })

    describe('cla:sign', function () {
        let req, expArgs, testUser
        beforeEach(() => {
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
            }
            expArgs = {
                claSign: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    user: 'user',
                    origin: 'sign|user',
                    userId: 3
                }
            }
            testUser = {
                save: () => { },
                name: 'testUser',
                requests: [{
                    repo: 'Hello-World',
                    owner: 'octocat',
                    numbers: [1]
                }]
            }
            // reqArgs.cla.getLinkedItem
            resp.cla.getLinkedItem = resp.repoService.get
            reqArgs.cla.getLinkedItem = {
                repo: 'Hello-World',
                owner: 'octocat'
            }
            expError.cla.isClaRequired = null
            resp.cla.isClaRequired = true

            sinon.stub(statusService, 'update').callsFake(async (args) => {
                assert(args.signed)
            })

            sinon.stub(cla, 'sign').callsFake(async () => {
                return 'done'
            })

            sinon.stub(cla, 'check').callsFake(async (args) => {
                args.gist = req.args.gist

                return {
                    signed: true
                }
            })

            sinon.stub(prService, 'editComment').callsFake(async () => {
                //do nothing
            })
            sinon.stub(prService, 'badgeComment').callsFake(async () => {
                //do nothing
            })

            sinon.stub(User, 'findOne').callsFake(async () => {
                return testUser
            })

            sinon.stub(cla, 'isClaRequired').callsFake(() => {
                return expError.cla.isClaRequired ? Promise.reject(expError.cla.isClaRequired) : Promise.resolve(resp.cla.isClaRequired)
            })
        })

        afterEach(() => {
            cla.check.restore()
            cla.sign.restore()
            prService.editComment.restore()
            prService.badgeComment.restore()
            statusService.update.restore()
            User.findOne.restore()
            cla.isClaRequired.restore()
        })

        it('should call cla service on sign', async () => {
            await cla_api.sign(req)

            assert(cla.sign.called)
            sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
        })

        it('should call cla service on sign with custom fields', async () => {
            expArgs.claSign.custom_fields = '{"json":"as", "a":"string"}'
            req.args.custom_fields = '{"json":"as", "a":"string"}'

            await cla_api.sign(req)
            assert(cla.sign.called)
            sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
        })

        it('should update status of pull request created by user, who signed', async () => {
            const signed = await cla_api.sign(req)

            assert.ok(signed)
            this.timeout(100)
            await new Promise(resolve => setTimeout(() => {
                assert(statusService.update.called)
                resolve()
            }, 50))
            sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
        })

        it('should update status of pull request using token of linked org', async () => {
            resp.repoService.get = null
            resp.cla.getLinkedItem = resp.orgService.get

            const res = await cla_api.sign(req)

            assert.ok(res)
            sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
        })

        it('should update status of all open pull requests for the repo if user model has no requests stored', async () => {
            testUser.requests = undefined
            this.timeout(200)
            const res = await cla_api.sign(req)

            await delayAssertion(() => {
                assert.ok(res)
                sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
                assert(github.call.calledWithMatch({
                    obj: 'pulls',
                    fun: 'list'
                }))
                assert(prService.badgeComment.called)
                assert.equal(statusService.update.callCount, 2)
            }, 350)
        })

        it('should update status of all open pull requests for the repo if user model has requests for other repos', async () => {
            testUser.requests = [{
                repo: 'otherRepo',
                owner: 'testOrg',
                numbers: [1]
            }]
            // resp.cla.getLinkedItem.repo = 'otherRepo'
            this.timeout(200)
            const res = await cla_api.sign(req)

            await delayAssertion(() => {
                assert.ok(res)
                sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
                assert(github.call.calledWithMatch({
                    obj: 'pulls',
                    fun: 'list'
                }))
                assert(prService.badgeComment.called)
                assert.equal(statusService.update.callCount, 2)
            }, 350)
        })

        it('should update status of all open pull requests for the repos and orgs that shared the same gist if user model has no requests stored', async () => {
            testUser.requests = undefined
            resp.cla.getLinkedItem = Object({
                sharedGist: true
            }, resp.cla.getLinkedItem)
            sinon.stub(cla_api, 'validateSharedGistItems').callsFake(() => { })

            await cla_api.sign(req)
            await delayAssertion(() => {
                assert(cla_api.validateSharedGistItems.called)
                cla_api.validateSharedGistItems.restore()
            }, 50)
        })

        it('should update status of all open pull requests for the org that when linked an org if user model has no requests stored', async () => {
            testUser.requests = undefined
            resp.cla.getLinkedItem = testData.org_from_db
            sinon.stub(cla_api, 'validateOrgPullRequests').callsFake(() => { })

            try {
                await cla_api.sign(req)
                await delayAssertion(() => {
                    assert(cla_api.validateOrgPullRequests.called)
                    cla_api.validateOrgPullRequests.restore()
                }, 50)
            } catch (e) {
                assert.ifError(e)
            }
        })

        it('should comment with userMap if it is given', async () => {
            cla.check.restore()
            prService.badgeComment.restore()

            sinon.stub(cla, 'check').callsFake(async (args) => {
                args.gist = req.args.gist

                return {
                    signed: true,
                    userMap: {
                        signed: ['any_user'],
                        not_signed: []
                    }
                }
            })
            sinon.stub(prService, 'badgeComment').callsFake((args) => {
                assert(args.userMap.signed)
            })

            const res = await cla_api.sign(req)

            assert.ok(res)
            sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)

            assert(!github.call.calledWithMatch({
                obj: 'pulls',
                fun: 'list'
            }))
            this.timeout(100)
            await new Promise((resolve) => {
                setTimeout(() => {
                    assert(statusService.update.called)
                    assert(prService.badgeComment.called)
                    resolve()
                }, 50)
            })
        })

        it('should update users stored pull requests', async () => {
            testUser.requests[0].numbers = [1, 2]
            const res = await cla_api.sign(req)
            await delayAssertion(() => {
                assert.ok(res)
                sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
                sinon.assert.called(User.findOne)
                sinon.assert.calledTwice(cla.check)
            }, 50)
        })

        it('should call update status of all PRs of the user in repos and orgs with the same shared gist', async () => {
            resp.orgService.get.org = 'testOrg'
            testUser.requests.push({
                repo: 'testRepo',
                owner: 'testOrg',
                numbers: [1]
            })
            resp.cla.getLinkedItem.sharedGist = true
            sinon.stub(repo_service, 'getRepoWithSharedGist').callsFake(async () => {
                return [resp.repoService.get]
            })
            sinon.stub(org_service, 'getOrgWithSharedGist').callsFake(async () => {
                return [resp.orgService.get]
            })
            sinon.stub(cla_api, 'validateSharedGistItems').callsFake(async () => {
                /*do nothing*/
            })
            await cla_api.sign(req)
            await delayAssertion(() => {
                sinon.assert.notCalled(cla_api.validateSharedGistItems)
                sinon.assert.calledTwice(cla.check)

                cla_api.validateSharedGistItems.restore()
                repo_service.getRepoWithSharedGist.restore()
                org_service.getOrgWithSharedGist.restore()
            }, 50)
        })

        it('should delete stored pull requests from unlinked org or repo', async () => {
            testUser.requests.push({
                repo: 'Not linked anymore',
                owner: 'Test',
                numbers: [1]
            })
            cla.getLinkedItem.restore()
            sinon.stub(cla, 'getLinkedItem').callsFake((args) => {
                let linkedItem = null
                if (args.owner === 'octocat' && args.repo === 'Hello-World') {
                    linkedItem = resp.cla.getLinkedItem
                }

                return Promise.resolve(linkedItem)
            })

            try {
                await cla_api.sign(req)
                await delayAssertion(() => {
                    assert(!testUser.requests.length)
                    sinon.assert.calledOnce(cla.check)
                }, 50)
            } catch (e) {
                assert.ifError(e)
            }
        })
    })

    describe('cla api', () => {
        let req, getGistReq
        beforeEach(() => {
            req = {
                user: {
                    id: 3,
                    login: 'user'
                },
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            }
            getGistReq = {
                args: {
                    repoId: 1
                }
            }
        })

        it('should call cla service on getLastSignature', async () => {
            sinon.stub(cla, 'getLastSignature').callsFake(async () => {
                return {}
            })

            req.args = {
                repo: 'Hello-World',
                owner: 'octocat'
            }
            req.user = {
                login: 'testUser'
            }

            await cla_api.getLastSignature(req)
            assert(cla.getLastSignature.calledWithMatch({
                repo: 'Hello-World',
                owner: 'octocat',
                user: 'testUser'
            }))

            cla.getLastSignature.restore()
        })

        it('should call cla service on getSignedCLA', async () => {
            sinon.stub(cla, 'getSignedCLA').callsFake(async args => {
                assert.deepEqual(args, {
                    id: 1,
                    login: 'one'
                })

                return {}
            })

            req.args = {
                user: 'user'
            }

            await cla_api.getSignedCLA(req)
            assert(cla.getSignedCLA.called)

            cla.getSignedCLA.restore()
        })

        it('should call cla service on check', async () => {
            sinon.stub(cla, 'check').callsFake(async args => {
                assert.deepEqual(args, {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    user: 'user',
                    userId: 3,
                    number: undefined
                })

                return {
                    signed: true
                }
            })

            await cla_api.check(req)
            assert(cla.check.called)

            cla.check.restore()
        })

        it('should call cla service on getAll', async () => {
            req.args.gist = testData.repo_from_db.gist
            sinon.stub(cla, 'getAll').callsFake(async (args) => {
                assert.deepEqual(args, {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    gist: testData.repo_from_db.gist
                })
                return []
            })

            await cla_api.getAll(req)

            assert(cla.getAll.called)
            cla.getAll.restore()
        })

        it('should call cla service on getGist with repoId', async () => {
            reqArgs.repoService.get = {
                repoId: 1
            }
            await cla_api.getGist(getGistReq)
            assert(cla.getGist.called)
        })

        it('should call cla service on getGist with orgId', async () => {
            getGistReq = {
                args: {
                    orgId: 1
                }
            }
            reqArgs.orgService.get = {
                orgId: 1
            }

            await cla_api.getGist(getGistReq)
            assert(org_service.get.called)
            assert(cla.getGist.called)
        })

        it('should call cla service using user token, not repo token', async () => {
            req.args.gist = testData.repo_from_db.gist
            req.user.token = 'user_token'

            await cla_api.getGist(req)
            assert(cla.getGist.calledWith({
                token: 'user_token',
                gist: testData.repo_from_db.gist
            }))
        })

        it('should call cla service getGist with user token even if repo is not linked anymore', async () => {
            req.args.gist = {
                gist_url: testData.repo_from_db.gist
            }
            req.user.token = 'user_token'

            resp.repoService.get = null
            expError.repoService.get = new Error('There is no repo.')

            await cla_api.getGist(req)
            assert(cla.getGist.called)
        })

        it('should fail calling cla service getGist with user token if repo is not linked anymore and no gist is provided', async () => {
            req.user.token = 'user_token'

            resp.repoService.get = null
            expError.repoService.get = new Error('There is no repo.')

            try {
                await cla_api.getGist(req)
                assert(false, 'an errror should be thrown')
            } catch (error) {
                assert.equal(error.message, 'There is no repo.')
                assert(!cla.getGist.called)
            }
        })
    })

    describe('cla:countCLA', () => {
        let req = {}
        beforeEach(() => {
            resp.cla.getLinkedItem = testData.repo_from_db
            req.args = {
                repo: 'Hello-World',
                owner: 'octocat'
            }
            resp.cla.getAll = [{}]
            sinon.stub(cla, 'getAll').callsFake(async (args) => {
                assert(args.gist.gist_url)
                assert(args.gist.gist_version)
                assert(args.repoId || args.orgId)

                if (expError.cla.getAll) {
                    throw expError.cla.getAll
                }
                return resp.cla.getAll
            })
        })
        afterEach(() => cla.getAll.restore())

        it('should call getAll on countCLA', async () => {
            reqArgs.repoService.get.gist = {
                gist_url: testData.repo_from_db.gist,
                gist_version: testData.gist.history[0].version
            }
            req.args.gist = {
                gist_url: testData.repo_from_db.gist,
                gist_version: testData.gist.history[0].version
            }

            const number = await cla_api.countCLA(req)
            assert(cla.getAll.called)
            assert.equal(number, 1)
        })

        it('should call getAll on countCLA for repo of linked org', async () => {
            resp.cla.getLinkedItem = testData.org_from_db
            reqArgs.repoService.get.gist = {
                gist_url: testData.org_from_db.gist,
                gist_version: testData.gist.history[0].version
            }
            req.args.gist = {
                gist_url: testData.org_from_db.gist,
                gist_version: testData.gist.history[0].version
            }

            const number = await cla_api.countCLA(req)
            assert(cla.getAll.called)
            assert.equal(number, 1)
        })

        it('should get gist version if not provided', async () => {
            reqArgs.repoService.get.gist = {
                gist_url: testData.repo_from_db.gist
            }
            req.args.gist = {
                gist_url: testData.repo_from_db.gist
            }
            resp.cla.getAll = [{userId: 1}, {userId: 2}]

            const number = await cla_api.countCLA(req)
            assert(cla.getAll.called)
            assert.equal(number, resp.cla.getAll.length)
        })

        it('should get gist url and version if not provided', async () => {
            resp.cla.getAll = [{userId: 1}, {userId: 2}]

            const number = await cla_api.countCLA(req)
            assert(cla.getAll.called)
            assert.equal(number, resp.cla.getAll.length)
        })

        it('it should handle nonexistent gist', async () => {
            resp.cla.getGist = null

            try {
                await cla_api.countCLA(req)
                assert(false, 'an errror should be thrown')
            } catch (error) {
                assert(error)
                assert(!cla.getAll.called)
            }
        })
    })

    describe('cla:upload', () => {
        let req
        let expArgs

        beforeEach(() => {
            reqArgs.cla.sign = {}
            req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    signatures: [{
                        user: 'one'
                    }]
                },
                user: {
                    login: 'projectOwner',
                    token: 'user_token'
                }
            }
            expArgs = {
                repo: 'Hello-World',
                owner: 'octocat',
                origin: 'upload|projectOwner',
            }
            sinon.stub(cla, 'sign').callsFake(() => {
                return expError.cla.sign ? Promise.reject(expError.cla.sign) : Promise.resolve(reqArgs.cla.sign)
            })
        })

        afterEach(() => cla.sign.restore())

        // it('should silently exit when no users provided', async () => {
        //     req.args.users = undefined
        //     const res = await cla_api.upload(req)
        //     assert.equal(res, undefined)
        // })

        it('should throw an error and exit when no users provided', async () => {
            req.args.users = undefined

            try {
                await cla_api.upload(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error)
            }
        })

        it('should "sign" cla only for existing users', async () => {
            req.args.signatures = [{
                user: 'one'
            }, {
                user: 'undefined'
            }]

            const res = await cla_api.upload(req)
            assert(github.call.called)
            assert(cla.sign.calledWithMatch({
                repo: 'Hello-World',
                owner: 'octocat',
                user: 'one',
                userId: 1
            }))
            assert(cla.sign.calledOnce)
            assert.equal(res.length, 2)
        })

        it('should not "sign" cla when github user not found', async () => {
            expError.github.callUser = 'not found'
            resp.github.callUser.one = undefined

            await cla_api.upload(req)
            assert(github.call.calledWith({
                obj: 'users',
                fun: 'getByUsername',
                arg: {
                    username: 'one'
                },
                token: 'user_token'
            }))
            assert(!cla.sign.called)
        })

        it('should "sign" cla for two users', async () => {
            req.args.signatures = [{
                user: 'one'
            }, {
                user: 'two'
            }]

            await cla_api.upload(req)
            assert(github.call.called)
            assert(cla.sign.calledWithMatch({
                repo: 'Hello-World',
                owner: 'octocat',
                user: 'one',
                userId: 1
            }))
            assert(cla.sign.calledWithMatch({
                repo: 'Hello-World',
                owner: 'octocat',
                user: 'two',
                userId: 2
            }))
            assert(cla.sign.calledTwice)
        })

        it('should "sign" cla for linked org', async () => {
            req.args.signatures = [{
                user: 'one'
            }, {
                user: 'two'
            }]
            req.args.repo = undefined

            await cla_api.upload(req)
            assert(github.call.called)
            assert(cla.sign.calledWithMatch({
                repo: undefined,
                owner: 'octocat',
                user: 'one',
                userId: 1
            }))
            assert(cla.sign.calledTwice)
        })

        it('should "sign" cla with origin attribute', async () => {
            req.args.signatures = [{
                user: 'one'
            }, {
                user: 'two'
            }]

            await cla_api.upload(req)
            assert(github.call.called)
            assert(cla.sign.calledTwice)
            sinon.assert.calledWithMatch(cla.sign, expArgs)
        })

        it('should "sign" cla with provided attributes', async () => {
            req.args.signatures = [{
                user: 'one',
                created_at: '2011-01-26T19:01:12Z'
            }, {
                user: 'two',
                custom_fields: {
                    name: 'Username'
                }
            }]
            await cla_api.upload(req)
            assert(github.call.called)
            assert(cla.sign.calledTwice)
            sinon.assert.calledWithMatch(cla.sign, expArgs)
            sinon.assert.calledWithMatch(cla.sign.firstCall, {
                created_at: '2011-01-26T19:01:12Z'
            })
            sinon.assert.calledWithMatch(cla.sign.secondCall, {
                custom_fields: {
                    name: 'Username'
                }
            })
        })
    })

    describe('cla:validateAllPullRequests', () => {
        let req
        beforeEach(() => {
            reqArgs.orgService.get = {
                repo: 'Hello-World',
                owner: 'octocat',
                token: 'testToken',
                org: 'octocat'
            }
            req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    token: 'testToken',
                    gist: testData.repo_from_db.gist
                }
            }
            resp.cla.getLinkedItem = Object.assign({}, testData.repo_from_db)
            expError.cla.isClaRequired = null
            resp.cla.isClaRequired = true
            global.config.server.github.timeToWait = 10

            sinon.stub(statusService, 'update').callsFake(async (args) => {
                assert(args.signed)
                assert(args.token)
                assert(args.sha)
            })

            sinon.stub(statusService, 'updateForNullCla').callsFake(() => {
                //do nothing here
            })
            sinon.stub(statusService, 'updateForClaNotRequired').callsFake(() => {
                //do nothing here
            })
            sinon.stub(cla, 'check').callsFake(async (args) => {
                args.gist = req.args.gist
                return {
                    signed: true
                }
            })
            sinon.stub(prService, 'editComment').callsFake(() => {
                //do nothing here
            })
            sinon.stub(prService, 'badgeComment').callsFake(() => {
                //do nothing here
            })
            sinon.stub(prService, 'deleteComment').callsFake(() => {
                //do nothing here
            })
            sinon.stub(repo_service, 'getByOwner').callsFake(() => {
                return expError.repoService.getByOwner ? Promise.reject(expError.repoService.getByOwner) : Promise.resolve(resp.repoService.getByOwner)
            })
            sinon.stub(cla, 'isClaRequired').callsFake(() => {
                return expError.cla.isClaRequired ? Promise.reject(expError.cla.isClaRequired) : Promise.resolve(resp.cla.isClaRequired)
            })
        })

        afterEach(() => {
            cla.check.restore()
            statusService.update.restore()
            statusService.updateForNullCla.restore()
            statusService.updateForClaNotRequired.restore()
            prService.editComment.restore()
            prService.badgeComment.restore()
            prService.deleteComment.restore()
            repo_service.getByOwner.restore()
            cla.isClaRequired.restore()
        })

        it('should update all open pull requests', async () => {
            await cla_api.validateAllPullRequests(req)
            assert(github.call.calledWithMatch({
                obj: 'pulls',
                fun: 'list'
            }))
            await new Promise(resolve => setTimeout(() => {
                assert.equal(statusService.update.callCount, 2)
                assert(prService.badgeComment.called)
                resolve()
            }, 150))
        })

        it('should update all PRs with users token', async () => {
            req.args.token = undefined
            req.user = {
                token: 'user_token'
            }
            await cla_api.validateAllPullRequests(req)
            await new Promise(resolve => setTimeout(() => {
                assert.equal(statusService.update.callCount, 2)
                assert(github.call.calledWithMatch({
                    obj: 'pulls',
                    fun: 'list'
                }))
                assert(prService.badgeComment.called)
                resolve()
            }, 50))
        })

        it('should update status of all repos of the org', async () => {
            req.args.org = 'octocat'

            resp.repoService.get = null
            resp.cla.getLinkedItem = resp.orgService.get
            resp.repoService.getByOwner = []

            const res = await cla_api.validateOrgPullRequests(req)
            assert.ok(res)
            // sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)
            await new Promise(resolve => setTimeout(() => {
                assert.equal(statusService.update.callCount, 4)
                resolve()
            }, 100))
        })

        it('should update status with differentiation between people on allowlist and other committers', async () => {
            cla.check.restore()
            sinon.stub(cla, 'check').callsFake(async (args) => {
                const res = {
                    signed: true
                }
                if (args.repo == 'testRepo' && args.number == 1) {
                    res.userMap = {
                        signed: [],
                        not_signed: [],
                        unknown: []
                    }
                }
                return res
            })
            req.args.org = 'octocat'

            resp.repoService.get = null
            resp.cla.getLinkedItem = resp.orgService.get
            global.config.server.github.timeToWait = 10
            resp.repoService.getByOwner = []

            const res = await cla_api.validateOrgPullRequests(req)
            assert.ok(res)
            // sinon.assert.calledWithMatch(cla.sign, expArgs.claSign)

            await new Promise(resolve => setTimeout(() => {
                assert.equal(statusService.update.callCount, 3)
                assert.equal(statusService.updateForClaNotRequired.callCount, 1)
                resolve()
            }, 50))
        })
        // it('should update status of all repos of the org slowing down', async () => {
        //     this.timeout(600)
        //     req.args.org = 'octocat'
        //     resp.repoService.get = null
        //     resp.cla.getLinkedItem = resp.orgService.get
        //     resp.repoService.getByOwner = []
        //     for (let index = 0 index < 28 index++) {
        //         resp.github.callRepos.push({
        //             id: 'test_' + index,
        //             owner: {
        //                 login: 'org'
        //             }
        //         })
        //     }
        //     global.config.server.github.timeToWait = 10

        //     cla_api.validateOrgPullRequests(req, function (err, res) {
        //         assert.ifError(err)
        //         assert.ok(res)

        //         setTimeout(function () {
        //             assert.equal(statusService.update.callCount, 10 * resp.github.callPullRequest.length)
        //         }, 100)
        //         // 10 * timeToWait delay each 10th block
        //         setTimeout(function () {
        //             assert.equal(statusService.update.callCount, 20 * resp.github.callPullRequest.length)
        //         }, 300)
        //         setTimeout(function () {
        //             assert.equal(statusService.update.callCount, 30 * resp.github.callPullRequest.length)
        //             global.config.server.github.timeToWait = 0
        //             it_done()
        //         }, 550)
        //     })
        // })

        it('should delete comments when rechecking PRs of a repo with a null CLA', async () => {
            resp.cla.getLinkedItem.gist = undefined
            await cla_api.validateAllPullRequests(req)
            await new Promise(resolve => setTimeout(() => {
                assert(prService.deleteComment.called)
                assert(statusService.updateForNullCla.called)
                resolve()
            }, 50))
        })
    })

    describe('cla: validateOrgPullRequests', () => {
        let req
        beforeEach(() => {
            req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat',
                    gist: 'https://gist.github.com/aa5a315d61ae9438b18d',
                    token: 'testToken',
                    org: 'octocat'
                }
            }
            global.config.server.github.timeToWait = 0
            resp.github.callRepos = testData.orgRepos
            sinon.stub(repo_service, 'getByOwner').callsFake(() => {
                return expError.repoService.getByOwner ? Promise.reject(expError.repoService.getByOwner) : Promise.resolve(resp.repoService.getByOwner)
            })
            sinon.stub(cla_api, 'validateAllPullRequests').callsFake(() => {
                //do nothing here
            })
        })

        afterEach(() => {
            repo_service.getByOwner.restore()
            cla_api.validateAllPullRequests.restore()
        })

        it('should NOT validate repos in the excluded list', async () => {
            resp.orgService.get.isRepoExcluded = () => true
            resp.repoService.getByOwner = []
            await cla_api.validateOrgPullRequests(req)
            await new Promise(resolve => setTimeout(() => {
                assert(!cla_api.validateAllPullRequests.called)
                resolve()
            }))
        })

        it('should NOT validate repos with overwritten cla', async () => {
            resp.orgService.get.isRepoExcluded = () => false
            await cla_api.validateOrgPullRequests(req)
            await new Promise(resolve => setTimeout(() => {
                assert(!cla_api.validateAllPullRequests.called)
                resolve()
            }))
        })

        it('should validate repos with overwritten cla if linked repo doesn\'t have valid repoId', async () => {
            resp.orgService.get.isRepoExcluded = () => false
            resp.repoService.getByOwner[0].repoId = undefined

            await cla_api.validateOrgPullRequests(req)
            await new Promise(resolve => setTimeout(() => {
                assert(cla_api.validateAllPullRequests.called)
                resolve()
            }))
        })

        it('should validate repos that is not in the excluded list and don\'t have overwritten cla', async () => {
            resp.orgService.get.isRepoExcluded = () => false
            resp.repoService.getByOwner = []

            await cla_api.validateOrgPullRequests(req)
            await new Promise(resolve => setTimeout(() => {
                assert(cla_api.validateAllPullRequests.called)
                resolve()
            }))
        })

        it('should NOT validate when querying repo collection throw error', async () => {
            expError.repoService.getByOwner = 'any error of querying repo collection'
            try {
                await cla_api.validateOrgPullRequests(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(!!error)
                assert(!cla_api.validateAllPullRequests.called)
            }
        })

        it('should get linked org and provide it to the validateAllPR method', async () => {
            resp.cla.getLinkedItem = resp.orgService.get
            resp.orgService.get.isRepoExcluded = () => false
            resp.repoService.getByOwner = []

            await cla_api.validateOrgPullRequests(req)
            await new Promise(resolve => setTimeout(() => {
                assert(cla_api.validateAllPullRequests.called)
                resolve()
            }))
            assert(cla.getLinkedItem.called)
        })
    })

    describe('cla:getLinkedItem', () => {
        it('should get linked repo or org using repo_name and owner', async () => {
            resp.cla.getLinkedItem = resp.repoService.get
            let args = {
                repo: 'Hello-World',
                owner: 'octocat'
            }
            reqArgs.cla.getLinkedItem = args

            await cla_api.getLinkedItem({
                args: args
            })
            assert(cla.getLinkedItem.called)
        })
    })

    describe('cla: validateSharedGistItems', () => {
        let req

        beforeEach(() => {
            req = {
                args: {
                    repo: 'Hello-World',
                    owner: 'octocat1',
                    gist: testData.repo_from_db.gist,
                    sharedGist: true
                }
            }
            let repoWithSharedGist = {
                repoId: 1296269,
                owner: 'octocat1',
                repo: 'Hello-World',
                gist: 'gist1',
                token: 'token1',
                sharedGist: true
            }
            let orgWithSharedGist = {
                orgId: 1,
                org: 'octocat2',
                token: 'token',
                gist: 'gist1',
                sharedGist: true
            }
            expError.repoService.getRepoWithSharedGist = null
            expError.orgService.getOrgWithSharedGist = null
            resp.repoService.getRepoWithSharedGist = [repoWithSharedGist]
            resp.orgService.getOrgWithSharedGist = [orgWithSharedGist]
            sinon.stub(repo_service, 'getRepoWithSharedGist').callsFake(() => {
                return expError.repoService.getRepoWithSharedGist ? Promise.reject(expError.repoService.getRepoWithSharedGist) : Promise.resolve(resp.repoService.getRepoWithSharedGist)
            })
            sinon.stub(org_service, 'getOrgWithSharedGist').callsFake(() => {
                return expError.orgService.getOrgWithSharedGist ? Promise.reject(expError.orgService.getOrgWithSharedGist) : Promise.resolve(resp.orgService.getOrgWithSharedGist)
            })
            sinon.stub(cla_api, 'validateOrgPullRequests').callsFake(async () => {
                //do nothing here
            })
            sinon.stub(cla_api, 'validateAllPullRequests').callsFake(async () => {
                //do nothing here
            })
        })

        afterEach(() => {
            cla_api.validateOrgPullRequests.restore()
            cla_api.validateAllPullRequests.restore()
            repo_service.getRepoWithSharedGist.restore()
            org_service.getOrgWithSharedGist.restore()
        })

        it('should call validateOrgPullRequests and validateAllPullRequests to update status of all repos and orgs with the same shared gist', async () => {
            await cla_api.validateSharedGistItems(req)
            assert.equal(cla_api.validateOrgPullRequests.callCount, 1)
            assert.equal(cla_api.validateAllPullRequests.callCount, 1)
        })

        it('should return error when gist is not provided', async () => {
            req.args.gist = undefined
            try {
                await cla_api.validateSharedGistItems(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error)
            }
        })

        it('should log error when repoService.getRepoWithSharedGist() failed', async () => {
            expError.repoService.getRepoWithSharedGist = 'Error: get shared gist repo failed'
            // try {
            await cla_api.validateSharedGistItems(req)
            //     assert(false, 'should throw an error')
            // } catch (error) {
            // assert(error)
            assert(log.error.calledWithMatch(expError.repoService.getRepoWithSharedGist))
            // }
        })

        it('should log error when orgService.getOrgWithSharedGist() failed', async () => {
            expError.orgService.getOrgWithSharedGist = 'Error: get shared gist org failed'
            // try {
            await cla_api.validateSharedGistItems(req)
            //     assert(false, 'should throw an error')
            // } catch (error) {
            // assert(error)
            assert(log.error.calledWithMatch(expError.orgService.getOrgWithSharedGist))
            // }
        })
    })

    describe('cla:validatePullRequest', () => {
        let args
        beforeEach(() => {
            args = {
                repo: 'Hello-World',
                owner: 'octocat',
                sha: 'abcde',
                number: 1,
                token: 'token'
            }
            resp.cla.check = {
                gist: 'github/gist',
                signed: false,
                userMap: {
                    signed: ['a'],
                    not_signed: ['b'],
                    unknown: ['c']
                }
            }
            resp.cla.getLinkedItem = Object.assign({}, testData.repo_from_db)
            expError.cla.isClaRequired = null
            resp.cla.isClaRequired = true
            sinon.stub(cla, 'check').callsFake(async () => {
                return {
                    signed: resp.cla.check.signed,
                    userMap: resp.cla.check.userMap
                }
            })
            sinon.stub(cla, 'isClaRequired').callsFake(() => {
                return expError.cla.isClaRequired ? Promise.reject(expError.cla.isClaRequired) : Promise.resolve(resp.cla.isClaRequired)
            })
            sinon.stub(statusService, 'update').callsFake(async () => {
                return null
            })
            sinon.stub(statusService, 'updateForNullCla').callsFake(async () => {
                return null
            })
            sinon.stub(statusService, 'updateForClaNotRequired').callsFake(async () => {
                return null
            })
            sinon.stub(prService, 'editComment').callsFake(async () => {
                return null
            })
            sinon.stub(prService, 'badgeComment').callsFake(async () => {
                return null
            })
            sinon.stub(prService, 'deleteComment').callsFake(async () => {
                return null
            })
        })

        afterEach(() => {
            cla.check.restore()
            cla.isClaRequired.restore()
            statusService.update.restore()
            statusService.updateForNullCla.restore()
            statusService.updateForClaNotRequired.restore()
            prService.editComment.restore()
            prService.badgeComment.restore()
            prService.deleteComment.restore()
        })

        it('should update status and edit comment when the repo is NOT linked with a null CLA and the pull request is significant', async () => {
            await cla_api.validatePullRequest(args)

            await new Promise(resolve => setTimeout(() => {
                assert(statusService.update.calledWithMatch({
                    signed: resp.cla.check.signed,
                    repo: 'Hello-World',
                    owner: 'octocat',
                    sha: 'abcde',
                    number: 1
                }))
                // assert(prService.editComment.calledWithMatch({
                //     repo: 'Hello-World',
                //     owner: 'octocat',
                //     number: 1,
                //     signed: resp.cla.check.signed,
                //     userMap: resp.cla.check.userMap
                // }))
                assert(prService.badgeComment.calledWithMatch('octocat', 'Hello-World', 1, resp.cla.check.signed, resp.cla.check.userMap))
                resolve()
            }))
        })

        it('should update status and delete comment when the repo linked with a null CLA', async () => {
            resp.cla.getLinkedItem.gist = undefined

            await cla_api.validatePullRequest(args)
            await new Promise(resolve => setTimeout(() => {
                assert(statusService.updateForNullCla.called)
                assert(prService.deleteComment.called)
                resolve()
            }))
            assert(!cla.isClaRequired.called)
            assert(!cla.check.called)
        })

        it('should update status and delete comment when the repo is NOT linked with a null CLA and the pull request is NOT significant', async () => {
            resp.cla.isClaRequired = false

            await cla_api.validatePullRequest(args)
            await new Promise(resolve => setTimeout(() => {
                assert(statusService.updateForClaNotRequired.called)
                assert(prService.deleteComment.called)
                assert(!statusService.updateForNullCla.called)
                resolve()
            }))
            assert(!cla.check.called)
        })
    })

    describe('cla:addSignature', () => {
        let req, expArgs, testUser
        beforeEach(() => {
            req = {
                user: {
                    id: 3,
                    login: 'apiCaller'
                },
                args: {
                    userId: 1,
                    user: 'user',
                    repo: 'Hello-World',
                    owner: 'octocat',
                    custom_fields: 'custom_fields'
                }
            }
            expArgs = {
                repo: 'Hello-World',
                owner: 'octocat',
                user: 'user',
                origin: 'addSignature|apiCaller',
                userId: 1
            }
            expError.cla.sign = null
            testUser = {
                save: function () { },
                name: 'testUser',
                requests: [{
                    repo: 'Hello-World',
                    owner: 'octocat',
                    numbers: [1]
                }]
            }
            resp.cla.getLinkedItem = Object.assign({}, testData.repo_from_db)
            sinon.stub(cla, 'sign').callsFake(() => {
                return expError.cla.sign ? Promise.reject(expError.cla.sign) : Promise.resolve('done')
            })
            sinon.stub(User, 'findOne').callsFake(async () => {
                return testUser
            })
        })

        afterEach(() => {
            cla.sign.restore()
            User.findOne.restore()
        })

        it('should call cla service sign with expected Arguments', async () => {
            await cla_api.addSignature(req)
            assert(cla.sign.called)
            sinon.assert.calledWithMatch(cla.sign, expArgs)
        })

        it('should construct origin attribute using provided origin|addSignature|username_of_the_caller', async () => {
            req.args.origin = 'myOrigin'
            expArgs.origin = 'myOrigin|addSignature|apiCaller'
            await cla_api.addSignature(req)
            assert(cla.sign.called)
            sinon.assert.calledWithMatch(cla.sign, expArgs)
        })

        it('should call cla service sign and update status of pull request created by user, who signed', async () => {
            await cla_api.addSignature(req)
            assert(cla.sign.called)
            assert(User.findOne.called)
        })

        it('should send validation error when repo and owner or org is not provided', async () => {
            let req = {
                args: {
                    userId: 1,
                    user: 'user'
                }
            }
            try {
                await cla_api.addSignature(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error)
            }
        })

        it('should send error and log error when sign cla failed', async () => {
            expError.cla.sign = 'You\'ve already signed the cla.'
            try {
                await cla_api.addSignature(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error === expError.cla.sign)
                assert(log.error.called)
            }
        })
    })

    describe('cla:hasSignature', () => {
        let req
        beforeEach(() => {
            req = {
                args: {
                    userId: 1,
                    user: 'user',
                    repo: 'Hello-World',
                    owner: 'octocat'
                }
            }
            sinon.stub(cla, 'check').callsFake(async () => {
                return {
                    signed: true
                }
            })
        })

        afterEach(() => {
            cla.check.restore()
        })

        it('should call cla service check', async () => {
            await cla_api.hasSignature(req)
            assert(cla.check.called)
        })

        it('should send validation error when repo and owner or org is not provided', async () => {
            let req = {
                args: {
                    userId: 1,
                    user: 'user'
                }
            }
            try {
                cla_api.hasSignature(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error)
                assert(!cla.check.called)
            }
        })
    })

    describe('cla:terminateSignature', () => {
        let req
        beforeEach(() => {
            req = {
                args: {
                    userId: 1,
                    user: 'user',
                    repo: 'Hello-World',
                    owner: 'octocat',
                    endDate: new Date().toISOString()
                }
            }
            expError.cla.terminate = null
            sinon.stub(cla, 'terminate').callsFake(async () => {
                if (expError.cla.terminate) {
                    throw expError.cla.terminate
                }
            })
        })

        afterEach(() => cla.terminate.restore())

        it('should call cla service terminate', async () => {
            await cla_api.terminateSignature(req)
            assert(cla.terminate.called)
        })

        it('should send validation error when repo and owner or org is not provided', async () => {
            let req = {
                args: {
                    userId: 1,
                    user: 'user'
                }
            }
            try {
                cla_api.terminateSignature(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error)
                assert(!cla.terminate.called)
            }
        })

        it('should send error and log error when terminate cla failed', async () => {
            expError.cla.terminate = 'Cannot find cla record'
            try {
                await cla_api.terminateSignature(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error === expError.cla.terminate)
            }
        })
    })

    describe('cla:revokeSignature', () => {
        let req
        beforeEach(() => {
            req = {
                args: {
                    _id: 1234,
                    userId: 1,

                    repo: 'Hello-World',
                    owner: 'octocat',
                },
                user: {
                    user: 'user',
                    token: 'userToken'
                }
            }
            expError.cla.revoke = null
            sinon.stub(cla, 'revoke').callsFake(async () => {
                if (expError.cla.revoke) {
                    throw expError.cla.revoke
                }
            })
        })

        afterEach(() => cla.revoke.restore())

        it('should call cla service revoke', async () => {
            await cla_api.revoke(req)
            assert(cla.revoke.called)
        })

        it('should send validation error when cla id is not provided', async () => {
            let req = {
                args: {
                    userId: 1,
                },
                user: {
                    user: 'user',
                    token: 'userToken'
                }
            }
            try {
                await cla_api.revoke(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error)
                assert(!cla.revoke.called)
            }
        })

        it('should send error and log error when revoke cla failed', async () => {
            expError.cla.revoke = 'Cannot find cla record'
            try {
                await cla_api.revoke(req)
                assert(false, 'should throw an error')
            } catch (error) {
                assert(error === expError.cla.revoke)
            }
        })
    })
})

async function delayAssertion(assertFunction, time) {
    await new Promise((resolve) => {
        setTimeout(() => {
            assertFunction()
            resolve()
        }, time)
    })
}
