var express = require('express');
var path = require('path');
var cla = require('./../api/cla');
var logger = require('./../services/logger');
//////////////////////////////////////////////////////////////////////////////////////////////
// Default router
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();

// router.use('/accept', function(req, res) {
router.use('/accept/:owner/:repo', function(req, res) {
	req.args = {owner: req.params.owner, repo: req.params.repo};

    if (req.isAuthenticated()) {
		cla.sign(req, function (err) {
			var signed = true;
			if (err) {
				logger.error(err);
				signed = false;
			}
			var redirectUrl = path.join(path.sep, req.args.owner, req.args.repo) + '?redirect=true';
			redirectUrl = req.query.pullRequest ? redirectUrl + '&pullRequest=' + req.query.pullRequest : redirectUrl;
			res.redirect(redirectUrl);
		});

    } else {
		req.session.next = req.originalUrl;
		return res.redirect('/auth/github?public=true');
    }
});

router.use('/signin/:owner/:repo', function (req, res) {
	var redirectUrl = path.join(path.sep, req.params.owner, req.params.repo);
	req.session.next = req.query.pullRequest ? redirectUrl + '?pullRequest=' + req.query.pullRequest : redirectUrl;

	return res.redirect('/auth/github?public=true');
});

router.all('/static/*', function(req, res) {
	var filePath;
	if (req.user && req.path === '/static/cla-assistant.json') {
		filePath = path.join(__dirname, '..', '..', '..', 'cla-assistant.json');
	}
	else {
		filePath = path.join(__dirname, '..', '..', 'client', 'login.html');
	}
	res.setHeader('Last-Modified', (new Date()).toUTCString());
	res.status(200).sendFile(filePath);
});

router.all('/*', function(req, res) {
	var filePath;
	if ((req.user && req.user.scope && req.user.scope.indexOf('write:repo_hook') > -1) || req.path !== '/') {
		filePath = path.join(__dirname, '..', '..', 'client', 'home.html');
	}
	else {
		filePath = path.join(__dirname, '..', '..', 'client', 'login.html');
	}
	res.setHeader('Last-Modified', (new Date()).toUTCString());
	res.status(200).sendFile(filePath);
});

module.exports = router;
