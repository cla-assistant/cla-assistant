let express = require('express');
let path = require('path');
let cla = require('./../api/cla');
let logger = require('./../services/logger');
//////////////////////////////////////////////////////////////////////////////////////////////
// Default router
//////////////////////////////////////////////////////////////////////////////////////////////

let router = express.Router();

// router.use('/accept', function(req, res) {
router.use('/accept/:owner/:repo', async function (req, res) {
    res.set({ 'Cache-Control': 'no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0' });

    req.args = {
        owner: req.params.owner,
        repo: req.params.repo
    };

    if (req.isAuthenticated()) {
        try {
            await cla.sign(req);
        } catch (e) {
            if (e && (!e.code || e.code != 200)) {
                logger.error(e);

                return;
            }
        }

        let redirectUrl = '/' + req.args.owner + '/' + req.args.repo + '?redirect=true';
        redirectUrl = req.query.pullRequest ? redirectUrl + '&pullRequest=' + req.query.pullRequest : redirectUrl;
        res.redirect(redirectUrl);
    } else {
        req.session.next = req.originalUrl;

        return res.redirect('/auth/github?public=true');
    }
});

router.use('/signin/:owner/:repo', function (req, res) {
    let redirectUrl = '/' + req.params.owner + '/' + req.params.repo;
    req.session.next = req.query.pullRequest ? redirectUrl + '?pullRequest=' + req.query.pullRequest : redirectUrl;

    return res.redirect('/auth/github?public=true');
});

router.all('/static/*', function (req, res) {
    let filePath;
    if (req.user && req.path === '/static/cla-assistant.json') {
        filePath = path.join(__dirname, '..', '..', '..', 'cla-assistant.json');
    } else {
        filePath = path.join(__dirname, '..', '..', 'client', 'login.html');
    }
    res.setHeader('Last-Modified', (new Date()).toUTCString());
    res.status(200).sendFile(filePath);
});

router.get('/check/:owner/:repo', function (req, res) {
    let referer = req.header('Referer');
    let back = referer && referer.includes('github.com') ? referer : 'https://github.com';
    logger.info('Recheck PR requested for ', 'https://github.com/' + req.params.owner + '/' + req.params.repo + '/pull/' + req.query.pullRequest, 'referer was ' + referer);
    cla.validatePullRequest({
        owner: req.params.owner,
        repo: req.params.repo,
        number: req.query.pullRequest
    });
    res.redirect(back);
});

router.all('/*', function (req, res) {
    let filePath;
    if ((req.user && req.user.scope && req.user.scope.indexOf('write:repo_hook') > -1) || req.path !== '/') {
        filePath = path.join(__dirname, '..', '..', 'client', 'home.html');
    } else {
        filePath = path.join(__dirname, '..', '..', 'client', 'login.html');
    }
    res.setHeader('Last-Modified', (new Date()).toUTCString());
    res.status(200).sendFile(filePath);
});

module.exports = router;