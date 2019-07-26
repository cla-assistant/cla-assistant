/*global describe, it, beforeEach, afterEach*/
// unit test
const assert = require('assert')
const sinon = require('sinon')

//model
const CLA = require('../../../server/documents/cla').CLA

//services
const org_service = require('../../../server/services/org')
const repo_service = require('../../../server/services/repo')
const github = require('../../../server/services/github')
const logger = require('../../../server/services/logger')

const config = require('../../../config')
// test data
const testData = require('../testData').data

// service under test
const cla = require('../../../server/services/cla')

let expArgs = {}
let testRes = {}
let testErr = {}

const stub = () => {
    expArgs.claFindOne = {
        repoId: 1296269,
        user: 'login',
        gist_url: 'gistUrl',
        gist_version: 'xyz',
        org_cla: false
    }
    testErr.claFindOne = null
    testErr.orgServiceGet = null
    testErr.repoServiceGet = null
    testErr.repoServiceGetCommitters = null

    testRes.claFindOne = {
        save: sinon.stub().resolves(),
    }
    testRes.repoServiceGet = {
        repoId: 123,
        gist: 'url/gistId',
        token: 'abc',
        sharedGist: false,
        isUserWhitelisted: function () {
            return false
        }
    }
    testRes.repoServiceGetCommitters = [{
        name: 'login2'
    }, {
        name: 'login'
    }]

    sinon.stub(CLA, 'findOne').callsFake(async () => {
        if (testErr.claFindOne) {
            throw testErr.claFindOne
        }
        return testRes.claFindOne
    })

    sinon.stub(org_service, 'get').callsFake(async () => {
        if (testErr.orgServiceGet) {
            throw testErr.orgServiceGet
        }
        return testRes.orgServiceGet
    })

    sinon.stub(repo_service, 'get').callsFake(async () => {
        if (testErr.repoServiceGet) {
            throw testErr.repoServiceGet
        }
        return testRes.repoServiceGet
    })

    sinon.stub(repo_service, 'getGHRepo').callsFake(async () => testData.repo)

    sinon.stub(logger, 'error').callsFake((msg) => assert(msg))
    sinon.stub(logger, 'warn').callsFake((msg) => assert(msg))
    sinon.stub(logger, 'info').callsFake((msg) => assert(msg))

    sinon.stub(github, 'call').callsFake(async (args) => {
        if (args.obj === 'pulls' && args.fun === 'get') {
            if (testErr.getPR) {
                throw testErr.getPR
            }
            return testRes.getPR
        } else if (args.obj === 'gists' && args.fun === 'get') {
            if (testErr.gistData) {
                throw testErr.gistData
            }
            return testRes.gistData
        } else if (args.obj === 'orgs' && args.fun === 'listMembers') {
            return testRes.getOrgMembers
        }
    })
}

const restore = () => {
    testRes = {}
    testErr = {}

    CLA.findOne.restore()
    org_service.get.restore()
    repo_service.get.restore()
    repo_service.getGHRepo.restore()
    logger.error.restore()
    logger.warn.restore()
    logger.info.restore()
    github.call.restore()
}

