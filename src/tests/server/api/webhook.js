// unit test
const assert = require('assert')
const sinon = require('sinon')

// module
const github = require('../../../server/services/github')
const url = require('../../../server/services/url')

//model
const Repo = require('../../../server/documents/repo').Repo

// api
const webhook_api = require('../../../server/api/webhook')

const testData = require('../testData').data

describe('webhookApi', function () {
    let hook
    let repo
    let resGetRepoHooks
    let resGetOrgHooks
    beforeEach(function () {
        hook = {
            id: 123,
            active: true,
            config: {
                url: url.baseWebhook
            }
        }
        repo = {
            id: 123,
            repo: 'myRepo',
            owner: 'login',
            gist: 'https://gist.github.com/myRepo/gistId'
        }
        resGetRepoHooks = [hook]
        resGetOrgHooks = [hook]
        sinon.stub(github, 'call').callsFake(async (args) => {
            if (args.fun === 'listHooks') {
                return args.obj === 'repos' ? { data: resGetRepoHooks } : { data: resGetOrgHooks }
            } else if (args.fun === 'deleteHook') {
                return { data: hook }
            } else if (args.fun === 'createHook') {
                return { data: hook }
            }
        })
        sinon.stub(Repo, 'find').callsFake(async () => [repo])
    })
    afterEach(() => {
        github.call.restore()
        Repo.find.restore()
    })
    describe('webhook:create', () => {
        it('should create a repo webhook when both repo and org webhook does NOT exist', async () => {
            resGetRepoHooks = []
            resGetOrgHooks = []
            let expArgs = {
                obj: 'repos',
                fun: 'createHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    name: 'web',
                    config: {
                        url: url.webhook('myRepo'),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            }

            await webhook_api.create(req)
            assert(github.call.calledWithMatch(expArgs))
        })

        it('should NOT create a repo webhook when repo webhook exists', async () => {
            let expArgs = {
                obj: 'repos',
                fun: 'createHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    name: 'web',
                    config: {
                        url: url.webhook('myRepo'),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            }

            await webhook_api.create(req)
            assert(github.call.calledWithMatch(expArgs) === false)
        })

        it('should NOT create a repo webhook when corresponding org webhook exists', async () => {
            resGetRepoHooks = []
            let expArgs = {
                obj: 'repos',
                fun: 'createHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    name: 'web',
                    config: {
                        url: url.webhook('myRepo'),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            }

            await webhook_api.create(req)
            assert(github.call.calledWithMatch(expArgs) === false)
        })

        it('should create a webhook for an organization when org webhook does NOT exist', async () => {
            resGetOrgHooks = []
            let expArgs = {
                obj: 'orgs',
                fun: 'createHook',
                arg: {
                    org: testData.orgs[0].login,
                    name: 'web',
                    config: {
                        url: url.webhook(testData.orgs[0].login),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: testData.orgs[0].login,
                    orgId: testData.orgs[0].id
                }
            }

            await webhook_api.create(req)
            assert(github.call.calledWithMatch(expArgs))
        })

        it('should remove repo webhook after creating an org webhook', async () => {
            resGetOrgHooks = []
            hook.type = 'Repository'
            let expArgs = {
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    id: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    noCache: true
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: testData.orgs[0].login,
                    orgId: testData.orgs[0].id
                }
            }

            await webhook_api.create(req)
            assert(github.call.calledWithMatch(expArgs))
        })

        it('should NOT remove a webhook for a repo with NULL CLA after creating an org webhook', async () => {
            repo.gist = null
            let expArgs = {
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    id: 123,
                    repo: 'myRepo',
                    owner: 'login',
                    noCache: true
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: testData.orgs[0].login,
                    orgId: testData.orgs[0].id
                }
            }
            resGetOrgHooks = []

            await webhook_api.create(req)
            assert(!github.call.calledWithMatch(expArgs))
        })
    })

    describe('webhook:get', () => {
        it('should call github service with user token for repo hooks', async () => {
            let expArgs = {
                obj: 'repos',
                fun: 'listHooks',
                arg: {
                    owner: 'owner',
                    repo: 'myRepo'
                },
                token: 'abc'
            }
            resGetRepoHooks = [{
                active: true,
                config: {
                    url: url.webhook('myRepo'),
                    content_type: 'json'
                },
            }]

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'owner'
                }
            }

            const hooks = await webhook_api.get(req)
            assert(hooks)
            assert(github.call.calledWithMatch(expArgs))
        })

        it('should call github service with user token for org hooks when repo hook does NOT exist', async () => {
            resGetRepoHooks = []
            let expArgs = {
                obj: 'orgs',
                fun: 'listHooks',
                arg: {
                    org: 'owner'
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'owner'
                }
            }

            await webhook_api.get(req)
            assert(github.call.calledWithMatch(expArgs))
        })

        it('should call github service with user token for org hooks', async () => {
            let expArgs = {
                obj: 'orgs',
                fun: 'listHooks',
                arg: {
                    org: 'org'
                },
                token: 'abc'
            }
            resGetOrgHooks = [{
                active: true,
                config: {
                    url: url.webhook(testData.orgs[0].login),
                    content_type: 'json'
                }
            }]

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: 'org'
                }
            }

            const hooks = await webhook_api.get(req)
            assert(hooks)
            assert(github.call.calledWithMatch(expArgs))
        })
    })

    describe('webhook:remove', function () {
        it('should remove repo hook when it exists', async () => {
            hook.type = 'Repository'
            let expArgs = {
                obj: 'repos',
                fun: 'deleteHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    id: 123
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            }

            await webhook_api.remove(req)
            assert(github.call.calledWithMatch(expArgs))
        })

        it('should remove org hook when it exists', async () => {
            let expArgs = {
                obj: 'orgs',
                fun: 'deleteHook',
                arg: {
                    org: 'octocat',
                    id: 123
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: 'octocat'
                }
            }

            await webhook_api.remove(req)
            assert(github.call.calledWithMatch(expArgs))
        })

        it('should NOT create hook for repo with NULL CLA after removing org hook', async () => {
            resGetRepoHooks = []
            repo.gist = null
            let expArgs = {
                obj: 'repos',
                fun: 'createHook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    name: 'web',
                    config: {
                        url: url.webhook('myRepo'),
                        content_type: 'json'
                    },
                    events: ['pull_request'],
                    active: true
                },
                token: 'abc'
            }

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    org: 'octocat'
                }
            }

            await webhook_api.remove(req)
            assert(github.call.calledWithMatch(expArgs) === false)
        })

        it('should report an error if could not delete a repo hook', async () => {
            resGetRepoHooks = [{
                id: 123,
                active: true,
                config: {
                    url: 'any other url'
                }
            }]
            resGetOrgHooks = [{
                id: 321,
                active: true,
                config: {
                    url: 'any other url'
                }
            }]

            let req = {
                user: {
                    id: 1,
                    login: 'login',
                    token: 'abc'
                },
                args: {
                    repo: 'myRepo',
                    owner: 'login'
                }
            }
            try {
                await webhook_api.remove(req)
                assert(false, 'an error should have been thrown before')
            } catch (error) {
                assert.equal(error, 'No webhook found with base url ' + url.baseWebhook)
            }
        })
    })
})
