// SPDX-FileCopyrightText: 2023 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

const rewire = require('rewire');
const sinon = require('sinon');

// Ensure the global config is available for modules loaded transitively (e.g. logger).
global.config = global.config || require('../../../server/src/config');

const authenticated = rewire('../../../server/src/middleware/authenticated');

describe('middleware:authenticated', () => {
    let req, res, next, authenticateForAdminOnlyApi
    beforeEach(() => {
        res = {
            status: sinon.stub().returns(res),
            send: sinon.stub().returns(res)
        }
        req = {
            isAuthenticated: sinon.stub().returns(false)
        }
        authenticateForAdminOnlyApi = sinon.stub()
        authenticated.__set__('authenticateForAdminOnlyApi', authenticateForAdminOnlyApi)
        next = sinon.stub()
    })

    describe('should allow public URLs', () => {
        beforeEach(() => {
            req.originalUrl = '/api/cla/getGist'
        })
        it('should allow URLs', () => {
            authenticated(req, res, next)
            sinon.assert.calledOnce(next)
        });

        it('should allow URLs with additional slash', () => {
            req.originalUrl += '/'
            authenticated(req, res, next)
            sinon.assert.calledOnce(next)
        });

        it('should allow URLs with multiple slash', () => {
            req.originalUrl += '////'
            authenticated(req, res, next)
            sinon.assert.calledOnce(next)
        });
    });

    describe('should allow authenticated URLs for authenticated users', () => {
        beforeEach(() => {
            req.originalUrl = '/api/cla/countCLA'
            req.isAuthenticated.returns(true)
        })
        it('should allow URLs', () => {
            authenticated(req, res, next)
            sinon.assert.calledOnce(next)
        });

        it('should allow URLs with additional slash', () => {
            req.originalUrl += '/'
            authenticated(req, res, next)
            sinon.assert.calledOnce(next)
        });

        it('should allow URLs with multiple slash', () => {
            req.originalUrl += '////'
            authenticated(req, res, next)
            sinon.assert.calledOnce(next)
        });

        it('should not allow if User is not authenticated', () => {
            req.isAuthenticated.returns(false)
            req.originalUrl += '////'
            authenticated(req, res, next)
            sinon.assert.calledWith(res.status, 401)
        });
    });

    describe('should perform admin authentication for admin URLs', () => {
        beforeEach(() => {
            req.originalUrl = '/api/cla/addSignature'
        })
        it('should allow URLs', () => {
            authenticated(req, res, next)
            sinon.assert.calledOnce(authenticateForAdminOnlyApi)
        });

        it('should allow URLs with additional slash', () => {
            req.originalUrl += '/'
            authenticated(req, res, next)
            sinon.assert.calledOnce(authenticateForAdminOnlyApi)
        });

        it('should allow URLs with multiple slash', () => {
            req.originalUrl += '////'
            authenticated(req, res, next)
            sinon.assert.calledOnce(authenticateForAdminOnlyApi)
        });
    });

    describe('should not support unsupported URLs', () => {
        beforeEach(() => {
            req.originalUrl = '/api/abc-unsupported'
        })
        it('should not allow URL', () => {
            authenticated(req, res, next)
            sinon.assert.calledWith(res.status, 401)
            sinon.assert.notCalled(next)
        });
    });
});