describe('cla:getLastSignature', () => {
    const now = new Date()
    let clock = null

    beforeEach(() => {
        stub()
        testRes.gistData = {
            data: {
                history: [{
                    version: 'xyz'
                }]
            }
        }
        clock = sinon.useFakeTimers(now.getTime())
    })

    afterEach(() => {
        restore()
        clock.restore()
    })

    it('should get cla entry for equal repo, userId or user and gist url', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            userId: 'userId',
            user: 'user'
        }
        testRes.repoServiceGet.sharedGist = true
        await cla.getLastSignature(args)
        assert.equal(CLA.findOne.calledWithMatch({
            $or: [{
                userId: 'userId',
                gist_url: 'url/gistId',
                gist_version: 'xyz',
                repoId: 123,
                org_cla: false,
                created_at: {
                    $lte: now
                },
                end_at: {
                    $gt: now
                }
            }, {
                userId: 'userId',
                gist_url: 'url/gistId',
                gist_version: 'xyz',
                repoId: 123,
                org_cla: false,
                created_at: {
                    $lte: now
                },
                end_at: undefined
            }, {
                user: 'user',
                userId: {
                    $exists: false
                },
                gist_url: 'url/gistId',
                gist_version: 'xyz',
                repoId: 123,
                org_cla: false,
                created_at: {
                    $lte: now
                },
                end_at: {
                    $gt: now
                }
            }, {
                user: 'user',
                userId: {
                    $exists: false
                },
                gist_url: 'url/gistId',
                gist_version: 'xyz',
                repoId: 123,
                org_cla: false,
                created_at: {
                    $lte: now
                },
                end_at: undefined
            }, {
                userId: 'userId',
                gist_url: 'url/gistId',
                gist_version: 'xyz',
                owner: undefined,
                repo: undefined,
                created_at: {
                    $lte: now
                },
                end_at: {
                    $gt: now
                }
            }, {
                userId: 'userId',
                gist_url: 'url/gistId',
                gist_version: 'xyz',
                owner: undefined,
                repo: undefined,
                created_at: {
                    $lte: now
                },
                end_at: undefined
            }]
        }), true)
    })

    it('should update user name if github username is changed', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'changedUserName',
            userId: 'userId'
        }

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
                })
            }
        }
        CLA.findOne.restore()
        sinon.stub(CLA, 'findOne').callsFake(async (query) => {
            assert.equal(query.$or.length, 4)
            assert(!query.$or[0].user)
            assert.equal(query.$or[2].user, 'changedUserName')
            return testRes.claFindOne
        })

        const signature = await cla.getLastSignature(args)
        assert(CLA.findOne.called)
        assert(signature.user === args.user)
    })

    it('should send error when update user name failed when github username is changed', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'changedUserName',
            userId: 'userId'
        }

        testRes.claFindOne = {
            user: 'user',
            userId: 'userId',
            repoId: 'repoId',
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz',
            save: async () => {
                throw 'Update error.'
            }
        }

        CLA.findOne.restore()
        sinon.stub(CLA, 'findOne').callsFake(async (query) => {
            assert.equal(query.$or.length, 4)
            assert(!query.$or[0].user)
            assert.equal(query.$or[2].user, 'changedUserName')
            return testRes.claFindOne
        })

        try {
            await cla.getLastSignature(args)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error === 'Update error.')
            assert(CLA.findOne.called)
        }
    })

    it('should get cla for repos or orgs with shared gist', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 'userId'
        }
        testRes.repoServiceGet.sharedGist = true
        CLA.findOne.restore()
        sinon.stub(CLA, 'findOne').callsFake(async (query) => {
            assert.equal(query.$or.length, 6)
            assert(query.$or[0].repoId)
            assert(!query.$or[4].repoId)
            assert.equal(query.$or[4].repo, undefined)
            assert.equal(query.$or[4].owner, undefined)
            return testRes.claFindOne
        })

        await cla.getLastSignature(args)
        assert(CLA.findOne.called)
    })

    it('should search a cla on current date and a pull request date when PR number is provided', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1',
            user: 'login',
            userId: 'userId'
        }
        const prCreateDateString = '1970-01-01T00:00:00.000Z'
        const prCreateDate = new Date(prCreateDateString)
        testErr.getPR = null
        testRes.getPR = {
            data: {
                created_at: prCreateDate
            }
        }
        CLA.findOne.restore()
        sinon.stub(CLA, 'findOne').callsFake(async (query) => {
            assert.equal(query.$or.length, 8)
            assert.deepEqual(query.$or[0].created_at, {
                $lte: now
            })
            assert.deepEqual(query.$or[2].created_at, {
                $lte: prCreateDate
            })
            return testRes.claFindOne
        })

        await cla.getLastSignature(args)
        assert(CLA.findOne.called)
    })

    it('should positive check if a repo has a null CLA', async () => {
        testRes.repoServiceGet.gist = undefined
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 'userId'
        }
        const signature = await cla.getLastSignature(args)
        assert(signature)
    })

    it('should send error if there is no linked repo or org', async () => {
        testErr.repoServiceGet = 'Repository not found in Database'
        testErr.orgServiceGet = 'Organization not found in Database'
        testRes.repoServiceGet = null
        testRes.orgServiceGet = null
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 'userId'
        }
        let signature
        try {
            signature = await cla.getLastSignature(args)
        } catch (error) {
            assert(error)
            assert(!signature)
        }
    })

    it('should send error if getGist has an error', async () => {
        testErr.gistData = 'Error'
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 'userId'
        }
        let signature
        try {
            signature = await cla.getLastSignature(args)
        } catch (error) {
            assert(error)
            assert(!signature)
        }
    })

    it('should send error if get pull request failed when pull request number is given', async () => {
        testErr.getPR = 'Error'
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 'userId',
            number: '1'
        }
        let signature
        try {
            signature = await cla.getLastSignature(args)
        } catch (error) {
            assert(error)
            assert(!signature)
        }
    })

    it('should send error if user is not given', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner'
        }
        let signature
        try {
            signature = await cla.getLastSignature(args)
        } catch (error) {
            assert(error)
            assert(!signature)
        }
    })
})

describe('cla:checkUserSignature', () => {
    beforeEach(() => {
        sinon.stub(cla, 'getLastSignature').callsFake(async () => {
            return {}
        })
    })

    afterEach(() => {
        return cla.getLastSignature.restore()
    })

    it('should call get last signature for the user', async () => {
        const args = {
            repo: 'repo',
            owner: 'owner',
            user: 'user'
        }
        const result = await cla.checkUserSignature(args)
        assert(result.signed)
        assert(cla.getLastSignature.called)
    })
})

