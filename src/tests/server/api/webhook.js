// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

// unit test
const assert = require('assert')
const sinon = require('sinon')

// module
const github = require('../../../server/src/services/github')
const url = require('../../../server/src/services/url')

//model
const Repo = require('../../../server/src/documents/repo').Repo

// api
const webhook_api = require('../../../server/src/api/webhook')

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
            if (args.fun === 'listWebhooks') {
                return args.obj === 'repos' ? {
                    data: resGetRepoHooks
                } : {
                        data: resGetOrgHooks
                    }
            } else if (args.fun === 'deleteWebhook') {
                return {
                    data: hook
                }
            } else if (args.fun === 'createWebhook') {
                return {
                    data: hook
                }
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
                fun: 'createWebhook',
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
                fun: 'createWebhook',
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
                fun: 'createWebhook',
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
                fun: 'createWebhook',
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
                fun: 'deleteWebhook',
                arg: {
                    hook_id: 123,
                    repo: 'myRepo',
                    owner: 'login'
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
                fun: 'deleteWebhook',
                arg: {
                    hook_id: 123,
                    repo: 'myRepo',
                    owner: 'login'
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
                fun: 'listWebhooks',
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
                fun: 'listWebhooks',
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

        it('should NOT throw an error when repo hook does NOT exist and owner is not an org', async () => {
            github.call.restore()
            sinon.stub(github, 'call').callsFake(async (args) => {
                if (args.obj === 'repos') {
                    return {
                        data: resGetRepoHooks
                    }
                }
                const error = new Error()
                error.status = 404
                throw error
            })
            resGetRepoHooks = []
            let expArgs = {
                obj: 'orgs',
                fun: 'listWebhooks',
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
                fun: 'listWebhooks',
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
                fun: 'deleteWebhook',
                arg: {
                    owner: 'login',
                    repo: 'myRepo',
                    hook_id: 123
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
                fun: 'deleteWebhook',
                arg: {
                    org: 'octocat',
                    hook_id: 123
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
                fun: 'createWebhook',
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
