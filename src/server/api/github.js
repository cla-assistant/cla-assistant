// module
var github = require('../services/github');
var merge = require('merge');
var path = require('path');
// models
var User = require('mongoose').model('User');

module.exports = {
    call: function(req, done) {
        github.call(merge(req.args, {
            token: req.user.token
        }), function(err, res, meta) {
            done(err, {
                data: res,
                meta: meta
            });
        });
    }
};