describe('cla:checkPullRequestSignatures', () => {
    const now = new Date()
    let clock = null
    beforeEach(() => {
        stub()
        testRes.gistData = {
            data: {
                url: 'url',
                files: {
                    xyFile: {
                        content: 'some content'
                    }
                },
                updated_at: '2011-06-20T11:34:15Z',
                history: [{
                    version: 'xyz'
                }]
            }
        }
        testRes.repoServiceGet = {
            repoId: '123',
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc',
            isUserWhitelisted: function () {
                return false
            }
        }
        clock = sinon.useFakeTimers(now.getTime())
        let prCreateDateString = '1970-01-01T00:00:00.000Z'
        let prCreateDate = new Date(prCreateDateString)
        testErr = {
            repoServiceGet: null,
            orgServiceGet: null,
            getPR: null,
            repoServiceGetCommitters: null
        }
        testRes.getPR = {
            data: {
                user: {
                    login: 'login0',
                    id: '0'
                },
                created_at: prCreateDate,
                head: {
                    repo: {
                        owner: {
                            login: 'orgLogin0',
                            type: 'Organization',
                            id: '37'
                        }
                    }
                }
            }
        }
        sinon.stub(repo_service, 'getPRCommitters').callsFake(async () => {
            if (testErr.repoServiceGetCommitters) {
                throw testErr.repoServiceGetCommitters
            }
            return testRes.repoServiceGetCommitters
        })
    })

    afterEach(() => {
        restore()
        repo_service.getPRCommitters.restore()
        clock.restore()
    })

    it('should send error if there is no linked repo found in database', async () => {
        testErr.repoServiceGet = 'Repository not found in Database'
        // testErr.orgServiceGet = 'Organization not found in Database'
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            await cla.checkPullRequestSignatures(args)
            assert(false, 'should have thrown error')
        } catch (error) {
            assert.equal(error.message, 'could not find linked item for owner owner and repo myRepo')
            // assert.equal(error, testErr.repoServiceGet)
        }
    })

    it('should send error if there is no linked org found in the database', async () => {
        testErr.repoServiceGet = 'Repository not found in Database'
        testErr.orgServiceGet = 'Organization not found in Database'
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            await cla.checkPullRequestSignatures(args)
            assert(false, 'should have thrown error')
        } catch (error) {
            assert.equal(error, testErr.orgServiceGet)
        }
    })

    it('should send error if getGist has an error', async () => {
        testErr.gistData = 'Error'
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            await cla.checkPullRequestSignatures(args)
            assert(false, 'should have thrown error')
        } catch (error) {
            assert.equal(error, testErr.gistData)
        }
    })

    it('should send error if get pull request failed', async () => {
        testErr.getPR = 'Error'
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            await cla.checkPullRequestSignatures(args)
            assert(false, 'should have thrown error')
        } catch (error) {
            assert(error, testErr.getPR)
        }
    })

    it('should send error if committers list is empty', async () => {
        testErr.repoServiceGetCommitters = 'err'
        testRes.repoServiceGetCommitters = undefined

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            await cla.checkPullRequestSignatures(args)
            assert(false, 'should have thrown error')
        } catch (error) {
            assert.equal(error, testErr.repoServiceGetCommitters)
        }
    })

    it('should positive check if an repo has a null CLA', async () => {
        testRes.repoServiceGet.gist = undefined
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const result = await cla.checkPullRequestSignatures(args)
        assert(result.signed)
    })

    it('should return map of committers who has signed, who has not signed and who has no github account', async () => {
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }, {
            name: 'login3',
            id: ''
        }]
        CLA.findOne.restore()
        sinon.stub(CLA, 'findOne').callsFake(async (arg) => {
            if (arg.$or[0].userId === '123') {
                return {
                    id: 'testCLAid',
                    user: 'login1',
                    gist_url: 'url/gistId',
                    created_at: '2012-06-20T11:34:15Z',
                    gist_version: 'xyz'
                }
            }
            return null
        })

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const result = await cla.checkPullRequestSignatures(args)
        assert(!result.signed)
        assert.equal(result.userMap.signed[0], 'login1')
        assert.equal(result.userMap.not_signed[0], 'login2')
        assert.equal(result.userMap.not_signed[1], 'login3')
        assert.equal(result.userMap.unknown[0], 'login3')
    })

    it('should return map of committers also for old linked repos without sharedGist flag', async () => {
        delete testRes.repoServiceGet.sharedGist
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }]
        CLA.findOne.restore()
        sinon.stub(CLA, 'findOne').callsFake(async (arg) => {
            if (arg.$or[0].userId === '123') {
                return {
                    id: 123,
                    user: 'login1',
                    gist_url: 'url/gistId',
                    created_at: '2012-06-20T11:34:15Z',
                    gist_version: 'xyz'
                }
            }
        })

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const result = await cla.checkPullRequestSignatures(args)
        assert(result.signed)
        assert.equal(result.userMap.signed[0], 'login1')
    })

    it('should only check submitter when using submitter mode', async () => {
        config.server.feature_flag.required_signees = 'submitter'
        testRes.claFindOne = null
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }]

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            const result = await cla.checkPullRequestSignatures(args)
            assert.equal(result.userMap.not_signed.length, 1)
            assert.equal(result.userMap.not_signed[0], 'login0')
        } finally {
            config.server.feature_flag.required_signees = ''
        }
    })

    it('should check submitter and committer when using submitter+committer mode', async () => {
        config.server.feature_flag.required_signees = 'submitter, committer'
        testRes.claFindOne = null
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }]

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            const result = await cla.checkPullRequestSignatures(args)
            assert.equal(result.userMap.not_signed.length, 3)
        } finally {
            config.server.feature_flag.required_signees = ''
        }
    })

    it('should not check submitter if he/she is whitelisted', async () => {
        testRes.repoServiceGet.isUserWhitelisted = user => user === 'login0'
        config.server.feature_flag.required_signees = 'submitter'
        testRes.claFindOne = null
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }]

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        try {
            const {
                userMap: {
                    not_signed
                }
            } = await cla.checkPullRequestSignatures(args)
            assert.equal(not_signed.length, 0)
        } finally {
            config.server.feature_flag.required_signees = ''
        }
    })

    it('should exclude whitelisted committers from the map', async () => {
        testRes.repoServiceGet.isUserWhitelisted = (user) => user === 'login1'
        testRes.repoServiceGetCommitters = [{
            name: 'login1',
            id: '123'
        }, {
            name: 'login2',
            id: '321'
        }, {
            name: 'login3',
            id: ''
        }]
        CLA.findOne.restore()
        sinon.stub(CLA, 'findOne').callsFake(async () => null)

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            number: '1'
        }

        const result = await cla.checkPullRequestSignatures(args)
        assert(!result.signed)
        assert.equal(result.userMap.signed.length, 0)
        assert.equal(result.userMap.not_signed.length, 2)
        assert.equal(result.userMap.not_signed[0], 'login2')
        assert.equal(result.userMap.not_signed[1], 'login3')
        assert.equal(result.userMap.unknown[0], 'login3')
    })

    describe('organization signee', function () {
        beforeEach(() => {
            config.server.feature_flag.organization_override_enabled = true
            testRes.getPR = {
                data: {
                    head: {
                        repo: {
                            owner: {
                                login: 'orgLogin0',
                                type: 'Organization',
                                id: '37'
                            }
                        }
                    },
                    base: {
                        repo: {
                            owner: {
                                login: 'orgLogin0',
                                type: 'Organization',
                                id: '37'
                            }
                        }
                    },
                    user: {
                        login: 'login0',
                        id: '0'
                    },
                }
            }

            after(() => {
                config.server.feature_flag.organization_override_enabled = false
                testRes.getPR = undefined
            })
        })

        it('should call callback function immediately if organization is whitelisted and there are no external committers ', async () => {
            config.server.feature_flag.required_signees = 'submitter committer'
            testRes.getPR.data.head.repo.fork = false
            testRes.repoServiceGet.isUserWhitelisted = login => login === testRes.getPR.data.head.repo.owner.login
            testRes.repoServiceGetCommitters = [{
                name: 'login1',
                id: '123'
            }, {
                name: 'login2',
                id: '321'
            }]
            testRes.getOrgMembers = {
                data: [{
                    login: 'login1',
                    id: '123'
                }, {
                    login: 'login2',
                    id: '321'
                }]
            }
            const args = {
                repo: 'myRepo',
                owner: 'owner',
                number: '1'
            }

            try {
                const result = await cla.checkPullRequestSignatures(args)
                const {
                    signed
                } = result
                assert(signed)
                sinon.assert.notCalled(CLA.findOne)
            } finally {
                config.server.feature_flag.required_signees = ''
            }
        })
        it('should check if the external committer has signed the CLA when the organization is whitelisted (external Organisation) ', async () => {
            config.server.feature_flag.required_signees = 'submitter committer'
            testRes.getPR.data.head.repo.fork = true
            testRes.getPR.data.head.repo.owner.login = 'orgLogin1'
            testRes.repoServiceGet.isUserWhitelisted = login => login === testRes.getPR.data.head.repo.owner.login
            testRes.repoServiceGetCommitters = [{
                name: 'login1',
                id: '123'
            }, {
                name: 'externallogin',
                id: '555'
            }, {
                name: 'login2',
                id: '321'
            }]
            testRes.getOrgMembers = {
                data: [{
                    login: 'login1',
                    id: '123'
                }, {
                    login: 'login2',
                    id: '321'
                }]
            }
            const args = {
                repo: 'myRepo',
                owner: 'owner',
                number: '1'
            }

            try {
                const result = await cla.checkPullRequestSignatures(args)
                const {
                    signed
                } = result
                assert(signed)
                sinon.assert.called(CLA.findOne)
            } finally {
                config.server.feature_flag.required_signees = ''
            }
        })
    })
})

