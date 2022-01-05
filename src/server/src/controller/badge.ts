import express = require('express')
import ejs = require('ejs')
import fs = require('fs')
import path = require('path')
import crypto = require('crypto')
import RateLimit = require('express-rate-limit');

//api
const cla = require('./../api/cla')

const router = express.Router()

const limiter = new RateLimit({
    windowMs: 60*60*1000, // 1 hour
    max: 60
});

router.all('/pull/badge/:signed', limiter, (req, res) => {
    const fileName = req.params.signed === 'signed' ? 'badge_signed.svg' : 'badge_not_signed.svg'
    const status = req.params.signed === 'signed' ? 'signed' : 'pending'
    const tmp = fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'templates', fileName), 'utf-8')
    const hash = crypto.createHash('md5').update(status, 'utf8').digest('hex')

    if (req.get('If-None-Match') === hash) {
        return res.status(304).send()
    }

    const svg = ejs.render(tmp)

    res.set('Content-Type', 'image/svg+xml')
    res.set('Cache-Control', 'no-cache')
    res.set('Etag', hash)
    res.send(svg)
})


router.all('/readme/badge/:owner/:repo', async (req, res) => {
    req.args = {
        owner: req.params.owner,
        repo: req.params.repo
    }
    let count = 0
    try {
        count = await cla.countCLA(req)
    } catch (error) {
        count = 0
    }
    let url = 'https://img.shields.io/badge/CLAs signed-' + count + '-0594c6.svg?'
    if (req.query) {
        url = req.query.style ? `${url}&style=${req.query.style}` : url
        url = req.query.label ? `${url}&label=${req.query.label}` : url
        url = req.query.colorB ? `${url}&colorB=${req.query.colorB}` : url
        url = req.query.logo ? `${url}&logo=${req.query.logo}` : url
    }
    res.redirect(url)
})

module.exports = router
