var passport = require('passport');
var express = require('express');
var path = require('path');
var logger = require('./../services/logger');

//////////////////////////////////////////////////////////////////////////////////////////////
// User controller
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();
var scope;

function checkReturnTo(req, res, next) {
    scope = req.query.admin === 'true' ? config.server.github.admin_scope : config.server.github.public_scope;
    var returnTo = req.query.admin === 'true' ? '/' : req.session.next;
    if (returnTo) {
        req.session = req.session || {};
        req.session.returnTo = returnTo;
        // logger.info('returnTo ', req.session.returnTo);
    }
    next();
}

router.get('/auth/github', checkReturnTo, passport.authenticate('github', {scope: scope}));

router.get('/auth/github/callback', passport.authenticate('github', { successReturnToOrRedirect: '/' }));

router.get('/logout',
    function(req, res, next) {
        req.logout();
        res.redirect('/');
    }
);

module.exports = router;