describe('middleware:authenticateForAdminOnlyApi', () => {
    // Use a separate, un-mocked copy of the middleware (rewired once) so we exercise the
    // real authenticateForAdminOnlyApi implementation (not the routing stub above).
    // We inject fully mocked passport/utils via rewire so this suite is isolated from any
    // cross-test stubbing of the shared singletons.
    const authenticatedReal = rewire('../../../server/src/middleware/authenticated')
    let req, res, next, utils, restorePassport, restoreUtils
    const adminToken = 'ghu_admin_token'

    beforeEach(() => {
        next = sinon.stub()
        res = {
            status: sinon.stub().returnsThis(),
            send: sinon.stub().returnsThis(),
            json: sinon.stub().returnsThis()
        }
        req = {
            originalUrl: '/api/cla/getAll',
            isAuthenticated: sinon.stub().returns(true),
            user: {
                login: 'non_admin_user',
                token: adminToken,
                scope: ['admin:org_hook']
            },
            args: {}
        }

        // Inject a passport whose authenticate simply invokes its callback with the user.
        const mockPassport = {
            authenticate: (strategy, options, cb) => () => cb(null, req.user)
        }
        restorePassport = authenticatedReal.__set__('passport', mockPassport)

        // Inject a fully mocked utils so behaviour is deterministic and isolated.
        utils = {
            couldBeAdmin: sinon.stub().returns(true),
            checkRepoPushPermissionByName: sinon.stub().resolves(),
            checkOrgAdminPermission: sinon.stub().resolves(),
            checkOrgAdminPermissionById: sinon.stub().resolves()
        }
        restoreUtils = authenticatedReal.__set__('utils', utils)
    })

    afterEach(() => {
        restorePassport()
        restoreUtils()
    })

    // Runs the middleware and resolves once it has reached a terminal state
    // (either next() was called or a response status was sent). We poll instead of
    // overriding the stubs so the test's own assertions on next/res.status stay intact.
    function runAndWait() {
        authenticatedReal(req, res, next)
        return new Promise((resolve, reject) => {
            const start = Date.now()
            const check = () => {
                if (next.called || res.status.called) {
                    // allow trailing microtasks (e.g. Promise.all .then/.catch) to flush
                    return setImmediate(resolve)
                }
                if (Date.now() - start > 800) {
                    return reject(new Error('middleware did not reach a terminal state'))
                }
                setImmediate(check)
            }
            check()
        })
    }

    it('should return 403 for orgId-scoped getAll from a non-admin (mirrors org-name case)', async () => {
        req.args = { orgId: 12345, gist: { gist_url: 'https://gist.github.com/aaa' } }
        utils.checkOrgAdminPermissionById.rejects(new Error('User is not an admin of this org'))

        await runAndWait()

        sinon.assert.calledWith(res.status, 403)
        sinon.assert.notCalled(next)
        sinon.assert.calledWith(utils.checkOrgAdminPermissionById, 12345, 'non_admin_user', adminToken)
    })

    it('should return 403 for org-name-scoped getAll from a non-admin', async () => {
        req.args = { org: 'someOrg', gist: { gist_url: 'https://gist.github.com/aaa' } }
        utils.checkOrgAdminPermission.rejects(new Error('User is not an admin of this org'))

        await runAndWait()

        sinon.assert.calledWith(res.status, 403)
        sinon.assert.notCalled(next)
    })

    it('should call next for orgId-scoped getAll from an org admin and set authorizedResource', async () => {
        req.args = { orgId: 12345, gist: { gist_url: 'https://gist.github.com/aaa' } }
        utils.checkOrgAdminPermissionById.resolves({ orgId: 12345, org: 'someOrg' })

        await runAndWait()

        sinon.assert.calledOnce(next)
        sinon.assert.notCalled(res.status)
        // The verified scope must be attached for downstream scope-integrity checks.
        sinon.assert.match(req.authorizedResource, { orgId: 12345, org: 'someOrg' })
    })

    it('should fail closed with 403 when no authorizable resource identifier is provided', async () => {
        req.args = { gist: { gist_url: 'https://gist.github.com/aaa' } }

        await runAndWait()

        sinon.assert.calledWith(res.status, 403)
        sinon.assert.notCalled(next)
        sinon.assert.notCalled(utils.checkRepoPushPermissionByName)
        sinon.assert.notCalled(utils.checkOrgAdminPermission)
        sinon.assert.notCalled(utils.checkOrgAdminPermissionById)
    })

    it('should require admin:org_hook scope for orgId-scoped requests', async () => {
        req.args = { orgId: 12345, gist: { gist_url: 'https://gist.github.com/aaa' } }
        req.user.scope = []

        await runAndWait()

        sinon.assert.calledWith(res.status, 403)
        sinon.assert.notCalled(next)
    })

    it('should call next for a repo-scoped request from a user with push permission', async () => {
        req.args = { owner: 'org', repo: 'repo', gist: { gist_url: 'https://gist.github.com/aaa' } }
        utils.checkRepoPushPermissionByName.resolves({ id: 999, permissions: { push: true } })

        await runAndWait()

        sinon.assert.calledOnce(next)
        sinon.assert.notCalled(res.status)
        sinon.assert.match(req.authorizedResource, { repoId: 999 })
    })
});