describe('cla.check', () => {
    beforeEach(() => {
        sinon.stub(cla, 'checkUserSignature')
        sinon.stub(cla, 'checkPullRequestSignatures').resolves({
            signed: true,
            userMap: {}
        })
    })

    afterEach(() => {
        cla.checkUserSignature.restore()
        cla.checkPullRequestSignatures.restore()
    })

    it('Should call checkUser when user is given', async () => {
        const args = {
            repo: 'repo',
            owner: 'owner',
            user: 'user'
        }

        await cla.check(args)
        assert(cla.checkUserSignature.called)
        assert(!cla.checkPullRequestSignatures.called)
    })

    it('Should call checkPullRequest when user is NOT given and pull request number is given', async () => {
        const args = {
            repo: 'repo',
            owner: 'owner',
            number: '1'
        }

        await cla.check(args, () => (undefined))
        assert(cla.checkPullRequestSignatures.called)
        assert(!cla.checkUserSignature.called)
    })

    it('Should send error if user or pull request number is NOT given', async () => {
        const args = {
            repo: 'repo',
            owner: 'owner'
        }
        try {
            await cla.check(args)
        } catch (error) {
            assert(error)
            assert(!cla.checkPullRequestSignatures.called)
            assert(!cla.checkUserSignature.called)
        }
    })
})

