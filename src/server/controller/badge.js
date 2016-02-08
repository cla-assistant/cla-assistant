var express = require('express'),
    ejs = require('ejs'),
    fs = require('fs'),
    crypto = require('crypto');

//services
var repo = require('./../services/repo');
var cla = require('./../services/cla');

var CLA = require('mongoose').model('CLA');
//////////////////////////////////////////////////////////////////////////////////////////////
// Badge controller
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();


router.all('/pull/badge/:signed', function (req, res) {
    var tmp = fs.readFileSync('src/server/templates/badge_not_signed.svg', 'utf-8');
    var hash = crypto.createHash('md5').update('pending', 'utf8').digest('hex');
    var badgeText = 'Please sign our CLA!';

    if (req.params.signed === 'signed') {
        tmp = fs.readFileSync('src/server/templates/badge_signed.svg', 'utf-8');
        hash = crypto.createHash('md5').update('signed', 'utf8').digest('hex');
    }

    if (req.get('If-None-Match') === hash) {
        return res.status(304).send();
    }

    var svg = ejs.render(tmp, {
        text: badgeText
    });

    res.set('Content-Type', 'image/svg+xml');
    res.set('Cache-Control', 'no-cache');
    res.set('Etag', hash);
    res.send(svg);
});


router.all('/readme/badge/:owner/:repo', function (req, res) {
    var args = {
        owner: req.params.owner,
        repo: req.params.repo
    };
    var redirect = function(count){
        console.log(count);
        res.redirect('https://img.shields.io/badge/CLAs signed-' + count + '-0594c6.svg');
    };
    repo.get(args, function (err, repodata) {
        if (err || !repodata) {
            redirect(0);
            return;
        }
        CLA.aggregate([{
            '$match': {
                repo: req.params.repo,
                owner: req.params.owner,
                gist_url: repodata.gist
            }
        }, {
            '$group': {
                '_id': {
                    user: '$user'
                }
            }
        }], function (e, data) {
            count = data.length || 0;
            redirect(count);
        });
    });

});

module.exports = router;
