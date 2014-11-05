var merge = require('merge');

module.exports = function(req, res, next) {

    req.args = merge(req.body, req.query);

    next();

};