describe('cla:sign', () => {
    const testArgs = {}

    beforeEach(() => {
        stub()
        testArgs.claSign = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'login',
            userId: 3,
            origin: 'sign|login',
            updated_at: '2018-06-28T11:34:15Z'
        }

        testRes.repoServiceGet = {
            repoId: '123',
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc',
            isUserWhitelisted: function () {
                return false
            }
        }

        testRes.orgServiceGet = {
            orgId: '1',
            org: 'test_org',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc'
        }

        testRes.claFindOne = null
        testRes.gistData = {
            data: {
                url: 'url',
                files: {
                    xyFile: {
                        content: 'some content'
                    }
                },
                updated_at: '2011-06-20T11:34:15Z',
                history: [{
                    version: 'xyz'
                }]
            }
        }
        testErr.orgServiceGet = null
        testErr.repoServiceGet = null
        testErr.repoServiceGet = null

        sinon.stub(CLA, 'create').callsFake((args) => {
            assert(args)

            assert(args.repoId ? args.repoId : args.ownerId)
            assert(args.repo ? args.repo : args.org_cla)
            assert(args.owner)
            assert(args.userId)
            assert(args.gist_url)
            assert(args.gist_version)
            assert(args.created_at)
            assert(args.updated_at)
            assert(args.origin)

            return testErr.claCreate ? Promise.reject(testErr.claCreate) : Promise.resolve(testRes.claCreate)
        })
    })

    afterEach(() => {
        restore()
        CLA.create.restore()
    })

    it('should store signed cla data for repo if not signed yet', async () => {
        await cla.sign(testArgs.claSign)

        assert(CLA.create.called)
        assert(CLA.findOne.called)
        assert(!org_service.get.called)
    })

    it('should store signed cla data for org', async () => {
        testRes.repoServiceGet = null

        await cla.sign(testArgs.claSign)

        assert(CLA.create.called)
        assert(CLA.create.calledWithMatch({
            gist_url: 'url/gistId'
        }))
        assert(org_service.get.called)
    })

    it('should store signed cla data for org even without repo name', async () => {
        testArgs.claSign.repo = undefined

        await cla.sign(testArgs.claSign)

        assert(CLA.create.called)
        assert(!repo_service.getGHRepo.called)
        assert(CLA.create.calledWithMatch({
            gist_url: 'url/gistId'
        }))
        assert(org_service.get.called)
    })

    it('should do nothing if user has already signed', async () => {
        testArgs.claSign.user = 'signedUser'
        testRes.claFindOne = {
            user: 'signedUser'
        }

        try {
            await cla.sign(testArgs.claSign)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert.equal(CLA.create.called, false)
        }
    })

    it('should report error if error occurs on DB', async () => {
        testErr.claCreate = 'any DB error'
        testRes.claCreate = null

        try {
            await cla.sign(testArgs.claSign)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
        }
    })

    it('should send error message when a repo linked with an Null CLA', async () => {
        testErr.claCreate = 'any DB error'
        testRes.claCreate = null
        testRes.repoServiceGet.gist = null

        try {
            await cla.sign(testArgs.claSign)
            assert(false, 'should have thrown an error')
        } catch (error) {
            assert(error)
            assert(error.code === 200)
        }
    })

    it('should log an error if no signature origin provided', async () => {
        delete testArgs.claSign.origin

        await cla.sign(testArgs.claSign)

        assert(logger.error.called)
    })
})

