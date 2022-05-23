// SPDX-FileCopyrightText: 2022 SAP SE or an SAP affiliate company and CLA-assistant contributors
//
// SPDX-License-Identifier: Apache-2.0

// modules
const express = require('express')

// models
const Repo = require('mongoose').model('Repo')
const Org = require('mongoose').model('Org')
const CLA = require('mongoose').model('CLA')

const router = express.Router()

//services
const logger = require('./../services/logger')
const github = require('./../services/github')

router.post('/count/*', (_req, _res, next) => next())

router.all('/count/repos', async (req, res) => {
    try {
        const repoCount = await Repo.count({})
        res.set('Content-Type', 'application/json')
        res.send(JSON.stringify({
            count: repoCount,
            text: `There are ${repoCount} registered repositories!`
        }))
    } catch (error) {
        logger.info(error)
    }
})

router.all('/count/orgs', async (req, res) => {
    try {
        const orgsCount = await Org.count({})
        res.set('Content-Type', 'application/json')
        res.send(JSON.stringify({
            count: orgsCount,
            text: `There are ${orgsCount} registered organizations!`
        }))
    } catch (error) {
        res.status(500).send(error)
        logger.info(error)
    }
})

router.all('/count/clas', async (req, res) => {
    let data
    try {
        data = await CLA.aggregate([{
            '$group': {
                '_id': {
                    'repo': '$repo',
                    'owner': '$owner',
                    'user': '$user'
                }
            }
        }, {
            '$count': 'count'
        }])
    } catch (error) {
        logger.info(error)
    }
    if (!Array.isArray(data) || data[0].count === undefined) {
        data = [{ count: 0 }]
    }
    res.set('Content-Type', 'application/json')
    let text = {
        text: `There are ${data[0].count} signed CLAs!`
    }
    res.send(JSON.stringify({
        count: data[0].count,
        text: text.text
    }))
})

router.all('/count/stars', async (_req, res) => {
    let resp
    try {
        resp = await github.callWithGitHubApp({
            obj: 'repos',
            fun: 'get',
            arg: {
                owner: 'cla-assistant',
                repo: 'cla-assistant'
            },
            token: config.server.github.token,
            owner: 'cla-assistant'
        })
    } catch (error) {
        logger.info(error)
    }
    res.send(JSON.stringify({
        count: resp.data.stargazers_count
    }))
})

module.exports = router