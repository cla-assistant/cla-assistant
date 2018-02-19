// module
let github = require('../services/github');
let merge = require('merge');

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
