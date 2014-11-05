var express = require('express'),
    ejs = require('ejs'),
    fs = require('fs'),
    crypto = require('crypto');

//////////////////////////////////////////////////////////////////////////////////////////////
// Badge controller
//////////////////////////////////////////////////////////////////////////////////////////////

var router = express.Router();
var github = require('../services/github');
var cla = require('../services/cla');

router.all('/:repoId/pull/:number/badge', function(req, res) {
    github.call({
        obj: 'repos',
        fun: 'one',
        arg: {
            id: req.params.repoId
        }
    }, function(err, githubRepo) {
        if(err) {
            return res.send(err);
        }
        github.call({
            obj: 'pullRequests',
            fun: 'get',
            arg: {
                user: githubRepo.owner.login,
                repo: githubRepo.name,
                number: req.params.number
            }
        }, function(err, githubPullRequest) {
            if(err) {
                return res.send(err);
            }
            var args = {repo: githubPullRequest.base.repo.name, user: githubPullRequest.head.user.id};
            cla.check(args, function(err, signed){
                if(err) {
                    return res.send(err);
                }

                var tmp = fs.readFileSync('src/server/templates/badge_not_signed.svg', 'utf-8');
                var hash = crypto.createHash('md5').update('pending', 'utf8').digest('hex');
                var badgeText = 'Please sign our CLA!';

                if (signed) {
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
        });
    });
});

module.exports = router;
