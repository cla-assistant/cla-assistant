// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

/*eslint no-empty-function: "off"*/
/*global describe, it, afterEach*/

// unit test
const assert = require('assert')
const sinon = require('sinon')
const express = require('express')
const request = require('supertest')

// config (has to be set before requiring services that access `config`)
global.config = require('../../../server/src/config')

// models (register the mongoose models the controller reads at load time)
const Repo = require('../../../server/src/documents/repo').Repo
const Org = require('../../../server/src/documents/org').Org
const CLA = require('../../../server/src/documents/cla').CLA

// services
const github = require('../../../server/src/services/github')

// controller under test
const counts = require('../../../server/src/controller/counts')

describe('counts controller', () => {
    const app = express()
    app.use(counts)

    afterEach(() => {
        sinon.restore()
    })

    describe('GET /count/repos', () => {
        it('should respond with the number of registered repositories', async () => {
            sinon.stub(Repo, 'count').resolves(42)

            const response = await request(app).get('/count/repos')

            assert.equal(response.status, 200)
            assert.deepEqual(JSON.parse(response.text), {
                count: 42,
                text: 'There are 42 registered repositories!'
            })
        })

        it('should respond with a 500 error when the repository count fails', async () => {
            sinon.stub(Repo, 'count').rejects(new Error('mongo down'))

            try {
                await request(app).get('/count/repos')
                assert.fail('expected a 500 response')
            } catch (err) {
                assert.equal(err.status, 500)
            }
            sinon.assert.calledOnce(Repo.count)
        })
    })

    describe('GET /count/orgs', () => {
        it('should respond with the number of registered organizations', async () => {
            sinon.stub(Org, 'count').resolves(7)

            const response = await request(app).get('/count/orgs')

            assert.equal(response.status, 200)
            assert.deepEqual(JSON.parse(response.text), {
                count: 7,
                text: 'There are 7 registered organizations!'
            })
        })
    })

    describe('GET /count/clas', () => {
        it('should respond with the number of signed CLAs', async () => {
            sinon.stub(CLA, 'aggregate').resolves([{ count: 5 }])

            const response = await request(app).get('/count/clas')

            assert.equal(response.status, 200)
            assert.deepEqual(JSON.parse(response.text), {
                count: 5,
                text: 'There are 5 signed CLAs!'
            })
        })

        it('should respond with a count of 0 when no CLA documents exist', async () => {
            sinon.stub(CLA, 'aggregate').resolves([])

            const response = await request(app).get('/count/clas')

            assert.equal(response.status, 200)
            assert.deepEqual(JSON.parse(response.text), {
                count: 0,
                text: 'There are 0 signed CLAs!'
            })
        })
    })

    describe('GET /count/stars', () => {
        it('should respond with the stargazers count of the repository', async () => {
            sinon.stub(github, 'callWithGitHubApp').resolves({
                data: {
                    stargazers_count: 1535
                }
            })

            const response = await request(app).get('/count/stars')

            assert.equal(response.status, 200)
            assert.deepEqual(JSON.parse(response.text), {
                count: 1535
            })
        })

        it('should respond with a 500 error when the GitHub call fails', async () => {
            sinon.stub(github, 'callWithGitHubApp').rejects(new Error('rate limited'))

            try {
                await request(app).get('/count/stars')
                assert.fail('expected a 500 response')
            } catch (err) {
                assert.equal(err.status, 500)
            }
        })
    })
})