describe('cla:create', () => {
    afterEach(() => CLA.create.restore())

    it('should create cla entry for equal repo, user and gist url', async () => {
        sinon.stub(CLA, 'create').callsFake(async (arg) => {
            assert(arg)
            assert(arg.gist_url)
            assert(arg.gist_version)
            assert(arg.repo)
            assert(arg.repoId)
            assert(arg.owner)
            assert(arg.created_at)
            assert(arg.updated_at)
            assert(arg.origin)
            return {
                repo: arg.repo,
                owner: arg.owner
            }
        })

        const args = {
            repo: 'myRepo',
            owner: 'owner',
            repoId: '123',
            user: 'login',
            gist: 'url/gistId',
            gist_version: 'xyz',
            created_at: new Date(),
            origin: 'sign|login'
        }
        await cla.create(args)
    })
})

describe('cla:getSignedCLA', () => {
    it('should get all clas signed by the user but only one per repo (linked or not)', async () => {
        sinon.stub(repo_service, 'all').callsFake(async () => {
            return [{
                repo: 'repo1',
                gist_url: 'gist_url'
            }, {
                repo: 'repo2',
                gist_url: 'gist_url'
            }]
        })

        sinon.stub(CLA, 'find').callsFake(async () => {
            let listOfAllCla = [{
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
            }]
            return listOfAllCla
        })

        const args = {
            user: 'login'
        }
        const clas = await cla.getSignedCLA(args)
        assert.equal(clas.length, 3)
        assert.equal(clas[2].repo, 'repo3')
        CLA.find.restore()
        repo_service.all.restore()
    })

    it('should select cla for the actual linked gist per repo even if it is signed earlier than others', async () => {
        sinon.stub(repo_service, 'all').callsFake(async () => {
            return [{
                repo: 'repo1',
                gist_url: 'gist_url2'
            }, {
                repo: 'repo2',
                gist_url: 'gist_url'
            }, {
                repo: 'repo3',
                gist_url: 'gist_url'
            }]
        })
        sinon.stub(CLA, 'find').callsFake(async (arg) => {
            let listOfAllCla = [{
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
            }]
            if (arg.$or) {
                return [{
                    repo: 'repo1',
                    user: 'login',
                    gist_url: 'gist_url2',
                    created_at: '2011-06-15T11:34:15Z'
                }, {
                    repo: 'repo2',
                    user: 'login',
                    gist_url: 'gist_url',
                    created_at: '2011-06-15T11:34:15Z'
                }]
            }
            return listOfAllCla
        })

        const args = {
            user: 'login'
        }
        const clas = await cla.getSignedCLA(args)
        assert.equal(clas[0].gist_url, 'gist_url2')
        assert.equal(CLA.find.callCount, 2)
        CLA.find.restore()
        repo_service.all.restore()
    })
})

