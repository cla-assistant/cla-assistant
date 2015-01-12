// module
var github = require('../services/github');
var merge = require('merge');

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
    },

    direct_call: function(req, done) {
        return github.direct_call(merge(req.args, {
            token: req.user.token}), done);
    }
};
