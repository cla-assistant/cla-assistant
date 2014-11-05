var express = require('express');
var path = require('path');
var cla = require('./../api/cla');
var url = require('./../services/url');

//////////////////////////////////////////////////////////////////////////////////////////////
// Default router
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();

// router.use('/accept', function(req, res) {
router.use('/accept/:owner/:repo', function(req, res) {
	req.args = {owner: req.params.owner, repo: req.params.repo};

    if (req.isAuthenticated()) {
		cla.sign(req, function(err, data){
			var redirectUrl = path.join(path.sep, req.args.owner, req.args.repo);
			redirectUrl = data && data.pullRequest ? redirectUrl + '?pullRequest=' + data.pullRequest : redirectUrl;
			res.redirect(redirectUrl);
		});

    } else {
		req.session.next = req.baseUrl;
		return res.redirect('/login');
    }
});

router.all('/login', function(req, res){
	return res.sendFile('login.html', {root: path.join(__dirname, '..', '..', 'client')});
	// return res.sendFile('login.html', {root: __dirname + './../../client'});
});

router.all('/*', function(req, res) {
    return res.sendFile('home.html', {root: path.join(__dirname, '..', '..', 'client')});
});

module.exports = router;