describe('cla:getAll', () => {
    beforeEach(() => {
        sinon.stub(CLA, 'find').callsFake(async (arg) => {
            assert(arg)
            let resp = [{
                id: 2,
                created_at: '2011-06-20T11:34:15Z',
                gist_version: 'xyz'
            }]
            if (!arg.$or[0].gist_version) {
                resp.push({
                    id: 1,
                    created_at: '2010-06-20T11:34:15Z',
                    gist_version: 'abc'
                })
            }

            return resp
        })
    })

    afterEach(() => CLA.find.restore())

    it('should get all signed cla with same orgId', async () => {
        const args = {
            orgId: 1,
            gist: {
                gist_url: 'gistUrl'
            }
        }

        const arr = await cla.getAll(args)
        assert.equal(CLA.find.calledWith({
            $or: [{
                ownerId: 1,
                gist_url: 'gistUrl'
            }]
        }), true)
        assert.equal(arr.length, 2)
        assert.equal(arr[0].id, 2)
    })

    it('should get all signed cla with same repoId', async () => {
        const args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl'
            }
        }

        const arr = await cla.getAll(args)
        assert.equal(CLA.find.calledWithMatch({
            $or: [{
                repoId: testData.repo.id,
                gist_url: 'gistUrl'
            }]
        }), true)

        assert.equal(arr.length, 2)
        assert.equal(arr[0].id, 2)
    })

    it('should get all cla for a specific gist version', async () => {
        const args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl',
                gist_version: 'xyz'
            }
        }

        const arr = await cla.getAll(args)
        assert.equal(arr.length, 1)
        assert.equal(arr[0].id, 2)
    })

    it('should handle undefined clas', async () => {
        CLA.find.restore()
        sinon.stub(CLA, 'find').callsFake(async (arg) => {
            assert(arg)
            throw 'Error!'
        })

        const args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl'
            }
        }

        try {
            await cla.getAll(args)
        } catch (error) {
            assert(error)
        }
    })

    it('should handle wrong args', async () => {
        const args = {
            repoId: testData.repo.id,
            gist: undefined
        }

        try {
            await cla.getAll(args)
        } catch (error) {
            assert(error)
        }
    })

    it('should get all clas for shared gist repo/org', async () => {
        CLA.find.restore()
        sinon.stub(CLA, 'find').callsFake(async (arg) => {
            assert(arg)
            return []
        })
        const args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl',
                gist_version: 'xyz'
            },
            sharedGist: true
        }

        await cla.getAll(args)
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
        }))
    })

    it('should get only one newest cla per user if gist_version provided', async () => {
        CLA.find.restore()
        sinon.stub(CLA, 'find').callsFake(async (arg, _prop, options) => {
            assert(arg)
            assert(options.sort)
            return [{
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
            }]
        })
        const args = {
            repoId: testData.repo.id,
            gist: {
                gist_url: 'gistUrl',
                gist_version: 'xyz'
            },
            sharedGist: true
        }

        const arr = await cla.getAll(args)
        assert.equal(arr.length, 1)
    })
})

describe('cla:getGist', () => {
    beforeEach(() => {
        sinon.stub(github, 'call').callsFake(async (args) => {
            assert.equal(args.arg.gist_id, 'gistId')
            return {
                data: {}
            }
        })
    })

    afterEach(() => github.call.restore())

    it('should extract valid gist ID', async () => {
        const repo = {
            gist: {
                gist_url: 'url/gists/gistId',
                gist_version: 'versionId'
            }
        }

        await cla.getGist(repo)
    })

    it('should extract valid gist ID considering file names in the url', async () => {
        const repo = {
            gist: {
                gist_url: 'url/gists/gistId#fileName',
                gist_version: 'versionId'
            }
        }

        await cla.getGist(repo)
        assert(github.call.called)
    })

    it('should handle repo without gist', async () => {
        const repo = {}
        try {
            await cla.getGist(repo)
        } catch (error) {
            assert.equal(error, 'The gist url "undefined" seems to be invalid')
        }
    })
})

describe('cla:getLinkedItem', () => {
    beforeEach(() => {
        testRes.repoServiceGet = {
            repoId: '1',
            repo: 'Hello-World',
            owner: 'login0',
            gist: 'url/gistId',
            token: 'abc',
            isUserWhitelisted: function () {
                return false
            }
        }
        testRes.orgServiceGet = {
            orgId: '1',
            org: 'login0',
            gist: 'url/gistId',
            token: 'abc'
        }
        testErr.repoServiceGetGHRepo = null
        config.server.github.token = 'token'
        sinon.stub(repo_service, 'getGHRepo').callsFake(async (args) => {
            assert(args.token)

            if (testErr.repoServiceGetGHRepo) {
                throw testErr.repoServiceGetGHRepo
            }
            return testData.repo
        })
        sinon.stub(repo_service, 'get').callsFake(async () => {
            return testRes.repoServiceGet
        })
        sinon.stub(org_service, 'get').callsFake(async () => {
            return testRes.orgServiceGet
        })
    })

    afterEach(() => {
        repo_service.getGHRepo.restore()
        repo_service.get.restore()
        org_service.get.restore()
    })

    it('should find linked item using reponame and owner parameters', async () => {
        config.server.github.token = 'test_token'

        const args = {
            repo: 'Hello-World',
            owner: 'login0'
        }

        await cla.getLinkedItem(args)
        assert(repo_service.getGHRepo.called)

    })
    it('should return an error, if the GH Repo does not exist', async () => {
        let testArgs = {
            repo: 'DoesNotExist',
            owner: 'NoOne'
        }
        testErr.repoServiceGetGHRepo = 'GH Repo not found'

        try {
            await cla.getLinkedItem(testArgs)
            assert()
        } catch (e) {
            assert(e == 'GH Repo not found')
        }
    })

    it('should return linked repo even corresponding org is also linked', async () => {
        const args = {
            repo: 'Hello-World',
            owner: 'login0',
            token: 'test_token'
        }

        await cla.getLinkedItem(args)

        assert(repo_service.getGHRepo.called)
        assert(repo_service.get.called)
        assert(!org_service.get.called)
    })

    it('should return linked org when repo is not linked', async () => {
        const args = {
            repo: 'Hello-World',
            owner: 'login0',
            token: 'test_token'
        }
        testRes.repoServiceGet = null

        await cla.getLinkedItem(args)

        assert(repo_service.getGHRepo.called)
        assert(repo_service.get.called)
        assert(org_service.get.called)
    })

    it('should only check linked org if repo name is not provided', async () => {
        const args = {
            owner: 'login0'
        }

        await cla.getLinkedItem(args)

        assert(org_service.get.called)
        assert(!repo_service.get.called)
        assert(!repo_service.getGHRepo.called)
    })
})

