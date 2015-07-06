var express = require('express'),
    ejs = require('ejs'),
    fs = require('fs'),
    crypto = require('crypto');

//////////////////////////////////////////////////////////////////////////////////////////////
// Badge controller
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();


router.all('/pull/badge/:signed', function(req, res) {
    var tmp = fs.readFileSync('src/server/templates/badge_not_signed.svg', 'utf-8');
    var hash = crypto.createHash('md5').update('pending', 'utf8').digest('hex');
    var badgeText = 'Please sign our CLA!';

    if (req.params.signed === 'signed') {
        tmp = fs.readFileSync('src/server/templates/badge_signed.svg', 'utf-8');
        hash = crypto.createHash('md5').update('signed', 'utf8').digest('hex');
    }

    if(req.get('If-None-Match') === hash) {
        return res.status(304).send();
    }

    var svg = ejs.render(tmp, {text: badgeText});

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache');
    res.set('Etag', hash);
    res.send(svg);
});

module.exports = router;
