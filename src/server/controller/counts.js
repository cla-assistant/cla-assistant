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
        const repos = await Repo.find({})
        res.set('Content-Type', 'application/json')
        let list = ''
        if (req.query.last && repos.length > 0) {
            let fullName = `${repos[repos.length - 1].owner}/${repos[repos.length - 1].repo}`
            list = `\n Newest repo is https://github.com/${fullName}`
        } else if (repos.length > 0) {
            repos.forEach((repo, i) => list += `\n ${++i}. ${repo.owner}/${repo.repo}`)
        }
        res.send(JSON.stringify({
            count: repos.length,
            text: `There are ${repos.length} registered repositories!${list}`,
            mrkdwn_in: ['text']
        }))
    } catch (error) {
        logger.info(error)
    }
})

router.all('/count/orgs', async (req, res) => {
    try {
        const orgs = await Org.find({})
        res.set('Content-Type', 'application/json')
        let list = ''
        if (req.query.last && orgs.length > 0) {
            let orgName = orgs[orgs.length - 1].org
            list = `\n Newest org is https://github.com/${orgName}`
        } else if (orgs.length > 0) {
            orgs.forEach((org, i) => list += `\n ${++i}. ${org.org}`)
        }
        res.send(JSON.stringify({
            count: orgs.length,
            text: `There are ${orgs.length} registered organizations!${list}`,
            mrkdwn_in: ['text']
        }))
    } catch (error) {
        res.status(500).send(error)
        logger.info(error)
    }
})

router.all('/count/clas', async (req, res) => {
    if (req.query.last) {
        try {
            const cla = await CLA.find().sort({ 'created_at': -1 }).limit(1)
            res.set('Content-Type', 'application/json')
            let fullName = `${cla[0].owner}/${cla[0].repo}`

            res.send(JSON.stringify({
                text: `${cla[0].user} signed a CLA for https://github.com/${fullName}`
            }))
        } catch (error) {
            res.status(500).send(error)
            logger.info(error)
        }
    } else {
        let data
        try {
            data = await CLA.aggregate([{
                '$group': {
                    '_id': {
                        repo: '$repo',
                        owner: '$owner',
                        user: '$user'
                    }
                }
            }])
        } catch (error) {
            logger.info(error)
        }
        if (!Array.isArray(data)) {
            data = []
        }
        res.set('Content-Type', 'application/json')
        let text = { text: `There are ${data.length} signed CLAs!` }
        text.attachments = []
        let list = {}
        if (req.query.detailed) {
            data.forEach((cla) => {
                list[`${cla._id.owner}/${cla._id.repo}`] = list[`${cla._id.owner}/${cla._id.repo}`] ? list[`${cla._id.owner}/${cla._id.repo}`] : []
                list[`${cla._id.owner}/${cla._id.repo}`].push(cla._id.user)
            })
            for (let repository in list) {
                let users = list[repository]
                text.attachments.push({
                    title: repository,
                    // pretext: Pretext _supports_ mrkdwn,
                    text: `CLA is signed by ${users.length} committer(s): ${JSON.stringify(users)}`,
                    mrkdwn_in: ['title']
                })
            }
        }
        // text = list ? text + list : text
        res.send(JSON.stringify({
            count: data.length,
            text: text.text,
            attachments: text.attachments
        }))
    }
})

router.all('/count/stars', async (_req, res) => {
    let resp
    try {
        resp = await github.call({
            obj: 'repos',
            fun: 'get',
            arg: {
                owner: 'cla-assistant',
                repo: 'cla-assistant'
            },
            basicAuth: {
                user: config.server.github.user,
                pass: config.server.github.pass
            }
        })
    } catch (error) {
        logger.info(error)
    }
    res.send(JSON.stringify({
        count: resp.data.stargazers_count
    }))
})

module.exports = router
