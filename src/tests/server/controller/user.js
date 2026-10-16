// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

/*eslint no-empty-function: "off"*/
/*global describe, it, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')
const express = require('express')
const passport = require('passport')
const request = require('supertest')

// config (has to be set before requiring services that access `config`)
global.config = require('../../../server/src/config')

// controller under test
const userController = require('../../../server/src/controller/user')

describe('user controller /auth/github', () => {
    const app = express()
    app.use((req, _res, next) => {
        req.session = req.session || {}
        next()
    })
    app.use(userController)
    app.use((_req, res) => res.status(200).send('ok'))

    afterEach(() => {
        sinon.restore()
    })

    it('should not crash and request admin:org_hook scope when org_admin=true is set alone', async () => {
        const authenticate = sinon.stub(passport, 'authenticate').callsFake(() => (_req, _res, next) => next())

        const response = await request(app).get('/auth/github?org_admin=true')

        assert.equal(response.status, 200)
        sinon.assert.calledOnce(authenticate)
        assert.equal(authenticate.firstCall.args[0], 'github-app-auth')
        assert.deepEqual(authenticate.firstCall.args[1].scope, ['admin:org_hook'])
    })

    it('should use the GitHub oauth strategy with the user scope for public requests', async () => {
        const authenticate = sinon.stub(passport, 'authenticate').callsFake(() => (_req, _res, next) => next())

        await request(app).get('/auth/github?public=true')

        sinon.assert.calledOnce(authenticate)
        assert.equal(authenticate.firstCall.args[0], 'github-oauth')
        assert.deepEqual(authenticate.firstCall.args[1].scope, ['user:email'])
    })

    it('should use the GitHub App strategy with the admin scope for admin requests', async () => {
        const authenticate = sinon.stub(passport, 'authenticate').callsFake(() => (_req, _res, next) => next())

        await request(app).get('/auth/github?admin=true')

        sinon.assert.calledOnce(authenticate)
        assert.equal(authenticate.firstCall.args[0], 'github-app-auth')
        assert.deepEqual(authenticate.firstCall.args[1].scope, ['user:email', 'repo:status', 'read:repo_hook', 'write:repo_hook', 'read:org', 'gist'])
    })

    it('should extend the admin scope with admin:org_hook when org_admin=true is combined with admin=true', async () => {
        const authenticate = sinon.stub(passport, 'authenticate').callsFake(() => (_req, _res, next) => next())

        await request(app).get('/auth/github?admin=true&org_admin=true')

        sinon.assert.calledOnce(authenticate)
        assert.equal(authenticate.firstCall.args[0], 'github-app-auth')
        assert.deepEqual(authenticate.firstCall.args[1].scope, ['user:email', 'repo:status', 'read:repo_hook', 'write:repo_hook', 'read:org', 'gist', 'admin:org_hook'])
    })

    it('should compute the scope per request and not reuse a module-level array', async () => {
        const authenticate = sinon.stub(passport, 'authenticate').callsFake(() => (_req, _res, next) => next())

        await request(app).get('/auth/github?public=true')
        await request(app).get('/auth/github?admin=true')

        const firstScope = authenticate.firstCall.args[1].scope
        const secondScope = authenticate.secondCall.args[1].scope
        assert.notStrictEqual(firstScope, secondScope)
        assert.deepEqual(firstScope, ['user:email'])
        assert.deepEqual(secondScope, ['user:email', 'repo:status', 'read:repo_hook', 'write:repo_hook', 'read:org', 'gist'])
    })
})