const rewire = require('rewire');
const sinon = require('sinon');

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
