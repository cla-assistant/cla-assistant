/*eslint no-empty-function: "off"*/
/*global describe, it, beforeEach, afterEach*/

// unit test
let assert = require('assert')
let sinon = require('sinon')

// module
let repo = require('../../../server/services/repo')
let webhook = require('../../../server/api/webhook')

//model
let Repo = require('../../../server/documents/repo').Repo


// api
let repo_api = require('../../../server/api/repo')


describe('repo', () => {
    describe('on repo:create', () => {
        let req, res
        beforeEach(() => {
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
            }
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
                },
                repoCreate: {
                    err: null,
                    data: {
                        repoId: 123,
                        repo: 'myRepo',
                        owner: 'login',
                        gist: 1234
                    }
                }
            }
            sinon.stub(repo, 'get').callsFake(async () => {
                if (res.repoGet.err) { throw res.repoGet.err }
                return res.repoGet.data
            })
            sinon.stub(repo, 'getGHRepo').callsFake(async () => {
                if (res.repoGetGHRepo.err) { throw res.repoGetGHRepo.err }
                return res.repoGetGHRepo.data
            })
            sinon.stub(repo, 'create').callsFake(async () => {
                if (res.repoCreate.err) { throw res.repoCreate.err }
                return res.repoCreate.data
            })
            sinon.stub(repo, 'update').callsFake(async () => {
                if (res.repoUpdate.err) { throw res.repoUpdate.err }
                return res.repoUpdate.data
            })
            sinon.stub(webhook, 'create').callsFake(async () => {
                //do nothing here
            })
        })
        afterEach(() => {
            repo.create.restore()
            repo.get.restore()
            repo.getGHRepo.restore()
            repo.update.restore()
            webhook.create.restore()
        })

        it('should create repo via service', async () => {
            await repo_api.create(req)
            assert(repo.get.called)
            assert.equal(repo.create.calledWith({
                repoId: 123,
                repo: 'myRepo',
                owner: 'login',
                gist: 1234,
                token: 'abc'
            }), true)
            assert(webhook.create.called)
        })

        it('should update repo if there is one and it is not valid any more', async () => {
            res.repoGet.data = {
                repoId: 321,
                repo: 'myRepo',
                owner: 'login'
            }
            res.repoGetGHRepo.err = 'Repo is not valid anymore'
            await repo_api.create(req)
            assert(repo.get.called)
            assert(repo.getGHRepo.called)
            assert.equal(repo.update.calledWith({
                repoId: 123,
                repo: 'myRepo',
                owner: 'login',
                gist: 1234,
                token: 'abc'
            }), true)
        })

        it('should update repo if there is one and it is not valid any more', async () => {
            res.repoGet.data = {
                repoId: 321,
                repo: 'myRepo',
                owner: 'login'
            }
            res.repoGetGHRepo.data = {
                id: 123
            }
            await repo_api.create(req)
            assert(repo.get.called)
            assert(repo.getGHRepo.called)
            assert.equal(repo.update.calledWith({
                repoId: 123,
                repo: 'myRepo',
                owner: 'login',
                gist: 1234,
                token: 'abc'
            }), true)
        })

        it('should fail to create if there is a valid one already', async () => {
            res.repoGet.data = {
                repoId: 123,
                repo: 'myRepo',
                owner: 'login'
            }
            res.repoGetGHRepo.data = {
                id: 123
            }
            try {
                await repo_api.create(req)
                assert(false, 'an error should have been thrown before')
            } catch (error) {
                assert(error)
                assert(repo.getGHRepo.called)
            }
        })

        it('should create webhook after create repo entry', async () => {
            await repo_api.create(req)
            assert(!repo.getGHRepo.called)
            assert(repo.create.called)
            assert(webhook.create.called)
        })

        it('should NOT create webhook for null cla repo', async () => {
            res.repoCreate.data.gist = null
            await repo_api.create(req)
            assert(!repo.getGHRepo.called)
            assert(repo.create.called)
            assert(!webhook.create.called)
        })

        it('should send validation error when owner, repo, repoId, token is absent', async () => {
            req = {
                args: {},
                user: {}
            }
            try {
                await repo_api.create(req)
                assert(false, 'an error should have been thrown before')
            } catch (error) {
                assert(error)
                assert(!repo.getGHRepo.called)
                assert(!repo.create.called)
                assert(!webhook.create.called)
            }
        })

        it('should send error when create repo fail', async () => {
            res.repoCreate.err = 'Create repo error'
            try {
                await repo_api.create(req)
                assert(false, 'an error should have been thrown before')
            } catch (error) {
                assert(error)
                assert(!repo.getGHRepo.called)
                assert(repo.create.called)
                assert(!webhook.create.called)
            }
        })
    })

    it('should check via repo service', async () => {
        let repoStub = sinon.stub(repo, 'check').callsFake(async (args) => {
            assert.deepEqual(args, {
                repo: 'myRepo',
                owner: 'login'
            })
        })

        let req = {
            args: {
                repo: 'myRepo',
                owner: 'login'
            }
        }

        await repo_api.check(req)
        repoStub.restore()
    })

    it('should update via repo service', async () => {
        let repoMock = {
            owner: 'login',
            gist: 1234,
            save: async () => {
                assert.equal(repoMock.gist, 'url')
                assert.equal(repoMock.token, 'user_token')
                return repoMock
            }
        }
        let repoStub = sinon.stub(Repo, 'findOne').callsFake(async () => repoMock)

        let req = {
            user: {
                token: 'user_token'
            },
            args: {
                repo: 'myRepo',
                owner: 'login',
                gist: 'url'
            }
        }

        await repo_api.update(req)
        repoStub.restore()
    })

    describe('remove', () => {
        let req = null
        let res = null
        beforeEach(() => {
            req = {
                args: {
                    repoId: 123,
                },
                user: {
                    token: 'token'
                }
            }
            res = {
                repoRemove: {
                    err: null,
                    data: {
                        repoId: 123,
                        repo: 'myRepo',
                        owner: 'login',
                        gist: 1234
                    }
                }
            }
            sinon.stub(repo, 'remove').callsFake(() => {
                if (res.repoRemove.err) { throw res.repoRemove.err }
                return res.repoRemove.data
            })
            sinon.stub(webhook, 'remove').callsFake(() => {
                //do nothing here
            })
        })

        afterEach(() => {
            repo.remove.restore()
            webhook.remove.restore()
        })

        it('should remove repo entry and webhook when unlink a repo', async () => {
            await repo_api.remove(req)
            assert(req.args.owner)
            assert(req.args.repo)
            assert(repo.remove.called)
            assert(webhook.remove.called)
        })

        it('should remove repo entry but not remove webhook when unlink a null CLA repo', async () => {
            res.repoRemove.data.gist = null
            await repo_api.remove(req)
            assert(repo.remove.called)
            assert(!webhook.remove.called)
        })

        it('should send validation error when owner, repo, or repoId is absent', async () => {
            req = {
                args: {},
                user: {}
            }
            try {
                await repo_api.create(req)
                assert(false, 'an error should have been thrown before')
            } catch (error) {
                assert(error)
                assert(!repo.remove.called)
                assert(!webhook.remove.called)
            }
        })

        it('should send error when remove repo fail', async () => {
            res.repoRemove.err = 'Remove repo error'
            try {
                await repo_api.create(req)
                assert(false, 'an error should have been thrown before')
            } catch (error) {
                assert(error)
                assert(!repo.remove.called)
                assert(!webhook.remove.called)
            }
        })
    })

    it('should call repo service to get all repos for user', async () => {
        sinon.stub(repo, 'getAll').callsFake(async () => {
            //do nothing here
        })

        await repo_api.getAll({ args: '' })

        assert(repo.getAll.called)
        repo.getAll.restore()
    })
})
