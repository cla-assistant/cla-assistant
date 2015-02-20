// modules
var express = require('express');

// models
var Repo = require('mongoose').model('Repo');
var CLA = require('mongoose').model('CLA');

var router = express.Router();

router.all('/count/repos', function(req, res) {
	Repo.count({}, function(err, count) {
		res.set('Content-Type', 'application/json');
        res.send(JSON.stringify({
            count: count,
            text: 'There are ' + count + ' registered repositories!'
        }));
    });
});

router.all('/count/clas', function(req, res) {
	CLA.aggregate( [{'$group': { '_id': { repo: '$repo',
										owner: '$owner',
										user: '$user',
										gist_url: '$gist_url'}
	}}], function(err, data){
		res.set('Content-Type', 'application/json');
		res.send(JSON.stringify({
			count: data.length,
			text: 'There are ' + data.length + ' signed CLAs!'
		}));
	});
});

module.exports = router;