describe('cla:terminate', () => {
    beforeEach(() => {
        stub()
        testRes.repoServiceGet = {
            repoId: '123',
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            sharedGist: false,
            token: 'abc',
            isUserWhitelisted: function () {
                return false
            }
        }
        testErr.orgServiceGet = null
        testErr.repoServiceGet = null
        testErr.repoServiceGet = null
        testRes.gistData = {
            data: {
                history: [{
                    version: 'xyz'
                }]
            }
        }
    })

    afterEach(() => restore())

    it('should send error when terminate a null cla', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            token: 'test_token'
        }
        testRes.repoServiceGet.gist = undefined
        let dbCla
        try {
            dbCla = await cla.terminate(args)
        } catch (error) {
            assert(error)
            assert(!dbCla)
        }
    })

    it('should send error when cannot find a signed cla to terminate', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            token: 'test_token'
        }
        testRes.claFindOne = null
        let dbCla
        try {
            dbCla = await cla.terminate(args)
        } catch (error) {
            assert(error)
            assert(!dbCla)
        }
    })

    it('should successfully update the end_at when terminate a cla', async () => {
        const args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'user',
            token: 'test_token'
        }
        testRes.claFindOne = {
            user: 'user',
            repoId: 'repoId',
            gist_url: 'url/gistId',
            created_at: '2012-06-20T11:34:15Z',
            gist_version: 'xyz',
            save: function () {
                return Promise.resolve('Success')
            }
        }
        const dbCla = await cla.terminate(args)
        assert(dbCla)
    })
})

describe('cla:isClaRequired', () => {
    let args = null
    beforeEach(() => {
        stub()
        args = {
            repo: 'myRepo',
            owner: 'owner',
            user: 'user',
            number: 1,
            token: 'userToken'
        }
        testRes.repoServiceGet = {
            repoId: 123,
            repo: 'myRepo',
            owner: 'owner',
            gist: 'url/gistId',
            token: 'abc',
            isUserWhitelisted: () => false
        }
    })

    afterEach(() => restore())

    it('should require a CLA when minimum changes don\'t set up', async () => {
        const claIsRequired = await cla.isClaRequired(args)

        assert(claIsRequired)
    })

    it('should require a CLA when pull request exceed minimum file changes', async () => {
        testRes.repoServiceGet.minFileChanges = 2
        testRes.getPR = {
            data: {
                changed_files: 2
            }
        }

        const claIsRequired = await cla.isClaRequired(args)

        sinon.assert.calledWithMatch(github.call, {
            obj: 'pulls',
            fun: 'get',
            arg: {
                noCache: true
            }
        })
        assert(claIsRequired)
    })

    it('should require a CLA when pull request exceed minimum code changes', async () => {
        testRes.repoServiceGet.minCodeChanges = 15
        testRes.getPR = {
            data: {
                deletions: 10,
                additions: 10,
            }
        }

        const claIsRequired = await cla.isClaRequired(args)

        sinon.assert.calledWithMatch(github.call, {
            obj: 'pulls',
            fun: 'get',
            arg: {
                noCache: true
            }
        })
        assert(claIsRequired)
    })

    it('should NOT require a CLA when pull request NOT exceed minimum file and code changes', async () => {
        testRes.repoServiceGet.minFileChanges = 2
        testRes.repoServiceGet.minCodeChanges = 15
        testRes.getPR = {
            data: {
                changed_files: 1,
                deletions: 7,
                additions: 7
            }
        }

        const claIsRequired = await cla.isClaRequired(args)

        assert(!claIsRequired)
    })

    it('should send error if repo, owner, number is not provided', async () => {
        args = {}
        try {
            await cla.isClaRequired(args)
        } catch (err) {
            assert(!!err)
        }
    })

    it('should NOT send error if token is not provided but use linked item\'s token', async () => {
        delete args.token
        testRes.repoServiceGet.minCodeChanges = 15
        testRes.getPR = {
            data: {
                changed_files: 1,
                additions: 14,
                deletions: 1
            }
        }

        const claIsRequired = await cla.isClaRequired(args)

        sinon.assert.calledWithMatch(github.call, {
            token: 'abc'
        })
        assert(claIsRequired)
    })
})